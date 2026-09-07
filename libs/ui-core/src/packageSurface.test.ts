/**
 * 공개 경계는 `package.json` 의 exports map 이 정한다.
 *
 * dist 에 internal 모듈이 있어도 subpath 로는 들어올 수 없어야 하고, exports 에 적힌 대상은
 * 실제로 빌드 산출물에 있어야 한다. design-tokens 의 `packageSurface.test.ts` 와 같은 취지지만
 * 해석 방법이 다르다 — ui-core 는 `import` 조건만 두는 ESM 이라 `require.resolve` 로는
 * 열리지 않는다. 그래서 `import.meta.resolve` 를 쓴다.
 *
 * dist 가 없으면 통과가 아니라 실패다.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(PKG_ROOT, 'dist');

type PackageJson = {
  name: string;
  private?: boolean;
  type?: string;
  sideEffects?: string[];
  files?: string[];
  exports: Record<string, string | Record<string, string>>;
};

const pkg: PackageJson = JSON.parse(await fs.readFile(path.join(PKG_ROOT, 'package.json'), 'utf8'));

/** subpath 가 열리면 패키지 기준 상대 경로를, 막히면 에러 코드를 돌려준다. */
const resolve = (specifier: string): string => {
  try {
    return path.relative(PKG_ROOT, fileURLToPath(import.meta.resolve(specifier)));
  } catch (e) {
    return (e as NodeJS.ErrnoException).code ?? 'ERROR';
  }
};

const exists = async (relative: string): Promise<boolean> =>
  fs
    .access(path.join(PKG_ROOT, relative))
    .then(() => true)
    .catch(() => false);

/** exports map 의 모든 조건부 대상(`types`/`import`/문자열)을 평평하게 편다. */
const exportTargets = (): [subpath: string, condition: string, target: string][] =>
  Object.entries(pkg.exports).flatMap(([subpath, value]) =>
    typeof value === 'string'
      ? [[subpath, 'default', value] as [string, string, string]]
      : Object.entries(value).map(
          ([condition, target]) => [subpath, condition, target] as [string, string, string],
        ),
  );

describe('패키지는 private 로 남는다', () => {
  it('ui-core 는 publish 되지 않는다', () => {
    // 소비자는 react-ui/react-native-ui 만 설치한다.
    expect(pkg.private).toBe(true);
    expect(pkg.name).toBe('@berrypjh/ui-core');
  });
});

describe('공개 subpath', () => {
  it('exports 키가 의도한 목록과 정확히 일치한다', () => {
    expect(Object.keys(pkg.exports).sort()).toEqual(['.', './css', './package.json', './tailwind']);
  });

  it.each([
    ['@berrypjh/ui-core', 'dist/index.js'],
    ['@berrypjh/ui-core/tailwind', 'dist/tailwind.js'],
    ['@berrypjh/ui-core/css', 'dist/css/index.css'],
  ])('%s 가 열린다', (specifier, target) => {
    expect(resolve(specifier)).toBe(target);
  });
});

describe('internal 모듈은 subpath 로 닿지 않는다', () => {
  it.each([
    '@berrypjh/ui-core/dist/index.js',
    '@berrypjh/ui-core/dist/tokens.json',
    '@berrypjh/ui-core/src/index.ts',
    '@berrypjh/ui-core/tokens',
    '@berrypjh/ui-core/contracts',
  ])('%s 는 막힌다', (specifier) => {
    expect(resolve(specifier)).toBe('ERR_PACKAGE_PATH_NOT_EXPORTED');
  });
});

describe('exports 대상이 실제 산출물과 맞는다', () => {
  it.each(exportTargets())('%s (%s) → %s 가 존재한다', async (_subpath, _condition, target) => {
    expect(await exists(target)).toBe(true);
  });

  it('타입 진입점이 모든 JS 진입점에 있다', async () => {
    expect(await exists('dist/index.d.ts')).toBe(true);
    expect(await exists('dist/tailwind.d.ts')).toBe(true);
  });

  it('JS 진입점이 ESM 이다 — package type 과 어긋나지 않는다', async () => {
    expect(pkg.type).toBe('module');

    for (const entry of ['dist/index.js', 'dist/tailwind.js']) {
      const source = await fs.readFile(path.join(PKG_ROOT, entry), 'utf8');
      expect(source).toMatch(/^export |\nexport /);
      expect(source).not.toMatch(/\bmodule\.exports\b/);
    }
  });
});

describe('side effect 표기', () => {
  it('CSS 만 side effect 다 — JS 전체를 부작용으로 표시하지 않는다', async () => {
    expect(pkg.sideEffects).toEqual(['./dist/css/index.css']);

    for (const entry of pkg.sideEffects ?? []) {
      expect(await exists(entry)).toBe(true);
    }
  });
});

describe('build 산출물', () => {
  it('예상한 파일만 나온다', async () => {
    const walk = async (dir: string): Promise<string[]> => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const out: string[] = [];
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) out.push(...(await walk(full)));
        else out.push(path.relative(DIST, full));
      }
      return out.sort();
    };

    const required = [
      'css/index.css',
      'index.d.ts',
      'index.js',
      'tailwind.d.ts',
      'tailwind.js',
      'tokens.json',
    ];
    // `@nx/vite:build` 가 출력 디렉터리에 package.json 을 하나 더 쓴다. 쓰는 곳은 없지만
    // executor 산출물이라 허용한다 — raw `vite build` 로는 나오지 않아 존재 여부를 강제하지 않는다.
    const allowedExtra = ['package.json'];
    const produced = await walk(DIST);

    expect(produced).toEqual(expect.arrayContaining(required));
    expect(produced.filter((f) => !required.includes(f) && !allowedExtra.includes(f))).toEqual([]);
  });

  it('선언에 workspace 내부 경로가 새지 않는다', async () => {
    const declaration = await fs.readFile(path.join(DIST, 'index.d.ts'), 'utf8');

    for (const leak of [
      '@berrypjh/design-tokens',
      'workspace:',
      'libs/design-tokens',
      'src/.generated',
      PKG_ROOT,
    ]) {
      expect(declaration).not.toContain(leak);
    }
  });

  it('tailwind 브릿지가 실제로 로드되고 preset 을 돌려준다', async () => {
    // 파일 존재만으로는 부족하다 — design-tokens 까지 이어지는 체인이 살아 있는지 본다.
    // specifier 를 변수로 두는 것은 의도다: 검사 대상이 컴파일 타임 import 가 아니라
    // exports map 을 거치는 **런타임 해석**이다. 리터럴로 쓰면 tsc/lint 가 먼저 가로챈다.
    const entry = '@berrypjh/ui-core/tailwind';
    const preset = (await import(entry)) as { default?: unknown };

    expect(preset.default).toBeTypeOf('object');
    expect(preset.default).not.toBeNull();
  });

  it('토큰 산출물은 design-tokens 것을 복사한 것이다', async () => {
    const [copied, canonical] = await Promise.all([
      fs.readFile(path.join(DIST, 'tokens.json'), 'utf8'),
      fs.readFile(path.join(PKG_ROOT, '../design-tokens/dist/tokens.json'), 'utf8'),
    ]);

    // ui-core 가 다시 만들지 않는다는 사실을 바이트로 확인한다.
    expect(copied).toBe(canonical);
  });
});
