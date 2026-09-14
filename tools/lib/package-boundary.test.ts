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

/**
 * RN Input 계열의 공개 표면 회귀 게이트.
 *
 * Button 계열과 같은 규칙입니다 — 소스가 아니라 빌드된 선언과 소비자 카탈로그를 봅니다.
 */
describe('@berrypjh/react-native-ui 공개 Input 계열', () => {
  const INPUTS = ['PlainInput', 'FilledInput', 'BoxedInput'];

  const declaration = () =>
    fs.readFile(path.join(REPO_ROOT, 'libs/react-native-ui/dist/index.d.ts'), 'utf8');
  const catalog = async () =>
    JSON.parse(
      await fs.readFile(path.join(REPO_ROOT, 'libs/react-native-ui/dist/llm-catalog.json'), 'utf8'),
    ) as { platform: string; symbols: Record<string, { kind: string; props?: object }> };
  const declarationLines = async () =>
    (await declaration()).split('\n').filter((l) => /^(export |declare )/.test(l));

  it.each(INPUTS)('%s 가 선언에 공개된다', async (name) => {
    expect(await declaration()).toMatch(new RegExp(`^export declare const ${name}:`, 'm'));
  });

  it('내부 InputBase 는 공개되지 않는다', async () => {
    // 세 variant 가 공유하는 TextInput 동작 원시일 뿐 소비자 API 가 아닙니다.
    expect((await declarationLines()).filter((l) => /\bInputBase\b/.test(l))).toEqual([]);
  });

  it('web input 아키텍처가 RN 선언에 새지 않는다', async () => {
    const text = await declaration();

    for (const banned of [
      'HTMLInputElement',
      'HTMLTextAreaElement',
      'HTMLSelectElement',
      'inputProps',
      'textareaProps',
      'InputLikeElement',
    ]) {
      expect(text).not.toContain(banned);
    }
  });

  it.each(INPUTS)('%s 가 카탈로그에서 발견된다', async (name) => {
    const { symbols } = await catalog();

    expect(symbols[name]?.kind).toBe('component');
    expect(Object.keys(symbols[name]?.props ?? {}).length).toBeGreaterThan(0);
  });

  it('카탈로그에 내부 InputBase 가 없다', async () => {
    const { symbols } = await catalog();

    expect(Object.keys(symbols).filter((s) => /^InputBase/.test(s))).toEqual([]);
  });

  it.each(INPUTS)('%s 의 카탈로그가 시맨틱 prop 을 보여준다', async (name) => {
    const { symbols } = await catalog();
    const props = Object.keys(symbols[name]?.props ?? {});

    // 카탈로그는 **디자인 시스템 prop** 을 싣습니다. 상속된 렌더러 prop(RN `value`·
    // `onChangeText`, Button 의 `onPress`)은 싣지 않는 것이 기존 규약입니다 — 네이티브 표면은
    // AGENTS.consumer.md 가 설명합니다.
    expect(props).toEqual(
      expect.arrayContaining([
        'accessibilityLabel',
        'color',
        'disabled',
        'error',
        'fullWidth',
        'multiline',
        'readOnly',
        'size',
      ]),
    );
    // web 전용 추상이 카탈로그로 새면 소비자가 그것을 쓰려 합니다.
    expect(props).not.toEqual(
      expect.arrayContaining(['inputProps', 'textareaProps', 'type', 'variant']),
    );
  });
});

/**
 * 소비자가 받는 선언이 private 워크스페이스 패키지를 요구하지 않아야 합니다.
 *
 * `dts-bundle-generator` 가 ui-core/design-tokens 타입을 inline 하는 것이 전제입니다 —
 * 남아 있으면 소비자가 설치할 수 없는 패키지를 import 하게 됩니다.
 */
describe('게시되는 선언은 private 패키지를 요구하지 않는다', () => {
  it.each([
    ['@berrypjh/react-native-ui', 'libs/react-native-ui/dist/index.d.ts'],
    ['@berrypjh/react-ui', 'libs/react-ui/dist/types/index.d.ts'],
  ])('%s 선언에 private import 가 없다', async (_id, relative) => {
    const text = await fs.readFile(path.join(REPO_ROOT, relative), 'utf8');
    const offenders = text
      .split('\n')
      .filter((line) => /^\s*(import|export)\b/.test(line))
      .filter((line) => /@berrypjh\/(ui-core|design-tokens)/.test(line));

    expect(offenders).toEqual([]);
  });

  it.each([
    ['@berrypjh/react-native-ui', 'libs/react-native-ui/dist/index.d.ts'],
    ['@berrypjh/react-ui', 'libs/react-ui/dist/types/index.d.ts'],
  ])('%s 선언에 로컬 절대 경로가 없다', async (_id, relative) => {
    const text = await fs.readFile(path.join(REPO_ROOT, relative), 'utf8');

    expect(text).not.toMatch(/\/(Users|home)\//);
    expect(text).not.toContain('workspace:');
  });
});
