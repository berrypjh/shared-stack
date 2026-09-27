/** test 전용 run 모양. 실제 수집 결과와 같은 계약으로 만들고 요약도 계약 함수로 만든다. */
import { publicRunArtifactSchema, summarizeRun } from '@berrypjh/observability-contracts';

import { bundle, contextMeasurement, publicArtifact } from './fixtures';

type Overrides = Record<string, unknown>;

/** core profile run — react-native-ui 전체 번들이 budget 을 넘고, 컨텍스트 하나는 입력이 없어 세지 못했다. */
export const qualityArtifact = (runId = 'run-quality', metadata: Overrides = {}) => ({
  ...publicArtifact(runId, { profile: 'core', ...metadata }),
  bundles: [bundle()],
  contexts: [contextMeasurement()],
});

const surface = (name: string, root: string, overrides: Overrides = {}) => ({
  name,
  path: root,
  private: false,
  sourceManifest: {
    path: `${root}/package.json`,
    exports: [
      { subpath: '.', conditions: ['types'], target: './dist/index.d.ts' },
      { subpath: './tokens', conditions: [], target: './dist/tokens.json' },
    ],
    bin: [],
  },
  emitted: [
    { subpath: '.', conditions: ['types'], target: './dist/index.d.ts', status: 'present' },
    { subpath: './tokens', conditions: [], target: './dist/tokens.json', status: 'present' },
  ],
  emittedBin: [],
  build: 'complete',
  emittedManifest: null,
  tokensCopy: {
    path: `${root}/dist/tokens.json`,
    status: 'present',
    identicalToDesignTokens: true,
  },
  catalog: {
    path: `${root}/dist/llm-catalog.json`,
    status: 'valid',
    reason: null,
    schemaVersion: 1,
    platform: 'web',
    symbolCount: 217,
    deprecated: ['createTheme'],
    propsUnion: [],
    typeOmittedSymbols: [],
    typeOmittedProps: [],
    valueCounts: [],
    regenerated: 'identical',
    regeneratedReason: null,
  },
  tests: [
    {
      path: 'tools/lib/package-boundary.test.ts',
      line: 273,
      title: '%s 선언에 private import 가 없다',
      evidenceKind: 'source-assertion',
      execution: 'not-run',
    },
  ],
  ...overrides,
});

/** static profile run — react-native-ui 는 산출물 일부 누락, react-ui 는 catalog drift. */
export const designArtifact = (runId = 'run-design') => ({
  ...publicArtifact(runId),
  packageSurfaces: [
    surface('@berrypjh/react-native-ui', 'libs/react-native-ui', {
      emitted: [
        { subpath: '.', conditions: ['types'], target: './dist/index.d.ts', status: 'present' },
        { subpath: './tokens', conditions: [], target: './dist/tokens.json', status: 'missing' },
      ],
      build: 'partial',
      catalog: {
        ...surface('x', 'libs/x').catalog,
        path: 'libs/react-native-ui/dist/llm-catalog.json',
        platform: 'react-native',
        symbolCount: 288,
        deprecated: ['cx', 'Web'],
      },
    }),
    surface('@berrypjh/react-ui', 'libs/react-ui', {
      catalog: { ...surface('x', 'libs/x').catalog, regenerated: 'differs' },
    }),
  ],
});

/** 공개 export 한 벌. `summaries: false` 는 요약 이전에 export 한 index 다. */
export const publicFiles = (
  artifacts: { metadata: { runId: string } }[],
  { summaries = true }: { summaries?: boolean } = {},
) => {
  const files: Record<string, unknown> = {
    '/observability/index.json': {
      version: 1,
      runs: artifacts.map(({ metadata: { runId } }) => ({
        id: runId,
        path: `runs/${runId}.json`,
        ...(summaries ? { summary: `runs/${runId}.summary.json` } : {}),
      })),
    },
  };
  for (const artifact of artifacts) {
    const { runId } = artifact.metadata;
    files[`/observability/runs/${runId}.json`] = artifact;
    if (summaries) {
      files[`/observability/runs/${runId}.summary.json`] = summarizeRun(
        publicRunArtifactSchema.parse(artifact),
      );
    }
  }
  return files;
};
