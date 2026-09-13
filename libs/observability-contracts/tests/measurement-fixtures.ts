/** bundle·context measurement test 전용 fixture. 값은 이 저장소의 실측 모양을 따른다. */
import { HASH } from './fixtures.js';

type Overrides = Record<string, unknown>;

export const REACT_EXTERNALS = ['react', 'react-dom', 'react/jsx-runtime'];

/** size-limit 가 보고한 react-ui `cx only` (brotli, 빈 프로젝트 상수 차감). */
export const sizeLimitMeasurement = (overrides: Overrides = {}) => ({
  id: 'bundle.size-limit.react-ui.cx-only',
  caseName: '@berrypjh/react-ui — cx only',
  role: 'budget',
  method: 'size-limit',
  tool: { name: 'size-limit', version: '12.1.0' },
  package: '@berrypjh/react-ui',
  entry: 'libs/react-ui/dist/index.esm.js',
  importSpec: '{ cx }',
  externals: REACT_EXTERNALS,
  target: 'es2022',
  compression: 'brotli',
  adjustment: 'size-limit-empty-project-subtracted',
  unit: 'bytes',
  configHash: HASH,
  availability: 'available',
  value: 10574,
  reason: null,
  budget: {
    limitBytes: 11000,
    limitSource: '11 KB',
    headroomBytes: 426,
    outcome: 'pass',
    toolPassed: true,
  },
  ...overrides,
});

/** treeshake check 의 gzip 열 — 한도 없는 진단 값이다. */
export const treeshakeMeasurement = (overrides: Overrides = {}) => ({
  id: 'bundle.treeshake.react-ui.single-cx.gzip',
  caseName: 'single: cx',
  role: 'diagnostic',
  method: 'treeshake-esbuild',
  tool: { name: 'esbuild', version: '0.27.2' },
  package: '@berrypjh/react-ui',
  entry: '@berrypjh/react-ui',
  importSpec: '{ cx }',
  externals: REACT_EXTERNALS,
  target: 'esbuild-default',
  compression: 'gzip',
  adjustment: 'none',
  unit: 'bytes',
  configHash: HASH,
  availability: 'available',
  value: 10697,
  reason: null,
  budget: null,
  ...overrides,
});

export const contextMeasurement = (overrides: Overrides = {}) => ({
  id: 'context.package-scenario.react-ui.baseline.openai',
  scope: 'package-scenario',
  subject: 'react-ui/baseline',
  provider: 'openai-tiktoken-local',
  tokenModel: 'gpt-4o',
  tokenizerVersion: '1.0.22',
  tokenizerVersionReason: null,
  contentConstruction: 'measure-tokens-read-files',
  files: [
    'libs/react-ui/package.json',
    'libs/react-ui/README.md',
    'libs/react-ui/dist/types/index.d.ts',
  ],
  missingPaths: [],
  availability: 'available',
  chars: 145381,
  tokens: 46895,
  reason: null,
  reasonCode: null,
  ...overrides,
});

export const missingContext = (overrides: Overrides = {}) =>
  contextMeasurement({
    id: 'context.package-scenario.design-tokens.agents-catalog.openai',
    subject: 'design-tokens/agents+catalog',
    files: ['libs/design-tokens/dist/tokens.json'],
    missingPaths: ['libs/design-tokens/dist/AGENTS.md'],
    availability: 'unavailable',
    chars: null,
    tokens: null,
    reason: 'dist/AGENTS.md 를 만드는 build 단계가 없다',
    reasonCode: 'missing-input',
    ...overrides,
  });
