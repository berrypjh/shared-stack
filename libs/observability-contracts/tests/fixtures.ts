/**
 * test 전용 결정적 fixture. 일부러 느슨한 타입이다 — 잘못된 입력을 만들어 schema 가
 * 거부하는지 보는 것이 목적이다. 제품 코드에서 import 하지 않는다.
 */
type Overrides = Record<string, unknown>;

export const SHA = 'a'.repeat(40);
export const OTHER_SHA = 'b'.repeat(40);
export const HASH = 'c'.repeat(64);

export const source = (overrides: Overrides = {}) => ({
  kind: 'local',
  sha: SHA,
  time: '2026-09-13T08:00:00+09:00',
  ciRunId: 'unknown',
  dirty: false,
  workingTreeHash: HASH,
  lockfileHash: HASH,
  ...overrides,
});

export const collection = (overrides: Overrides = {}) => ({
  sha: SHA,
  startedAt: '2026-09-13T08:01:00+09:00',
  finishedAt: '2026-09-13T08:01:05+09:00',
  ...overrides,
});

export const metadata = (overrides: Overrides = {}) => ({
  schemaVersion: 1,
  runId: 'fixture-run-01',
  state: 'complete',
  profile: 'static',
  scope: ['workspace'],
  source: source(),
  collection: collection(),
  tools: { node: 'v24.20.0', typescript: '5.9.2' },
  cache: 'disabled',
  ...overrides,
});

/** 실측값. 기본값을 일부러 0 으로 둔다 — 0 은 측정된 사실이다. */
export const available = (overrides: Overrides = {}) => ({
  id: 'bundle.react-ui.gzip',
  domain: 'bundle',
  unit: 'bytes',
  scope: '@berrypjh/react-ui',
  availability: 'available',
  value: 0,
  denominator: null,
  outcome: null,
  reason: null,
  evidence: [],
  ...overrides,
});

export const missing = (availability: string, overrides: Overrides = {}) => ({
  id: 'test.react-ui.passed',
  domain: 'test',
  unit: 'count',
  scope: '@berrypjh/react-ui',
  availability,
  value: null,
  denominator: null,
  outcome: null,
  reason: 'static profile 은 명령을 실행하지 않는다',
  evidence: [],
  ...overrides,
});

export const verification = (overrides: Overrides = {}) => ({
  id: 'verification.quality-lab.typecheck',
  domain: 'verification',
  scope: '@berrypjh/quality-lab',
  kind: 'typecheck',
  status: 'passed',
  availability: 'available',
  outcome: 'pass',
  exitCode: 0,
  durationMs: 1200,
  reason: null,
  evidence: [],
  ...overrides,
});

export const artifact = (overrides: Overrides = {}) => ({
  metadata: metadata(),
  inventory: null,
  observations: [available(), missing('not-run')],
  tests: [],
  bundles: [],
  contexts: [],
  ...overrides,
});

export const counted = (value: number, provenance = 'runner-report') => ({
  value,
  provenance,
  reason: null,
});
export const notCounted = (reason: string) => ({ value: null, provenance: null, reason });

export const testCase = (overrides: Overrides = {}) => ({
  id: '@berrypjh/react-ui::src/components/button/Button.test.tsx::Button renders',
  file: 'libs/react-ui/src/components/button/Button.test.tsx',
  fullName: 'Button renders',
  status: 'passed',
  attempts: counted(1, 'derived-from-report'),
  durationMs: 1.5,
  layer: 'unknown',
  layerEvidence: null,
  ...overrides,
});

/** vitest 한 파일·한 case 가 통과한 fresh run. */
export const testSummary = (overrides: Overrides = {}) => ({
  sourceId: 'vitest:@berrypjh/react-ui',
  area: 'nx-project',
  project: '@berrypjh/react-ui',
  runner: 'vitest',
  runnerVersion: '4.0.17',
  execution: {
    status: 'completed',
    commandId: 'test.react-ui',
    exitCode: 0,
    timeoutMs: 600000,
    excerpt: null,
    reason: null,
  },
  cache: 'fresh',
  report: {
    status: 'parsed',
    format: 'vitest-json',
    path: 'raw/tests/test.react-ui.json',
    sha256: HASH,
    reason: null,
  },
  scope: {
    include: ['{src,test}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    includeHash: HASH,
    selectedProjects: ['@berrypjh/react-ui'],
  },
  counts: {
    sourceFiles: counted(1, 'source-scan'),
    reportedFiles: counted(1),
    suites: counted(1),
    cases: counted(1),
    passed: counted(1),
    failed: counted(0),
    skipped: counted(0),
    todo: counted(0),
    retriedCases: counted(0, 'derived-from-report'),
    attempts: counted(1, 'derived-from-report'),
  },
  durations: { wallMs: counted(5230, 'collector-clock'), caseSumMs: counted(1.5) },
  coverage: { status: 'not-measured', reason: 'coverage 는 요청하지 않았다' },
  outcome: 'pass',
  outcomeReason: '1 case 모두 통과',
  cases: [testCase()],
  ...overrides,
});
