// @vitest-environment node
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { downstreamIds, testsOf, upstreamIds } from '../domain/graph';
import type { SourceRef } from '../domain/model';

import { unlistedTargets } from './commands';
import { catalog } from './index';

/** 카탈로그가 설명하는 저장소. 이 테스트는 그 파일을 읽기만 한다. */
const ROOT = join(import.meta.dirname, '../../../..');
const APP_SRC = join(import.meta.dirname, '..');

const exists = (path: string) => existsSync(join(ROOT, path));
const read = (path: string) => readFileSync(join(ROOT, path), 'utf8');
const readJson = <T = Record<string, unknown>>(path: string) => JSON.parse(read(path)) as T;

type Manifest = {
  name?: string;
  private?: boolean;
  main?: string;
  files?: string[];
  exports?: Record<string, unknown>;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

const SKIP = new Set(['node_modules', 'dist', 'out-tsc', 'test-output', '.expo', 'tmp']);

const filesUnder = (path: string): string[] => {
  if (statSync(join(ROOT, path)).isFile()) return [path];
  return readdirSync(join(ROOT, path), { withFileTypes: true }).flatMap((entry) =>
    SKIP.has(entry.name) ? [] : filesUnder(`${path}/${entry.name}`),
  );
};

const childrenOf = (path: string) =>
  readdirSync(join(ROOT, path), { withFileTypes: true }).filter((entry) => !SKIP.has(entry.name));

const { applications, packages, tools, relations, documents, records, commands, tests } = catalog;
const projects = [...applications, ...packages];
const entities = [...projects, ...tools];
const entityIds = new Set(entities.map((entity) => entity.id));
const byId = new Map(entities.map((entity) => [entity.id, entity]));
const packageByName = new Map(packages.map((pkg) => [pkg.packageName, pkg]));

const isCanonical = (path: string) =>
  path.length > 0 &&
  !path.includes('\\') &&
  !path.includes('#') &&
  !path.includes('://') &&
  path.split('/').every((segment) => segment !== '' && segment !== '.' && segment !== '..');

/** 카탈로그가 인용하는 모든 저장소 경로. */
const citedRefs = (): { ref: SourceRef; origin: string }[] => [
  ...catalog.repository.evidence.map((ref) => ({ ref, origin: 'repository' })),
  { ref: catalog.repository.purpose.source, origin: 'repository purpose' },
  ...(catalog.repository.gaps ?? []).flatMap((gap) =>
    gap.evidence.map((ref) => ({ ref, origin: 'repository gap' })),
  ),
  ...entities.flatMap((entity) => [
    {
      ref:
        'rootKind' in entity && entity.rootKind === 'file'
          ? { path: entity.root }
          : { path: entity.root, directory: true as const },
      origin: `${entity.id} root`,
    },
    ...entity.source.map((ref) => ({ ref, origin: `${entity.id} source` })),
    ...(entity.gaps ?? []).flatMap((gap) =>
      gap.evidence.map((ref) => ({ ref, origin: `${entity.id} gap` })),
    ),
  ]),
  ...projects.flatMap((project) => [
    { ref: project.nxManifest, origin: `${project.id} nx manifest` },
    ...(project.packageManifest ? [{ ref: project.packageManifest, origin: project.id }] : []),
  ]),
  ...tools.flatMap((tool) =>
    tool.packageManifest ? [{ ref: tool.packageManifest, origin: `${tool.id} manifest` }] : [],
  ),
  ...packages.flatMap((pkg) => [
    ...(pkg.barrel ? [{ ref: pkg.barrel, origin: `${pkg.id} barrel` }] : []),
    ...(pkg.surfaceGuard ? [{ ref: pkg.surfaceGuard, origin: `${pkg.id} surface guard` }] : []),
    ...pkg.entries
      .filter((entry) => entry.origin === 'committed')
      .map((entry) => ({ ref: { path: entry.target }, origin: `${pkg.id} entry` })),
  ]),
  ...relations.map((relation) => ({ ref: relation.evidence, origin: relation.id })),
  ...documents.map((doc) => ({ ref: { path: doc.path }, origin: doc.id })),
  ...records.flatMap((record) => [
    { ref: { path: record.path }, origin: record.id },
    ...record.sources.map((ref) => ({ ref, origin: `${record.id} source` })),
  ]),
  ...tests.flatMap((suite) => [
    { ref: suite.config, origin: suite.id },
    ...(suite.files ?? []).map((ref) => ({ ref, origin: suite.id })),
  ]),
];

const duplicates = (ids: string[]) => ids.filter((id, index) => ids.indexOf(id) !== index);

describe('ids', () => {
  it('are unique within each kind of record, and across applications, packages, and tools', () => {
    expect(duplicates(entities.map((entity) => entity.id))).toEqual([]);
    expect(duplicates(relations.map((relation) => relation.id))).toEqual([]);
    expect(duplicates(documents.map((doc) => doc.id))).toEqual([]);
    expect(duplicates(records.map((record) => record.id))).toEqual([]);
    expect(duplicates(commands.map((command) => command.id))).toEqual([]);
    expect(duplicates(tests.map((suite) => suite.id))).toEqual([]);
  });
});

describe('references', () => {
  const commandIds = new Set(commands.map((command) => command.id));
  const documentIds = new Set(documents.map((doc) => doc.id));

  it('resolve for every relation end', () => {
    const broken = relations.flatMap((relation) =>
      [relation.from, relation.to]
        .filter((id) => !entityIds.has(id))
        .map((id) => `${relation.id} → ${id}`),
    );
    expect(broken).toEqual([]);
  });

  it('resolve for every command and document an entity names', () => {
    const broken = entities.flatMap((entity) => [
      ...entity.commands
        .filter((id) => !commandIds.has(id))
        .map((id) => `${entity.id} command ${id}`),
      ...entity.docs.filter((id) => !documentIds.has(id)).map((id) => `${entity.id} doc ${id}`),
    ]);
    expect(broken).toEqual([]);
  });

  it('resolve for every document and test a record cites', () => {
    const testIds = new Set(tests.map((suite) => suite.id));
    const broken = records.flatMap((record) => [
      ...record.docs.filter((id) => !documentIds.has(id)).map((id) => `${record.id} doc ${id}`),
      ...record.tests.filter((id) => !testIds.has(id)).map((id) => `${record.id} test ${id}`),
    ]);
    expect(broken).toEqual([]);
  });

  it('resolve for every test suite command and subject', () => {
    const broken = tests.flatMap((suite) => [
      ...(commandIds.has(suite.command) ? [] : [`${suite.id} command ${suite.command}`]),
      ...suite.subjects.filter((id) => !entityIds.has(id)).map((id) => `${suite.id} subject ${id}`),
    ]);
    expect(broken).toEqual([]);
  });
});

describe('source paths', () => {
  it('are canonical repository paths that exist, with every symbol written in the file', () => {
    const problems = citedRefs().flatMap(({ ref, origin }) => {
      if (!isCanonical(ref.path)) return [`${origin}: not canonical ${ref.path}`];
      if (!exists(ref.path)) return [`${origin}: missing ${ref.path}`];
      const directory = statSync(join(ROOT, ref.path)).isDirectory();
      if (directory !== (ref.directory === true)) {
        return [
          `${origin}: ${ref.path} directory flag is ${ref.directory === true}, disk says ${directory}`,
        ];
      }
      if (ref.symbol && !read(ref.path).includes(ref.symbol)) {
        return [`${origin}: ${ref.symbol} not in ${ref.path}`];
      }
      return [];
    });
    expect(problems).toEqual([]);
  });

  it('keep build outputs and generated artifacts as canonical paths, never checked on disk', () => {
    const outputs = [
      ...packages.flatMap((pkg) =>
        pkg.entries.filter((entry) => entry.origin === 'build-output').map((entry) => entry.target),
      ),
      ...relations.flatMap((relation) =>
        relation.kind === 'generated-artifact' ? relation.artifacts : [],
      ),
    ];
    expect(outputs.filter((path) => !isCanonical(path))).toEqual([]);
  });
});

describe('package manifests', () => {
  const releaseProjects = readJson<{ release: { projects: string[] } }>('nx.json').release.projects;

  it.each(packages.map((pkg) => [pkg.id, pkg] as const))('%s matches its manifests', (_id, pkg) => {
    const manifest = readJson<Manifest>(pkg.packageManifest.path);
    expect(manifest.name).toBe(pkg.packageName);
    expect(readJson<Manifest>(pkg.nxManifest.path).name).toBe(pkg.nxProject);
    expect(pkg.visibility).toBe(manifest.private === true ? 'internal' : 'public');
    if (pkg.visibility === 'public') expect(releaseProjects).toContain(pkg.packageName);
  });

  it.each(packages.map((pkg) => [pkg.id, pkg] as const))(
    '%s lists exactly the entry points its manifest declares',
    (_id, pkg) => {
      const manifest = readJson<Manifest>(pkg.packageManifest.path);
      const declared = manifest.exports
        ? Object.keys(manifest.exports).map((subpath) =>
            subpath === '.' ? pkg.packageName : `${pkg.packageName}/${subpath.slice(2)}`,
          )
        : manifest.main
          ? [pkg.packageName]
          : (manifest.files ?? []).map((file) => `${pkg.packageName}/${file}`);
      expect(pkg.entries.map((entry) => entry.specifier).sort()).toEqual(declared.sort());
      for (const entry of pkg.entries.filter((e) => e.origin === 'build-output')) {
        expect(entry.target.startsWith(`${pkg.root}/dist/`)).toBe(true);
      }
    },
  );

  it('give every package with a `.` export its source barrel', () => {
    for (const pkg of packages) {
      const manifest = readJson<Manifest>(pkg.packageManifest.path);
      const hasDot = Object.keys(manifest.exports ?? {}).includes('.');
      expect({ id: pkg.id, barrel: pkg.barrel !== undefined }).toEqual({
        id: pkg.id,
        barrel: hasDot,
      });
    }
  });

  it('give applications and tools no import entry point in their manifests', () => {
    for (const entity of [...applications, ...tools]) {
      if (!entity.packageManifest) continue;
      const manifest = readJson<Manifest>(entity.packageManifest.path);
      expect({ id: entity.id, exports: manifest.exports, main: manifest.main }).toEqual({
        id: entity.id,
        exports: undefined,
        main: undefined,
      });
    }
  });

  it('take application and tool visibility from their own manifests', () => {
    for (const entity of [...applications, ...tools]) {
      if (!entity.packageManifest) {
        expect({ id: entity.id, visibility: entity.visibility }).toEqual({
          id: entity.id,
          visibility: undefined,
        });
        continue;
      }
      const manifest = readJson<Manifest>(entity.packageManifest.path);
      expect({ id: entity.id, name: entity.packageName, visibility: entity.visibility }).toEqual({
        id: entity.id,
        name: manifest.name,
        visibility: manifest.private === true ? 'internal' : 'public',
      });
    }
  });

  it('match for applications and Nx-backed tools', () => {
    for (const app of applications) {
      expect(readJson<Manifest>(app.nxManifest.path).name).toBe(app.nxProject);
      if (app.packageManifest) {
        expect(readJson<Manifest>(app.packageManifest.path).name).toBe(app.packageName);
      }
    }
    for (const tool of tools.filter((t) => t.nxProject)) {
      expect(readJson<Manifest>(`${tool.root}/project.json`).name).toBe(tool.nxProject);
    }
  });

  it('back the repository metadata', () => {
    const { repository } = catalog;
    const plugin = readJson<{ repository: string }>(
      'plugins/berry-commit/.claude-plugin/plugin.json',
    );
    expect(plugin.repository).toBe(repository.webUrl);
    expect(repository.webUrl).toBe(`https://github.com/${repository.owner}/${repository.name}`);
    expect(readJson<{ defaultBase: string }>('nx.json').defaultBase).toBe(repository.defaultBranch);
    expect(read(repository.purpose.source.path)).toContain(repository.purpose.text);
    // 패키지 매니저 버전이 고정되지 않았다는 gap 이 아직 사실인지.
    const pinned = readJson<{ packageManager?: string }>('package.json').packageManager;
    const unpinnedGap = repository.gaps?.some((gap) => gap.kind === 'not-found');
    expect({ pinned, unpinnedGap }).toEqual({ pinned: undefined, unpinnedGap: true });
  });
});

describe('completeness', () => {
  const roots = (list: { root: string }[]) => list.map((item) => item.root).sort();
  const projectDirs = (parent: string) =>
    childrenOf(parent)
      .filter((entry) => entry.isDirectory() && exists(`${parent}/${entry.name}/project.json`))
      .map((entry) => `${parent}/${entry.name}`)
      .sort();

  it('registers every Nx project under apps and libs', () => {
    expect(roots([...applications])).toEqual(projectDirs('apps'));
    expect(roots([...packages])).toEqual(projectDirs('libs'));
  });

  it('registers every tool under tools and plugins', () => {
    const expected = [
      ...childrenOf('tools/scripts').map((entry) => `tools/scripts/${entry.name}`),
      ...childrenOf('tools/evals')
        .filter((entry) => entry.isDirectory())
        .map((entry) => `tools/evals/${entry.name}`),
      ...childrenOf('tools')
        .filter((entry) => entry.isDirectory() && !['scripts', 'evals'].includes(entry.name))
        .map((entry) => `tools/${entry.name}`),
      ...childrenOf('plugins')
        .filter((entry) => entry.isDirectory())
        .map((entry) => `plugins/${entry.name}`),
    ].sort();
    expect(roots([...tools])).toEqual(expected);
  });

  it('registers every README · AGENTS · docs markdown, so a new document is not missed', () => {
    const guide = /(^|\/)(README|AGENTS|AGENTS\.consumer|CHANGELOG)\.md$/;
    const onDisk = [
      ...['README.md', 'AGENTS.md', 'CHANGELOG.md'].filter(exists),
      ...['apps', 'libs', 'tools', 'plugins', 'docs'].flatMap(filesUnder),
    ].filter((path) => path.endsWith('.md') && (path.startsWith('docs/') || guide.test(path)));
    const registered = new Set([...documents, ...records].map((doc) => doc.path));
    expect(onDisk.filter((path) => !registered.has(path))).toEqual([]);
  });
});

describe('relations', () => {
  /** `@berrypjh/*` 의존을 매니페스트에서 읽어 관계로 바꾼 것. */
  const declared = projects.flatMap((project) => {
    if (!project.packageManifest) return [];
    const manifest = readJson<Manifest>(project.packageManifest.path);
    const edges = (field: 'dependencies' | 'devDependencies' | 'peerDependencies') =>
      Object.keys(manifest[field] ?? {})
        .filter((name) => packageByName.has(name))
        .map((name) => `${field}:${project.id}->${packageByName.get(name)?.id}`);
    return [...edges('dependencies'), ...edges('devDependencies'), ...edges('peerDependencies')];
  });

  it('record every workspace package dependency in the manifests, with its kind from the field', () => {
    const recorded = relations.flatMap((relation) =>
      (relation.kind === 'consumer-dependency' || relation.kind === 'build-dependency') &&
      (relation.declaredBy === 'dependencies' ||
        relation.declaredBy === 'devDependencies' ||
        relation.declaredBy === 'peerDependencies')
        ? [`${relation.declaredBy}:${relation.from}->${relation.to}`]
        : [],
    );
    expect(recorded.sort()).toEqual(declared.sort());
  });

  it('record implicit dependencies and source imports from their evidence', () => {
    for (const relation of relations) {
      if (relation.kind !== 'build-dependency' && relation.kind !== 'consumer-dependency') continue;
      if (relation.declaredBy === 'implicitDependencies') {
        const project = readJson<{ implicitDependencies?: string[] }>(relation.evidence.path);
        const target = projects.find((p) => p.id === relation.to);
        expect(project.implicitDependencies).toContain(target?.nxProject);
      }
      if (relation.declaredBy === 'source-import') {
        const pkg = packages.find((p) => p.id === relation.to);
        expect(read(relation.evidence.path)).toContain(`'${pkg?.packageName}'`);
      }
    }
  });

  it('name the producer or every artifact in generated-artifact evidence', () => {
    for (const relation of relations) {
      if (relation.kind !== 'generated-artifact') continue;
      const text = read(relation.evidence.path);
      const producer = byId.get(relation.from);
      const named =
        (producer && text.includes(producer.root)) ||
        relation.artifacts.every((artifact) => text.includes(artifact));
      expect({ relation: relation.id, named }).toEqual({ relation: relation.id, named: true });
    }
  });

  it('name the verified subject in verification evidence', () => {
    for (const relation of relations) {
      if (relation.kind !== 'verification') continue;
      expect(read(relation.evidence.path)).toContain(relation.to);
    }
  });
});

describe('commands', () => {
  const scripts = readJson<Manifest>('package.json').scripts ?? {};
  const manifestOf = new Map(
    [...projects, ...tools].flatMap((entity) =>
      entity.nxProject ? [[entity.nxProject, `${entity.root}/project.json`] as const] : [],
    ),
  );
  const targetsOf = (project: string) => {
    const manifest = manifestOf.get(project);
    return manifest && exists(manifest)
      ? Object.keys(readJson<{ targets?: object }>(manifest).targets ?? {})
      : [];
  };

  it('record every pnpm script a tool tells people to run but the root does not define', () => {
    const toolText = filesUnder('tools')
      .filter((path) => /\.(ts|md)$/.test(path))
      .map((path) => ({ path, text: read(path) }));
    const missing = toolText.flatMap(({ path, text }) =>
      [...text.matchAll(/pnpm ([a-z][\w-]*:[\w:-]+)/g)]
        .map((m) => m[1])
        .filter((name) => !(name in scripts))
        .map((name) => `${path} ${name}`),
    );
    const recorded = tools.flatMap((tool) =>
      (tool.gaps ?? [])
        .filter((gap) => gap.kind === 'doc-code-mismatch')
        .flatMap((gap) =>
          gap.evidence.map((ref) => `${ref.path} ${ref.symbol?.replace('pnpm ', '')}`),
        ),
    );
    expect([...new Set(missing)].sort()).toEqual(recorded.sort());
  });

  it('cover every root script, and nothing else', () => {
    const cataloged = commands.flatMap((c) =>
      c.source.kind === 'package-script' ? [c.source.script] : [],
    );
    expect(duplicates(cataloged)).toEqual([]);
    expect([...cataloged].sort()).toEqual(Object.keys(scripts).sort());
  });

  it('cover every explicit Nx target, or say why it is left out', () => {
    const cataloged = new Set(
      commands.flatMap((c) =>
        c.source.kind === 'nx-target' ? [`${c.source.project}:${c.source.target}`] : [],
      ),
    );
    const unlisted = new Set(unlistedTargets.map((t) => `${t.project}:${t.target}`));
    const explicit = [...manifestOf.keys()].flatMap((project) =>
      targetsOf(project).map((target) => `${project}:${target}`),
    );
    expect(explicit.filter((id) => !cataloged.has(id) && !unlisted.has(id))).toEqual([]);
    expect([...cataloged, ...unlisted].filter((id) => !explicit.includes(id))).toEqual([]);
    expect([...cataloged].filter((id) => unlisted.has(id))).toEqual([]);
  });

  it('back every constraint with a file that says it', () => {
    const problems = commands.flatMap((command) =>
      command.constraints.flatMap(({ kind, evidence }) => {
        if (!exists(evidence.path)) return [`${command.id} ${kind}: missing ${evidence.path}`];
        return evidence.symbol && !read(evidence.path).includes(evidence.symbol)
          ? [`${command.id} ${kind}: "${evidence.symbol}" not in ${evidence.path}`]
          : [];
      }),
    );
    expect(problems).toEqual([]);
  });

  it('fall each into one declared group, and leave no group empty', () => {
    const groups = new Set(catalog.commandGroups.map((group) => group.id));
    expect(commands.filter((c) => !groups.has(c.group)).map((c) => c.id)).toEqual([]);
    expect([...groups].filter((id) => !commands.some((c) => c.group === id))).toEqual([]);
    const documentIds = new Set(documents.map((doc) => doc.id));
    expect(
      catalog.commandGroups.flatMap((g) => g.docs.filter((id) => !documentIds.has(id))),
    ).toEqual([]);
  });

  it('mark exactly the eval scripts that grade trials as needing an external executor', () => {
    const external = commands
      .filter((c) => c.constraints.some((k) => k.kind === 'external-executor'))
      .map((c) => c.id);
    expect(external).toEqual(['script:eval:consumer:dev', 'script:eval:consumer:test']);
    for (const id of external) {
      const { source } = commands.find((c) => c.id === id) ?? {};
      const body = source?.kind === 'package-script' ? scripts[source.script] : '';
      expect(body).not.toMatch(/--(smoke|routing-only|context-only|replay)/);
    }
  });
});

describe('workflows', () => {
  const commandIds = new Set(commands.map((command) => command.id));
  /** workflow 의 `run:` 줄 중 준비 step(install)을 뺀 것. 여러 줄이면 첫 줄. */
  const runLines = (text: string) =>
    [...text.matchAll(/^\s+run: (?:\|\n\s+)?(.+)$/gm)]
      .map((m) => m[1].trim())
      .filter(
        (line) => line.startsWith('pnpm') && !/^pnpm (install|exec playwright install)/.test(line),
      );
  const jobIds = (text: string) =>
    [...text.slice(text.indexOf('\njobs:')).matchAll(/^ {2}([\w-]+):$/gm)].map((m) => m[1]);

  it.each(catalog.workflows.map((w) => [w.id, w] as const))(
    '%s matches its file',
    (_id, workflow) => {
      const text = read(workflow.path);
      expect(text).toContain(`name: ${workflow.name}`);
      expect(workflow.jobs.map((job) => job.id)).toEqual(jobIds(text));
      const steps = workflow.jobs.flatMap((job) => job.steps);
      expect(steps.flatMap((step) => step.run ?? [])).toEqual(runLines(text));
      for (const step of steps) {
        expect(text).toContain(`name: ${step.name}`);
        if (step.when) expect(text).toContain(`if: ${step.when}`);
      }
      for (const note of workflow.notes ?? []) {
        expect(read(note.evidence.path)).toContain(note.evidence.symbol);
      }
    },
  );

  it('name real commands, targets, tools, and actions', () => {
    const scripts = readJson<Manifest>('package.json').scripts ?? {};
    const problems = catalog.workflows.flatMap((workflow) =>
      workflow.jobs.flatMap((job) =>
        job.steps.flatMap((step) => {
          const at = `${workflow.id}/${job.id}/${step.name}`;
          const { invokes } = step;
          const run = step.run ?? '';
          switch (invokes.kind) {
            case 'command': {
              const command = commands.find((c) => c.id === invokes.command);
              if (!command || command.source.kind !== 'package-script') return [`${at}: unknown`];
              const { script } = command.source;
              const same =
                run === `pnpm run ${script}` ||
                run === `pnpm ${script}` ||
                run.startsWith(`pnpm ${scripts[script]} `);
              return same ? [] : [`${at}: does not run ${script}`];
            }
            case 'target':
              return run.includes(`-t ${invokes.target} `) &&
                (invokes.exclude ?? []).every((p) => run.includes(`--exclude=${p}`))
                ? []
                : [`${at}: target ${invokes.target}`];
            case 'direct': {
              const tool = tools.find((t) => t.id === invokes.tool);
              return tool && run.includes(tool.root) ? [] : [`${at}: tool ${invokes.tool}`];
            }
            default: // action
              return read(workflow.path).includes(`uses: ${invokes.action}`)
                ? []
                : [`${at}: action`];
          }
        }),
      ),
    );
    expect(problems).toEqual([]);
    expect(commandIds.size).toBe(commands.length);
  });
});

describe('evidence gaps', () => {
  it('say "no-test" only where no test file and no suite exist', () => {
    for (const entity of entities) {
      if (!entity.gaps?.some((gap) => gap.kind === 'no-test')) continue;
      const testFiles = filesUnder(entity.root).filter((path) =>
        /\.(test|spec)\.[cm]?[jt]sx?$/.test(path),
      );
      expect({ id: entity.id, testFiles, suites: testsOf(catalog, entity.id) }).toEqual({
        id: entity.id,
        testFiles: [],
        suites: [],
      });
    }
  });

  it('back every tool a tools suite claims with test files under its root', () => {
    for (const suite of tests.filter((s) => s.config.path.startsWith('tools/'))) {
      for (const id of suite.subjects.filter((subject) => tools.some((t) => t.id === subject))) {
        const tool = byId.get(id);
        const testFiles = filesUnder(tool?.root ?? '').filter((path) => /\.test\.ts$/.test(path));
        expect({ id, has: testFiles.length > 0 }).toEqual({ id, has: true });
      }
    }
  });
});

describe('documents', () => {
  it('carry their opening heading verbatim as the title, or the file name without one', () => {
    for (const doc of [...documents, ...records]) {
      const heading = read(doc.path).match(/^# (.+)/)?.[1] ?? doc.path.split('/').pop();
      expect({ id: doc.id, heading }).toEqual({ id: doc.id, heading: doc.title });
    }
  });
});

describe('records', () => {
  it('live at docs/records/<date>-<id>.md, and nowhere else', () => {
    for (const record of records) {
      expect(record.path).toBe(`docs/records/${record.date}-${record.id}.md`);
    }
    const onDisk = childrenOf('docs/records').map((entry) => `docs/records/${entry.name}`);
    expect(onDisk.sort()).toEqual(records.map((record) => record.path).sort());
  });

  it('carry a calendar date and a one-line summary', () => {
    for (const record of records) {
      expect(record.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(new Date(record.date).toISOString().slice(0, 10)).toBe(record.date);
      expect(record.summary).not.toContain('\n');
      expect(record.summary.length).toBeGreaterThan(0);
    }
  });

  it('are written in the four sections a record has', () => {
    for (const record of records) {
      const headings = read(record.path)
        .split('\n')
        .filter((line) => line.startsWith('## '))
        .map((line) => line.slice(3));
      expect({ id: record.id, headings }).toEqual({
        id: record.id,
        headings: expect.arrayContaining([
          expect.stringMatching(/^(상황|증상)$/),
          expect.stringMatching(/^(판단|원인)$/),
          '반영',
          '검증',
        ]),
      });
    }
  });
});

describe('graph', () => {
  it('derives upstream and downstream from the relations', () => {
    expect(upstreamIds(catalog, 'react-ui')).toEqual(
      expect.arrayContaining(['ui-core', 'consumer-catalog-generator', 'consumer-retrieval']),
    );
    expect(downstreamIds(catalog, 'react-ui')).toEqual(
      expect.arrayContaining(['demo-web', 'quality-lab', 'devhub']),
    );
    expect(upstreamIds(catalog, 'design-tokens')).toEqual([]);
  });
});

describe('presentation boundary', () => {
  const sourceFiles = (dir: string) =>
    readdirSync(join(APP_SRC, dir), { recursive: true, encoding: 'utf8' })
      .filter((file) => /\.tsx?$/.test(file) && !/\.spec\.tsx?$/.test(file))
      .map((file) => ({
        file: `${dir}/${file}`,
        text: readFileSync(join(APP_SRC, dir, file), 'utf8'),
      }));

  it('never injects raw HTML: document text stays React text nodes', () => {
    const injections = ['app', 'components', 'lib']
      .flatMap(sourceFiles)
      .filter(({ text }) =>
        /dangerouslySetInnerHTML|\.(inner|outer)HTML\b|insertAdjacentHTML/.test(text),
      );
    expect(injections.map(({ file }) => file)).toEqual([]);
  });

  it('keeps repository paths out of presentation code', () => {
    const leaks = [...sourceFiles('app'), ...sourceFiles('components')].filter(({ text }) =>
      /['"`](apps|libs|tools|plugins|docs)\//.test(text),
    );
    expect(leaks.map(({ file }) => file)).toEqual([]);
  });

  it('uses only the public entry points of react-ui and devhub-ui, like a consumer', () => {
    const specifiers = ['app', 'components', 'data', 'domain', 'lib'].flatMap((dir) =>
      sourceFiles(dir).flatMap(({ file, text }) =>
        [...text.matchAll(/from '([^']+)'|import '([^']+)'/g)].map((match) => ({
          file,
          specifier: match[1] ?? match[2],
        })),
      ),
    );
    const workspace = new Set(
      specifiers
        .filter(({ specifier }) => specifier.startsWith('@berrypjh/'))
        .map((s) => s.specifier),
    );
    expect(workspace).toEqual(
      new Set(['@berrypjh/react-ui', '@berrypjh/react-ui/styles.css', '@berrypjh/devhub-ui']),
    );
    expect(specifiers.filter(({ specifier }) => /(^|\/)(dist|libs)\//.test(specifier))).toEqual([]);
  });

  it('keeps the Node-only git reader out of browser code', () => {
    const leaks = [...sourceFiles('app'), ...sourceFiles('components')].filter(({ text }) =>
      /repository\/snapshot'/.test(text),
    );
    expect(leaks.map(({ file }) => file)).toEqual([]);
  });

  it('keeps React and presentation code out of the catalog and domain', () => {
    const leaks = [...sourceFiles('data'), ...sourceFiles('domain')].filter(({ text }) =>
      /from '(react|react-dom|react-router-dom|@berrypjh\/(react-ui|devhub-ui))'|from '(\.\.\/|@\/)(app|components)/.test(
        text,
      ),
    );
    expect(leaks.map(({ file }) => file)).toEqual([]);
  });
});
