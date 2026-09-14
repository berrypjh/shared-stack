import fs from 'node:fs/promises';
import path from 'node:path';

import type { PackageSurface, TestRef } from '@berrypjh/observability-contracts';

import { z } from 'zod';

import { parseCatalogSummary } from '../adapters/catalog';
import { ArtifactError, readText, resolveInside } from '../safe-fs';

/**
 * package 표면. source package.json 이 선언한 exports·bin 과 실제로 만들어진 산출물을 나눠 적는다.
 * dist 를 수정하거나 git diff 로 비교하지 않는다 — 파일이 있는지와 바이트가 같은지만 본다.
 */

export const SURFACE_PACKAGES = [
  'libs/design-tokens',
  'libs/ui-core',
  'libs/react-ui',
  'libs/react-native-ui',
];

type TestSpec = { path: string; title: string };

const BOUNDARY = 'tools/lib/package-boundary.test.ts';
const CATALOG_TEST = 'tools/scripts/generate-consumer-catalog/catalog.test.ts';
const PUBLISHED_TESTS: TestSpec[] = [
  { path: BOUNDARY, title: '모든 export 대상이 실제 빌드 산출물로 존재한다' },
  { path: BOUNDARY, title: '%s 선언에 private import 가 없다' },
  { path: CATALOG_TEST, title: 'matches the catalog the package build wrote to dist' },
];

/** 이 표면을 이미 고정하는 기존 test. 결과가 아니라 위치만 싣는다. */
const SURFACE_TESTS: Record<string, TestSpec[]> = {
  'libs/design-tokens': [
    {
      path: 'libs/design-tokens/src/lib/packageSurface.test.ts',
      title: 'copies rather than regenerating, so there is one source of truth',
    },
  ],
  'libs/ui-core': [
    { path: 'libs/ui-core/src/packageSurface.test.ts', title: '%s (%s) → %s 가 존재한다' },
    {
      path: 'libs/ui-core/src/packageSurface.test.ts',
      title: '선언에 workspace 내부 경로가 새지 않는다',
    },
    {
      path: 'libs/ui-core/src/packageSurface.test.ts',
      title: '토큰 산출물은 design-tokens 것을 복사한 것이다',
    },
  ],
  'libs/react-ui': PUBLISHED_TESTS,
  'libs/react-native-ui': PUBLISHED_TESTS,
};

const manifestSchema = z.looseObject({
  name: z.string(),
  private: z.boolean().optional(),
  exports: z.record(z.string(), z.unknown()).optional(),
  bin: z.union([z.string(), z.record(z.string(), z.string())]).optional(),
});

type ExportEntry = { subpath: string; conditions: string[]; target: string };

const flatten = (subpath: string, value: unknown, conditions: string[] = []): ExportEntry[] => {
  if (typeof value === 'string') {
    return value.startsWith('./') ? [{ subpath, conditions, target: value }] : [];
  }
  if (value === null || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([condition, next]) =>
    flatten(subpath, next, [...conditions, condition]),
  );
};

const readOptional = (root: string, file: string) =>
  readText(root, file).catch((error: unknown) => {
    if (error instanceof ArtifactError && error.kind === 'missing') return null;
    throw error;
  });

const exists = async (root: string, file: string) =>
  fs.stat(await resolveInside(root, file)).then(
    () => true,
    () => false,
  );

const inPackage = (packagePath: string, target: string) => path.posix.join(packagePath, target);

const testRefs = async (root: string, specs: TestSpec[]): Promise<TestRef[]> => {
  const refs: TestRef[] = [];
  for (const spec of specs) {
    const text = await readOptional(root, spec.path);
    const index = text?.split('\n').findIndex((line) => line.includes(`'${spec.title}'`)) ?? -1;
    if (index === -1) continue;
    refs.push({
      path: spec.path,
      line: index + 1,
      title: spec.title,
      evidenceKind: 'source-assertion',
      execution: 'not-run',
    });
  }
  return refs;
};

type RegenerateCatalog = (packagePath: string) => Promise<string | null>;

const catalogOf = async (
  root: string,
  packagePath: string,
  entries: ExportEntry[],
  regenerate: RegenerateCatalog | undefined,
): Promise<PackageSurface['catalog']> => {
  const entry = entries.find((candidate) => candidate.subpath === './catalog');
  if (!entry) return null;
  const file = inPackage(packagePath, entry.target);
  const text = await readOptional(root, file);
  const { summary } = parseCatalogSummary(text, file);
  const notRun = (reason: string) => ({
    ...summary,
    regenerated: 'not-run' as const,
    regeneratedReason: reason,
  });
  if (summary.status !== 'valid' || text === null) {
    return notRun('dist catalog 가 valid 하지 않아 재생성과 비교하지 않았다');
  }
  if (!regenerate) return notRun('catalog generator 를 받지 않아 재생성하지 않았다');
  let regenerated: string | null;
  try {
    regenerated = await regenerate(packagePath);
  } catch (error) {
    return notRun(`catalog 재생성 실패: ${(error as Error).message}`.slice(0, 500));
  }
  if (regenerated === null) return notRun('이 package 는 catalog generator target 이 아니다');
  return {
    ...summary,
    regenerated: regenerated === text ? 'identical' : 'differs',
    regeneratedReason: null,
  };
};

const surfaceOf = async (
  root: string,
  packagePath: string,
  designTokensPath: string,
  regenerate: RegenerateCatalog | undefined,
): Promise<PackageSurface> => {
  const manifestPath = `${packagePath}/package.json`;
  const manifest = manifestSchema.parse(JSON.parse(await readText(root, manifestPath)));
  const entries = Object.entries(manifest.exports ?? {}).flatMap(([subpath, value]) =>
    flatten(subpath, value),
  );
  const bin =
    typeof manifest.bin === 'string'
      ? [{ name: manifest.name, target: manifest.bin }]
      : Object.entries(manifest.bin ?? {}).map(([name, target]) => ({ name, target }));

  const presence = async (target: string) =>
    (await exists(root, inPackage(packagePath, target)))
      ? ('present' as const)
      : ('missing' as const);
  const emitted = [];
  for (const entry of entries) emitted.push({ ...entry, status: await presence(entry.target) });
  const emittedBin = [];
  for (const entry of bin) emittedBin.push({ ...entry, status: await presence(entry.target) });

  const statuses = emitted.map((entry) => entry.status);
  const build =
    statuses.length === 0
      ? 'not-applicable'
      : statuses.every((status) => status === 'present')
        ? 'complete'
        : statuses.every((status) => status === 'missing')
          ? 'missing'
          : 'partial';

  const emittedManifestPath = `${packagePath}/dist/package.json`;
  const emittedManifestText = await readOptional(root, emittedManifestPath);
  const emittedManifest =
    emittedManifestText === null
      ? null
      : {
          path: emittedManifestPath,
          status: 'present' as const,
          exportsRemoved: !('exports' in (JSON.parse(emittedManifestText) as object)),
        };

  const tokensTarget = entries.find((entry) => entry.subpath === './tokens')?.target;
  const tokensPath = tokensTarget
    ? inPackage(packagePath, tokensTarget)
    : (await exists(root, `${packagePath}/dist/tokens.json`))
      ? `${packagePath}/dist/tokens.json`
      : null;
  let tokensCopy: PackageSurface['tokensCopy'] = null;
  if (packagePath !== designTokensPath && tokensPath) {
    const [copy, canonical] = await Promise.all([
      readOptional(root, tokensPath),
      readOptional(root, `${designTokensPath}/dist/tokens.json`),
    ]);
    tokensCopy = {
      path: tokensPath,
      status: copy === null ? 'missing' : 'present',
      identicalToDesignTokens: copy === null || canonical === null ? null : copy === canonical,
    };
  }

  return {
    name: manifest.name,
    path: packagePath,
    private: manifest.private === true,
    sourceManifest: { path: manifestPath, exports: entries, bin },
    emitted,
    emittedBin,
    build,
    emittedManifest,
    tokensCopy,
    catalog: await catalogOf(root, packagePath, entries, regenerate),
    tests: await testRefs(root, SURFACE_TESTS[packagePath] ?? []),
  };
};

export type PackageSurfaceInput = {
  workspaceRoot: string;
  packages?: string[];
  designTokensPath?: string;
  /** 기존 catalog generator 로 다시 만든 텍스트. 받지 않으면 재생성 비교는 not-run 이다. */
  regenerateCatalog?: RegenerateCatalog;
};

export const collectPackageSurfaces = async ({
  workspaceRoot,
  packages = SURFACE_PACKAGES,
  designTokensPath = 'libs/design-tokens',
  regenerateCatalog,
}: PackageSurfaceInput): Promise<PackageSurface[]> => {
  const surfaces: PackageSurface[] = [];
  for (const packagePath of packages) {
    surfaces.push(await surfaceOf(workspaceRoot, packagePath, designTokensPath, regenerateCatalog));
  }
  return surfaces;
};
