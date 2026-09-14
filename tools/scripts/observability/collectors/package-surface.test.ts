import fs from 'node:fs/promises';

import { packageSurfaceSchema } from '@berrypjh/observability-contracts';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { type Catalog, serializeCatalog } from '../../generate-consumer-catalog/schema';
import { writeFiles } from '../__fixtures__/design-workspace';
import { tempDir } from '../__fixtures__/fixtures';

import { collectPackageSurfaces } from './package-surface';

const CATALOG: Catalog = {
  schemaVersion: 1,
  package: '@fixture/rn',
  platform: 'react-native',
  tokenCatalog: 'tokens.json',
  exports: { '.': '@fixture/rn' },
  symbols: {
    Web: { kind: 'namespace', importFrom: '@fixture/rn', deprecated: true },
  },
};
const CATALOG_TEXT = serializeCatalog(CATALOG);
const TOKENS = '{"tokens":{}}\n';

let root: string;

const manifest = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

beforeEach(async () => {
  root = await tempDir('surface');
  await writeFiles(root, {
    'libs/design-tokens/package.json': manifest({
      name: '@fixture/design-tokens',
      private: true,
      exports: { './tokens': './dist/tokens.json' },
    }),
    'libs/design-tokens/dist/tokens.json': TOKENS,
    'libs/rn/package.json': manifest({
      name: '@fixture/rn',
      bin: { 'fixture-rn': './dist/cli.mjs' },
      exports: {
        './package.json': './package.json',
        '.': { 'react-native': { types: './dist/index.d.ts', default: './dist/index.esm.js' } },
        './catalog': './dist/llm-catalog.json',
        './tokens': './dist/tokens.json',
      },
    }),
    'libs/rn/dist/index.d.ts': 'export {};\n',
    'libs/rn/dist/index.esm.js': 'export {};\n',
    'libs/rn/dist/llm-catalog.json': CATALOG_TEXT,
    'libs/rn/dist/tokens.json': TOKENS,
    'libs/rn/dist/cli.mjs': '#!/usr/bin/env node\n',
    'libs/rn/dist/package.json': manifest({
      name: '@fixture/rn',
      bin: { 'fixture-rn': './dist/cli.mjs' },
    }),
  });
});

afterEach(async () => {
  await fs.rm(root, { recursive: true, force: true });
});

const collect = (regenerateCatalog?: (packagePath: string) => Promise<string | null>) =>
  collectPackageSurfaces({
    workspaceRoot: root,
    packages: ['libs/design-tokens', 'libs/rn'],
    designTokensPath: 'libs/design-tokens',
    regenerateCatalog,
  });

const rnOf = async (regenerate?: (packagePath: string) => Promise<string | null>) => {
  const surfaces = await collect(regenerate);
  const rn = surfaces.find((surface) => surface.path === 'libs/rn');
  if (!rn) throw new Error('no rn surface');
  return rn;
};

describe('collectPackageSurfaces — source manifest 와 실제 산출물', () => {
  it('중첩 조건을 펴서 target 마다 존재를 확인하고 계약을 통과한다', async () => {
    const surfaces = await collect();
    for (const surface of surfaces) expect(packageSurfaceSchema.parse(surface)).toEqual(surface);
    const rn = await rnOf();
    expect(rn.sourceManifest.exports).toContainEqual({
      subpath: '.',
      conditions: ['react-native', 'types'],
      target: './dist/index.d.ts',
    });
    expect(rn).toMatchObject({
      name: '@fixture/rn',
      private: false,
      build: 'complete',
      emittedBin: [{ name: 'fixture-rn', target: './dist/cli.mjs', status: 'present' }],
      emittedManifest: {
        path: 'libs/rn/dist/package.json',
        status: 'present',
        exportsRemoved: true,
      },
      tokensCopy: {
        path: 'libs/rn/dist/tokens.json',
        status: 'present',
        identicalToDesignTokens: true,
      },
    });
  });

  it('산출물 일부가 없으면 build 는 partial 이다', async () => {
    await fs.rm(`${root}/libs/rn/dist/index.esm.js`);
    const rn = await rnOf();
    expect(rn.build).toBe('partial');
    expect(rn.emitted).toContainEqual({
      subpath: '.',
      conditions: ['react-native', 'default'],
      target: './dist/index.esm.js',
      status: 'missing',
    });
  });

  it('dist 가 통째로 없으면 missing 이고 복사본·catalog 도 없다고 적는다', async () => {
    await fs.rm(`${root}/libs/rn/dist`, { recursive: true });
    const rn = await rnOf();
    expect(rn).toMatchObject({
      emittedManifest: null,
      tokensCopy: { status: 'missing', identicalToDesignTokens: null },
      catalog: { status: 'missing' },
    });
    // ./package.json 은 dist 밖이라 남는다 — 일부만 있으므로 partial 이다.
    expect(rn.build).toBe('partial');
  });

  it('복사된 tokens.json 이 design-tokens 와 다르면 false 다', async () => {
    await fs.writeFile(`${root}/libs/rn/dist/tokens.json`, '{"tokens":{"x":1}}\n');
    expect((await rnOf()).tokensCopy?.identicalToDesignTokens).toBe(false);
  });

  it('catalog 표시를 보존하고, 재생성은 받은 함수로만 비교한다', async () => {
    expect((await rnOf()).catalog).toMatchObject({
      status: 'valid',
      deprecated: ['Web'],
      regenerated: 'not-run',
    });
    expect((await rnOf(async () => CATALOG_TEXT)).catalog?.regenerated).toBe('identical');
    expect((await rnOf(async () => `${CATALOG_TEXT} `)).catalog?.regenerated).toBe('differs');
  });

  it('재생성이 실패하면 수집을 멈추지 않고 not-run 과 그 이유를 남긴다', async () => {
    const rn = await rnOf(async () => {
      throw new Error('missing dist/index.d.ts — build declarations first');
    });
    expect(rn.catalog).toMatchObject({ status: 'valid', regenerated: 'not-run' });
    expect(rn.catalog?.regeneratedReason).toContain('missing dist/index.d.ts');
  });

  it('design-tokens 자신은 복사본 비교 대상이 아니다', async () => {
    const [designTokens] = await collect();
    expect(designTokens).toMatchObject({ private: true, tokensCopy: null, catalog: null });
  });
});
