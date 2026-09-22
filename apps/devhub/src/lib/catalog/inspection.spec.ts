// @vitest-environment node
import { catalog } from '../../data';
import type { RepositorySnapshot } from '../../domain/model';
import { isUncommitted, sourceLink } from '../repository/source-links';

import { inspect } from './inspection';
import { groupByOwner, REPOSITORY_GROUP } from './reference-groups';

const must = (id: string) => {
  const inspection = inspect(catalog, id);
  if (!inspection) throw new Error(`no inspection for ${id}`);
  return inspection;
};

describe('inspect', () => {
  it('covers every application, package, and tool, and nothing else', () => {
    for (const entity of [...catalog.applications, ...catalog.packages, ...catalog.tools]) {
      expect(inspect(catalog, entity.id)?.id).toBe(entity.id);
    }
    expect(inspect(catalog, 'root-readme')).toBeUndefined();
    expect(inspect(catalog, 'no-such-id')).toBeUndefined();
  });

  it('takes visibility only from a manifest, and says so when there is none', () => {
    expect(must('react-ui').visibility).toMatchObject({ value: 'public' });
    expect(must('ui-core').visibility).toMatchObject({
      value: 'internal',
      evidence: { path: 'libs/ui-core/package.json' },
    });
    expect(must('devhub').visibility).toMatchObject({ value: 'internal' });
    expect(must('quality-lab-e2e').visibility).toMatchObject({ value: null });
    expect(must('consumer-retrieval').visibility).toMatchObject({ value: null });
  });

  it('lists package entry points from the manifest, with the barrel and surface guard', () => {
    const exports = must('react-ui').exports;
    if (!('entries' in exports)) throw new Error('react-ui has entries');
    expect(exports.entries.map((entry) => entry.specifier)).toContain(
      '@berrypjh/react-ui/styles.css',
    );
    expect(exports.barrel?.path).toBe('libs/react-ui/src/index.ts');
    expect(exports.guard?.path).toBe('tools/lib/package-boundary.test.ts');
    expect(must('devhub').exports).toHaveProperty('reason');
  });

  it('splits dependencies from generated artifacts and verification', () => {
    const reactUi = must('react-ui');
    expect(reactUi.upstream.map((item) => item.other)).toEqual(['ui-core']);
    expect(reactUi.downstream.map((item) => item.other).sort()).toEqual(
      ['demo-web', 'devhub', 'devhub-ui', 'devhub-ui', 'quality-lab'].sort(),
    );
    expect(reactUi.artifacts.map((item) => item.other).sort()).toEqual(
      ['consumer-catalog-generator', 'consumer-retrieval', 'react-ui-css-build', 'ui-core'].sort(),
    );
    expect(reactUi.related.map((item) => item.other).sort()).toEqual([
      'consumer-eval',
      'tools-lib',
    ]);
  });

  it('gives the reason when a section is empty', () => {
    const config = must('eslint-config');
    expect(config.tests).toEqual([]);
    expect(config.empty.tests).toContain('테스트 파일도 test target 도 없다');
    expect(config.commands).toEqual([]);
    expect(config.upstream).toEqual([]);
  });

  it('always starts the source list with the root and the manifests', () => {
    const source = must('berry-commit').source.map((ref) => ref.path);
    expect(source.slice(0, 2)).toEqual([
      'plugins/berry-commit',
      'plugins/berry-commit/package.json',
    ]);
    expect(must('react-ui-css-build').source[0]).toEqual({
      path: 'tools/scripts/build-react-ui-css.mjs',
    });
  });
});

describe('source links', () => {
  const repository = catalog.repository;
  const snapshot: RepositorySnapshot = {
    source: 'git',
    commit: 'a'.repeat(40),
    branch: 'main',
    dirty: true,
    uncommitted: ['apps/devhub/', 'docs/new.md'],
  };

  it('pins committed files and directories to the snapshot commit', () => {
    expect(sourceLink(repository, snapshot, { path: 'libs/react-ui/src/index.ts' })).toEqual({
      href: `${repository.webUrl}/blob/${'a'.repeat(40)}/libs/react-ui/src/index.ts`,
      pinned: true,
    });
    expect(sourceLink(repository, snapshot, { path: 'libs/ui-core', directory: true }).href).toBe(
      `${repository.webUrl}/tree/${'a'.repeat(40)}/libs/ui-core`,
    );
  });

  it('makes no link for a path the snapshot commit does not have', () => {
    expect(sourceLink(repository, snapshot, { path: 'apps/devhub/src/main.tsx' })).toEqual({
      href: null,
      pinned: false,
      gap: 'uncommitted',
    });
    expect(isUncommitted(snapshot.uncommitted ?? [], 'apps/devhub')).toBe(true);
    expect(isUncommitted(snapshot.uncommitted ?? [], 'apps/devhub-other/x')).toBe(false);
    expect(isUncommitted(snapshot.uncommitted ?? [], 'docs/new.md')).toBe(true);
  });

  it('falls back to the default branch, said so, when the commit is unknown', () => {
    const unknown = {
      ...snapshot,
      source: 'unavailable',
      commit: null,
      uncommitted: null,
    } as const;
    expect(sourceLink(repository, unknown, { path: 'README.md' })).toEqual({
      href: `${repository.webUrl}/blob/main/README.md`,
      pinned: false,
      gap: 'unknown-commit',
    });
  });

  it('encodes each path segment', () => {
    expect(sourceLink(repository, snapshot, { path: 'docs/a b#c.md' }).href).toBe(
      `${repository.webUrl}/blob/${'a'.repeat(40)}/docs/a%20b%23c.md`,
    );
  });
});

describe('groupByOwner', () => {
  it('groups by the deepest owning root, keeps first-seen order, and drops repeats', () => {
    const groups = groupByOwner(catalog, [
      { path: 'libs/react-ui/src/index.ts' },
      { path: 'README.md' },
      { path: 'tools/lib/package-boundary.test.ts' },
      { path: 'libs/react-ui/src/index.ts' },
    ]);
    expect(groups).toEqual([
      { owner: 'react-ui', refs: [{ path: 'libs/react-ui/src/index.ts' }] },
      { owner: REPOSITORY_GROUP, refs: [{ path: 'README.md' }] },
      { owner: 'tools-lib', refs: [{ path: 'tools/lib/package-boundary.test.ts' }] },
    ]);
  });
});
