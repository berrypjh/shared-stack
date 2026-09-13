// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

import { createServer } from 'vite';
import { describe, expect, it } from 'vitest';

const appRoot = join(import.meta.dirname, '..');
const srcRoot = join(appRoot, 'src');

/** 앱 소스(spec 제외)가 쓰는 모든 import specifier 와 그 파일. */
const sourceImports = () =>
  readdirSync(srcRoot, { recursive: true, encoding: 'utf8' })
    .filter((file) => /\.tsx?$/.test(file) && !/\.spec\.tsx?$/.test(file))
    .flatMap((file) =>
      [...readFileSync(join(srcRoot, file), 'utf8').matchAll(/(?:from|import)\s+'([^']+)'/g)].map(
        (match) => ({ file, specifier: match[1] }),
      ),
    );

const sourceSpecifiers = () => sourceImports().map((entry) => entry.specifier);

/** 상대 경로는 문자열 모양이 아니라 실제로 가리키는 위치로 판단한다 — 앱 `src` 밖이면 새는 것이다. */
const escapesSrc = ({ file, specifier }: { file: string; specifier: string }) =>
  specifier.startsWith('.') &&
  relative(srcRoot, resolve(dirname(join(srcRoot, file)), specifier)).startsWith('..');

/**
 * 소비자는 `@berrypjh/react-ui` 의 공개 진입점만 안다. ui-core·design-tokens·다른 패키지의
 * source 경로가 앱에 새어 들어오면 dist 에 없는 것을 쓰게 되어 실제 소비자와 갈린다.
 */
describe('public package boundary', () => {
  it('workspace 패키지는 react-ui 공개 진입점으로만 import 한다', () => {
    const specifiers = sourceSpecifiers();
    const workspace = new Set(specifiers.filter((s) => s.startsWith('@berrypjh/')));
    expect(workspace).toEqual(
      new Set([
        '@berrypjh/observability-contracts',
        '@berrypjh/react-ui',
        '@berrypjh/react-ui/styles.css',
      ]),
    );
    expect(specifiers.filter((s) => s.includes('libs/'))).toEqual([]);
    expect(sourceImports().filter(escapesSrc)).toEqual([]);
  });

  it('상대 import 가 앱 src 밖으로 나가면 잡는다', () => {
    expect(
      escapesSrc({
        file: 'app/pages/overview/OverviewPage.tsx',
        specifier: '../../components/Mono',
      }),
    ).toBe(false);
    expect(escapesSrc({ file: 'app/app.tsx', specifier: '../../../libs/react-ui/src/index' })).toBe(
      true,
    );
    expect(escapesSrc({ file: 'main.tsx', specifier: '../vite.config.mts' })).toBe(true);
  });

  it.each(['tsconfig.app.json', 'tsconfig.spec.json'])(
    '%s 는 root tsconfig 의 source paths 를 비운다',
    (file) => {
      const { compilerOptions } = JSON.parse(readFileSync(join(appRoot, file), 'utf8'));
      expect(compilerOptions.paths).toEqual({});
    },
  );

  /** 앱의 실제 vite 설정으로 해석한다. plugin·alias 가 source 로 되돌리면 여기서 드러난다. */
  it.each([
    ['@berrypjh/react-ui', /\/libs\/react-ui\/dist\/index\.esm\.js$/],
    ['@berrypjh/react-ui/styles.css', /\/libs\/react-ui\/dist\/index\.css$/],
  ])('vite 는 %s 를 dist 로 해석한다', async (specifier, expected) => {
    const server = await createServer({
      configFile: join(appRoot, 'vite.config.mts'),
      server: { middlewareMode: true, hmr: false, ws: false },
      optimizeDeps: { noDiscovery: true },
      logLevel: 'silent',
    });
    try {
      const resolved = await server.environments.client.pluginContainer.resolveId(
        specifier,
        join(appRoot, 'src/app/app.tsx'),
      );
      expect(resolved?.id).toMatch(expected);
    } finally {
      await server.close();
    }
  });
});
