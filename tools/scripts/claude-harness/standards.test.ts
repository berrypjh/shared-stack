import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { beforeAll, describe, expect, it } from 'vitest';

/**
 * plugins/berry-dev/scripts/standards-core.mjs 계약 테스트 (docs/claude-harness/contracts.md).
 *
 * 대상은 plugin 안의 순수 Node ESM 이다. tools tsconfig 에 allowJs 를 켜지 않으려고
 * 동적 import 로 불러오고, 여기 적은 타입으로만 본다.
 */

type Plugin = { name: string; version: string };
type Rule = { id: string; source: string; scope: 'core' | 'optional' };
type Manifest = { schemaVersion: 1; rules: Rule[] };
type Selection = { id: string; paths: string[] | null };
type GeneratedFile = { path: string; content: string };
type Source = { plugin: Plugin; manifest: Manifest; bodies: Record<string, string> };

type StandardsCore = {
  GENERATOR: string;
  FORMAT: number;
  SYNC_COMMAND: string;
  StandardsError: new (kind: string, message: string) => Error & { kind: string };
  validatePlugin: (value: unknown) => Plugin;
  validateManifest: (value: unknown) => Manifest;
  validateConfig: (value: unknown, manifest: Manifest) => Selection[];
  renderRule: (input: {
    rule: Rule;
    body: string;
    paths: string[] | null;
    plugin: Plugin;
  }) => string;
  buildExpectedFiles: (input: Source & { config: unknown }) => GeneratedFile[];
  loadSource: (pluginRoot?: string) => Promise<Source>;
};

const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const PLUGIN_ROOT = path.join(REPO_ROOT, 'plugins/berry-dev');
const CORE_MODULE = path.join(PLUGIN_ROOT, 'scripts/standards-core.mjs');

const sha256 = (text: string) => `sha256:${createHash('sha256').update(text).digest('hex')}`;

let core: StandardsCore;
let source: Source;

/** core 하나와 optional 하나를 가진 가짜 source. optional 규칙은 아직 저장소에 없다. */
const withOptional = (): Source => ({
  plugin: { name: 'berry-dev', version: '0.1.0' },
  manifest: {
    schemaVersion: 1,
    rules: [
      { id: 'core', source: 'rules/core.md', scope: 'core' },
      { id: 'docs-style', source: 'rules/docs-style.md', scope: 'optional' },
    ],
  },
  bodies: { core: '# core\n\n- 본문\n', 'docs-style': '# docs\n\n- 문체\n' },
});

const errorKind = (run: () => unknown): string => {
  try {
    run();
  } catch (error) {
    expect(error).toBeInstanceOf(core.StandardsError);
    return (error as { kind: string }).kind;
  }
  throw new Error('expected a StandardsError');
};

beforeAll(async () => {
  core = (await import(pathToFileURL(CORE_MODULE).href)) as StandardsCore;
  source = await core.loadSource();
});

describe('plugin 과 source', () => {
  it('plugin.json 이 name berry-dev · version 0.1.0 이다', () => {
    expect(source.plugin).toEqual({ name: 'berry-dev', version: '0.1.0' });
  });

  it('version 은 plugin.json 한 곳에만 있다', () => {
    const others = [
      'standards/manifest.json',
      ...source.manifest.rules.map((rule) => `standards/${rule.source}`),
      'scripts/standards-core.mjs',
      'scripts/standards-fs.mjs',
      'scripts/standards.mjs',
    ];
    for (const file of others) {
      expect(readFileSync(path.join(PLUGIN_ROOT, file), 'utf8'), file).not.toContain('0.1.0');
    }
  });

  it('manifest 는 core 를 core scope 로 등록하고, rules 디렉터리와 1:1 이다', () => {
    expect(source.manifest.rules.filter((rule) => rule.scope === 'core')).toEqual([
      { id: 'core', source: 'rules/core.md', scope: 'core' },
    ]);
    const onDisk = readdirSync(path.join(PLUGIN_ROOT, 'standards/rules')).sort();
    expect(onDisk).toEqual(source.manifest.rules.map((rule) => `${rule.id}.md`));
  });

  it('source 본문에는 frontmatter 가 없다 — paths 는 local config 에서 온다', () => {
    for (const [id, body] of Object.entries(source.bodies)) {
      expect(body.startsWith('---'), id).toBe(false);
    }
  });

  it('module 은 node: 내장만 import 한다', () => {
    const text = readFileSync(CORE_MODULE, 'utf8');
    const specifiers = [...text.matchAll(/^import[^'"]*['"]([^'"]+)['"]/gm)].map((m) => m[1]);
    expect(specifiers.length).toBeGreaterThan(0);
    expect(specifiers.filter((s) => !s.startsWith('node:'))).toEqual([]);
  });

  it('project 파일을 쓰는 API 가 없다', () => {
    expect(Object.keys(core).sort()).toEqual([
      'FORMAT',
      'GENERATOR',
      'SYNC_COMMAND',
      'StandardsError',
      'buildExpectedFiles',
      'loadSource',
      'renderRule',
      'validateConfig',
      'validateManifest',
      'validatePlugin',
    ]);
  });
});

describe('validatePlugin', () => {
  it.each([
    [{ name: 'berry-commit', version: '0.1.0' }],
    [{ name: 'berry-dev', version: 'v0.1' }],
    [{ name: 'berry-dev' }],
    [null],
  ])('이름 · semver 가 틀리면 source 오류 (%j)', (value) => {
    expect(errorKind(() => core.validatePlugin(value))).toBe('source');
  });
});

describe('validateManifest', () => {
  const rule = (patch: Record<string, unknown>) => ({
    schemaVersion: 1,
    rules: [{ id: 'core', source: 'rules/core.md', scope: 'core', ...patch }],
  });

  it.each([
    ['traversal', rule({ id: '../core', source: 'rules/../core.md' })],
    ['구분자', rule({ id: 'a/b', source: 'rules/a/b.md' })],
    ['역슬래시', rule({ id: 'a\\b', source: 'rules/a\\b.md' })],
    ['대문자', rule({ id: 'Core', source: 'rules/Core.md' })],
    ['확장자 포함', rule({ id: 'core.md', source: 'rules/core.md.md' })],
    ['source 불일치', rule({ source: 'rules/other.md' })],
    ['source traversal', rule({ source: '../rules/core.md' })],
    ['모르는 scope', rule({ scope: 'global' })],
    ['모르는 필드', rule({ body: 'override' })],
    ['schemaVersion', { ...rule({}), schemaVersion: 2 }],
    ['빈 rules', { schemaVersion: 1, rules: [] }],
  ])('%s 는 source 오류', (_label, value) => {
    expect(errorKind(() => core.validateManifest(value))).toBe('source');
  });

  it('같은 id 두 번은 source 오류', () => {
    const value = {
      schemaVersion: 1,
      rules: [
        { id: 'core', source: 'rules/core.md', scope: 'core' },
        { id: 'core', source: 'rules/core.md', scope: 'core' },
      ],
    };
    expect(errorKind(() => core.validateManifest(value))).toBe('source');
  });

  it('id 순으로 정렬해 돌려준다', () => {
    const { manifest } = withOptional();
    const reversed = { ...manifest, rules: [...manifest.rules].reverse() };
    expect(core.validateManifest(reversed).rules.map((r) => r.id)).toEqual(['core', 'docs-style']);
  });
});

describe('validateConfig', () => {
  const { manifest } = withOptional();
  const config = (rules: Record<string, unknown>) => ({ schemaVersion: 1, rules });

  it('core 는 적지 않아도 선택되고, optional 은 paths 와 함께 선택된다', () => {
    expect(core.validateConfig(config({ 'docs-style': { paths: ['docs/**'] } }), manifest)).toEqual(
      [
        { id: 'core', paths: null },
        { id: 'docs-style', paths: ['docs/**'] },
      ],
    );
    expect(core.validateConfig(config({ core: true }), manifest)).toEqual([
      { id: 'core', paths: null },
    ]);
  });

  it.each([
    ['unknown id', config({ nope: true })],
    ['대소문자만 다른 id', config({ Core: true })],
    ['core 에 paths', config({ core: { paths: ['a/**'] } })],
    ['core 에 false', config({ core: false })],
    ['optional 에 true', config({ 'docs-style': true })],
    ['빈 paths', config({ 'docs-style': { paths: [] } })],
    ['paths 없음', config({ 'docs-style': {} })],
    ['빈 문자열 path', config({ 'docs-style': { paths: [''] } })],
    ['공백 path', config({ 'docs-style': { paths: ['  '] } })],
    ['줄바꿈 path', config({ 'docs-style': { paths: ['a\n- b'] } })],
    ['문자열 아닌 path', config({ 'docs-style': { paths: [1] } })],
    ['본문 override', config({ 'docs-style': { paths: ['a/**'], body: 'x' } })],
    ['모르는 최상위 필드', { ...config({}), extra: 1 }],
    ['schemaVersion', { schemaVersion: 2, rules: {} }],
    ['rules 가 배열', { schemaVersion: 1, rules: [] }],
  ])('%s 는 config 오류', (_label, value) => {
    expect(errorKind(() => core.validateConfig(value, manifest))).toBe('config');
  });

  it('대소문자만 다른 id 는 올바른 id 를 알려 준다', () => {
    expect(() => core.validateConfig(config({ Core: true }), manifest)).toThrow(/"core"/);
  });
});

describe('renderRule', () => {
  const { plugin, manifest, bodies } = withOptional();
  const [coreRule, optionalRule] = manifest.rules;

  it('core 는 metadata comment 가 첫 줄이고 source · version · format · 실행 명령을 적는다', () => {
    const text = core.renderRule({ rule: coreRule, body: bodies.core, paths: null, plugin });
    const [first, second, third] = text.split('\n');
    expect(first).toMatch(/^<!-- .* -->$/);
    expect(first).toContain(`${core.GENERATOR} format ${core.FORMAT}`);
    expect(first).toContain('Source: berry-dev/standards/rules/core.md');
    expect(first).toContain('Plugin: berry-dev@0.1.0');
    expect(first).toContain('Run: pnpm harness:sync');
    expect(second).toBe('');
    expect(third).toBe('# core');
  });

  it('paths 가 있으면 YAML frontmatter 가 첫 줄이고 comment 가 그 다음이다', () => {
    const text = core.renderRule({
      rule: optionalRule,
      body: bodies['docs-style'],
      paths: ['docs/**', 'apps/*/README.md'],
      plugin,
    });
    const lines = text.split('\n');
    expect(lines.slice(0, 5)).toEqual([
      '---',
      'paths:',
      '  - "docs/**"',
      '  - "apps/*/README.md"',
      '---',
    ]);
    expect(lines[5]).toMatch(/^<!-- .*Source: berry-dev\/standards\/rules\/docs-style\.md.* -->$/);
  });

  it('path 는 YAML 큰따옴표 문자열로 쓴다 — 따옴표 · 콜론 · # · 중괄호 · 한글', () => {
    const hostile = ['a/"q"/**', "it's: #x", '{a,b}/**', '문서/**', 'back\\slash'];
    const text = core.renderRule({
      rule: optionalRule,
      body: bodies['docs-style'],
      paths: hostile,
      plugin,
    });
    const items = text.split('\n').slice(2, 2 + hostile.length);
    expect(items.map((line) => JSON.parse(line.replace(/^ {2}- /, '')))).toEqual(hostile);
  });

  it('UTF-8 · LF · 마지막 newline 하나, BOM · CRLF 는 정규화한다', () => {
    const text = core.renderRule({
      rule: coreRule,
      body: '\uFEFF# core\r\n\r\n- 본문\r\n\r\n\r\n',
      paths: null,
      plugin,
    });
    expect(text).not.toMatch(/\r|\uFEFF/);
    expect(text.endsWith('- 본문\n')).toBe(true);
    expect(text.endsWith('\n\n')).toBe(false);
  });

  it.each([
    ['frontmatter 있는 본문', '---\npaths: []\n---\n# x\n'],
    ['빈 본문', '\n\n'],
  ])('%s 는 source 오류', (_label, body) => {
    expect(errorKind(() => core.renderRule({ rule: coreRule, body, paths: null, plugin }))).toBe(
      'source',
    );
  });
});

describe('buildExpectedFiles', () => {
  const config = { schemaVersion: 1, rules: { core: true } };

  it('rule 파일과 생성 manifest 를 경로 순으로 돌려준다', () => {
    const files = core.buildExpectedFiles({ ...source, config });
    expect(files.map((file) => file.path)).toEqual(['core.md', 'manifest.json']);
  });

  it('생성 manifest 는 키 정렬 · 파일 hash · version · digest 를 담고 timestamp 가 없다', () => {
    const files = core.buildExpectedFiles({ ...source, config });
    const manifestText = files.find((file) => file.path === 'manifest.json')?.content ?? '';
    const generated = JSON.parse(manifestText) as Record<string, unknown>;
    expect(Object.keys(generated)).toEqual([...Object.keys(generated)].sort());
    expect(generated).toMatchObject({
      schemaVersion: 1,
      generator: core.GENERATOR,
      format: core.FORMAT,
      plugin: 'berry-dev',
      pluginVersion: '0.1.0',
      files: { 'core.md': sha256(files[0].content) },
    });
    expect(generated.sourceDigest).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(generated.configDigest).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(manifestText.endsWith('}\n')).toBe(true);
    expect(manifestText).not.toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:/);
  });

  it('머신 절대 경로가 어느 파일에도 없다', () => {
    for (const file of core.buildExpectedFiles({ ...source, config })) {
      expect(file.content).not.toContain(REPO_ROOT);
      expect(file.content).not.toContain(homedir());
    }
  });

  it('두 번 만들면 byte 단위로 같고, config 키 순서는 결과를 바꾸지 않는다', () => {
    const optional = withOptional();
    const a = { schemaVersion: 1, rules: { core: true, 'docs-style': { paths: ['docs/**'] } } };
    const b = { rules: { 'docs-style': { paths: ['docs/**'] }, core: true }, schemaVersion: 1 };
    const first = core.buildExpectedFiles({ ...optional, config: a });
    expect(core.buildExpectedFiles({ ...optional, config: a })).toEqual(first);
    expect(core.buildExpectedFiles({ ...optional, config: b })).toEqual(first);
  });

  it('source 본문 · plugin version 이 바뀌면 digest · manifest 가 바뀐다', () => {
    const base = core.buildExpectedFiles({ ...source, config });
    const edited = core.buildExpectedFiles({
      ...source,
      bodies: { ...source.bodies, core: `${source.bodies.core}\n- 추가\n` },
      config,
    });
    const bumped = core.buildExpectedFiles({
      ...source,
      plugin: { name: 'berry-dev', version: '0.2.0' },
      config,
    });
    const digestOf = (files: GeneratedFile[]) =>
      (JSON.parse(files[1].content) as { sourceDigest: string }).sourceDigest;
    expect(digestOf(edited)).not.toBe(digestOf(base));
    expect(bumped[1].content).toContain('"pluginVersion": "0.2.0"');
  });

  it('manifest 에 있는 rule 의 본문이 없으면 source 오류', () => {
    expect(errorKind(() => core.buildExpectedFiles({ ...source, bodies: {}, config }))).toBe(
      'source',
    );
  });

  it('별도 Node 프로세스 두 번의 결과가 byte 단위로 같다', () => {
    const script = [
      `const core = await import(${JSON.stringify(pathToFileURL(CORE_MODULE).href)});`,
      'const source = await core.loadSource();',
      'const files = core.buildExpectedFiles({ ...source, config: { schemaVersion: 1, rules: { core: true } } });',
      'process.stdout.write(JSON.stringify(files));',
    ].join('\n');
    const run = () =>
      execFileSync(process.execPath, ['--input-type=module', '--eval', script], {
        encoding: 'utf8',
      });
    const first = run();
    expect(run()).toBe(first);
    expect(JSON.parse(first)).toEqual(
      core.buildExpectedFiles({ ...source, config: { schemaVersion: 1, rules: { core: true } } }),
    );
  });
});
