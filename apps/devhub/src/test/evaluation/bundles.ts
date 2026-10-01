/** test 전용 bundle 행. 실제 수집기(`normalizers/bundle.ts`)와 같은 id·조건 모양이다. */
import { bundle, HASH, publicArtifact } from './fixtures';

const REACT_EXTERNALS = ['react', 'react-dom', 'react/jsx-runtime'];

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** react-ui cx only size-limit budget. 한도 11 KB. */
export const cxOnly = (value: number | null = 10574) =>
  bundle({
    id: 'bundle.size-limit.react-ui.cx-only',
    caseName: '@berrypjh/react-ui — cx only',
    package: '@berrypjh/react-ui',
    entry: 'libs/react-ui/dist/index.esm.js',
    importSpec: '{ cx }',
    externals: REACT_EXTERNALS,
    ...(value === null
      ? {
          availability: 'unavailable',
          value: null,
          reason: 'libs/react-ui/dist/index.esm.js 가 없다',
          budget: {
            limitBytes: 11000,
            limitSource: '11 KB',
            headroomBytes: null,
            outcome: null,
            toolPassed: null,
          },
        }
      : {
          value,
          budget: {
            limitBytes: 11000,
            limitSource: '11 KB',
            headroomBytes: 11000 - value,
            outcome: value <= 11000 ? 'pass' : 'fail',
            toolPassed: value <= 11000,
          },
        }),
  });

/** treeshake scenario 하나의 raw(`none`) 또는 gzip 진단 값. 한도가 없다. */
export const treeshake = (
  caseName: string,
  importSpec: string,
  compression: 'none' | 'gzip',
  value: number | null,
) => ({
  id: `bundle.treeshake.react-ui.${slug(caseName)}.${compression === 'none' ? 'raw' : 'gzip'}`,
  caseName,
  role: 'diagnostic',
  method: 'treeshake-esbuild',
  tool: { name: 'esbuild', version: '0.27.2' },
  package: '@berrypjh/react-ui',
  entry: '@berrypjh/react-ui',
  importSpec,
  externals: REACT_EXTERNALS,
  target: 'esbuild-default',
  compression,
  adjustment: 'none',
  unit: 'bytes',
  configHash: HASH,
  budget: null,
  ...(value === null
    ? {
        availability: 'unavailable',
        value: null,
        reason: 'esbuild 번들 실패: No matching export "Missing"',
      }
    : { availability: 'available', value, reason: null }),
});

/** single·multi·all-exports 세 종류. multi 의 gzip 은 값이 없다 — 0 이 아니다. */
export const TREESHAKE_ROWS = [
  treeshake('single: cx', '{ cx }', 'none', 34245),
  treeshake('single: cx', '{ cx }', 'gzip', 10697),
  treeshake('multi: Box+Button', '{ Box, Button }', 'none', 38120),
  treeshake('multi: Box+Button', '{ Box, Button }', 'gzip', null),
  treeshake('all-exports (baseline)', '*', 'none', 152300),
  treeshake('all-exports (baseline)', '*', 'gzip', 41200),
];

export const treeshakeNotRun = {
  id: 'bundle.treeshake.react-ui',
  domain: 'bundle',
  unit: 'bytes',
  scope: '@berrypjh/react-ui',
  availability: 'not-run',
  value: null,
  denominator: null,
  outcome: null,
  reason: '--only-imports: import 한 report 가 없어 실행하지 않았다',
  evidence: [],
};

/** core profile 의 bundle 실행. `treeshakeRows` 가 비면 treeshake 는 not-run 관측만 남는다. */
export const bundleArtifact = (
  runId: string,
  bundles: unknown[],
  { treeshakeRows = [] as unknown[] }: { treeshakeRows?: unknown[] } = {},
) => ({
  ...publicArtifact(runId, { profile: 'core' }),
  observations: treeshakeRows.length === 0 ? [treeshakeNotRun] : [],
  bundles: [...bundles, ...treeshakeRows],
});
