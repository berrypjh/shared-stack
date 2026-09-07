/**
 * 게시되는 두 패키지(`react-ui`, `react-native-ui`)의 exports map ↔ 빌드 산출물 대조.
 *
 * ui-core는 `libs/ui-core/src/packageSurface.test.ts`가 자기 패키지 안에서 같은 검사를 한다.
 * 렌더러 두 개를 여기 두는 이유는 `react-native-ui`에 test target이 없기 때문이다 —
 * 이 파일은 `pnpm tools:check`로 돌고 CI의 consumer-eval job이 실행한다.
 *
 * dist가 없으면 통과가 아니라 실패다. 산출물을 검사하는 것이 목적이기 때문.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { REPO_ROOT } from '../scripts/generate-consumer-catalog/config';

import { type PackageJsonLike, publicSpecifiers } from './package-exports';

type ExportsValue = string | { [condition: string]: ExportsValue };
type ExportsMap = Record<string, ExportsValue>;

type Published = {
  id: string;
  root: string;
  /** exports map에 있어야 하는 subpath 전체. */
  subpaths: string[];
  /** dist에 반드시 있어야 하는 파일 (packageRoot 기준). */
  artifacts: string[];
};

const PUBLISHED: Published[] = [
  {
    id: '@berrypjh/react-ui',
    root: 'libs/react-ui',
    subpaths: ['.', './styles.css', './tailwind', './catalog', './tokens', './agents'],
    artifacts: [
      'dist/types/index.d.ts',
      'dist/index.css',
      'dist/tailwind.js',
      'dist/tailwind.d.ts',
      'dist/tokens.json',
      'dist/llm-catalog.json',
      'dist/AGENTS.md',
      'dist/cli.mjs',
    ],
  },
  {
    id: '@berrypjh/react-native-ui',
    root: 'libs/react-native-ui',
    subpaths: ['./package.json', '.', './catalog', './tokens', './agents'],
    artifacts: [
      'dist/index.d.ts',
      'dist/tokens.json',
      'dist/llm-catalog.json',
      'dist/AGENTS.md',
      'dist/cli.mjs',
    ],
  },
];

const INTERNAL = ['libs/design-tokens', 'libs/ui-core'];

const readPkg = async (root: string): Promise<PackageJsonLike & { exports?: ExportsMap }> =>
  JSON.parse(await fs.readFile(path.join(REPO_ROOT, root, 'package.json'), 'utf8'));

const exists = async (root: string, relative: string): Promise<boolean> =>
  fs
    .access(path.join(REPO_ROOT, root, relative))
    .then(() => true)
    .catch(() => false);

/**
 * 조건부 export를 평평하게 펴서 실제 파일 대상만 남긴다.
 * react-native-ui는 `{ '.': { 'react-native': { types, default } } }` 처럼 두 겹이라 재귀로 푼다.
 */
const targetsOf = (value: ExportsValue): string[] =>
  typeof value === 'string' ? [value] : Object.values(value).flatMap(targetsOf);

describe.each(PUBLISHED)('$id', (pkg) => {
  it('exports map이 의도한 subpath와 정확히 일치한다', async () => {
    const { exports: map } = await readPkg(pkg.root);

    expect(Object.keys(map ?? {}).sort()).toEqual([...pkg.subpaths].sort());
  });

  it('모든 export 대상이 실제 빌드 산출물로 존재한다', async () => {
    const { exports: map } = await readPkg(pkg.root);
    const missing: string[] = [];

    for (const target of targetsOf(map ?? {})) {
      if (!(await exists(pkg.root, target.replace(/^\.\//, '')))) missing.push(target);
    }

    expect(missing).toEqual([]);
  });

  it('소비자가 기대하는 산출물이 모두 나온다', async () => {
    const missing: string[] = [];

    for (const artifact of pkg.artifacts) {
      if (!(await exists(pkg.root, artifact))) missing.push(artifact);
    }

    expect(missing).toEqual([]);
  });

  it('publish 대상이고 dist만 담는다', async () => {
    const meta = await readPkg(pkg.root);

    expect(meta.private).toBeUndefined();
    expect((meta as { files?: string[] }).files).toEqual(['dist']);
  });

  it('deep source 경로는 공개 specifier가 아니다', async () => {
    const meta = await readPkg(pkg.root);
    const specifiers = publicSpecifiers(pkg.id, meta.exports);

    expect(specifiers).toContain(pkg.id);
    for (const specifier of specifiers) {
      expect(specifier).not.toMatch(/\/(src|dist)\//);
    }
  });
});

describe('internal 패키지는 게시되지 않는다', () => {
  it.each(INTERNAL)('%s 는 private 이다', async (root) => {
    const meta = await readPkg(root);

    // 소비자가 설치할 수 있는 것은 렌더러 두 개뿐이다.
    expect(meta.private).toBe(true);
  });
});

/**
 * RN Button 계열의 공개 표면 회귀 게이트.
 *
 * 소스가 아니라 빌드된 선언과 소비자 카탈로그를 봅니다 — npm 소비자가 실제로 받는 것입니다.
 */
describe('@berrypjh/react-native-ui 공개 Button 계열', () => {
  const declaration = () =>
    fs.readFile(path.join(REPO_ROOT, 'libs/react-native-ui/dist/index.d.ts'), 'utf8');
  const catalog = async () =>
    JSON.parse(
      await fs.readFile(path.join(REPO_ROOT, 'libs/react-native-ui/dist/llm-catalog.json'), 'utf8'),
    ) as { platform: string; symbols: Record<string, { kind: string; props?: object }> };

  it.each(['Button', 'Fab', 'IconButton'])('%s 가 선언에 공개된다', async (name) => {
    expect(await declaration()).toMatch(new RegExp(`^export declare const ${name}:`, 'm'));
  });

  it('내부 ButtonBase 는 공개되지 않는다', async () => {
    const text = await declaration();
    // 주석 안의 설명은 API가 아니므로 선언 줄만 봅니다.
    const declarations = text.split('\n').filter((l) => /^(export |declare )/.test(l));

    expect(declarations.filter((l) => /\bButtonBase\b/.test(l))).toEqual([]);
  });

  it('web 전용 API 가 RN 선언에 새지 않는다', async () => {
    const text = await declaration();
    const declarations = text.split('\n').filter((l) => /^(export |declare )/.test(l));

    for (const banned of ['edge?:', 'href?:', 'component?:', 'className?:']) {
      expect(declarations.filter((l) => l.includes(banned))).toEqual([]);
    }
  });

  it.each(['Button', 'Fab', 'IconButton'])('%s 가 카탈로그에서 발견된다', async (name) => {
    const { symbols, platform } = await catalog();

    expect(platform).toBe('react-native');
    expect(symbols[name]?.kind).toBe('component');
    expect(Object.keys(symbols[name]?.props ?? {}).length).toBeGreaterThan(0);
  });

  it('카탈로그에 내부 ButtonBase 가 없다', async () => {
    const { symbols } = await catalog();

    expect(Object.keys(symbols).filter((s) => /ButtonBase/.test(s))).toEqual([]);
  });
});
