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
  id: 'context.tokens-measure',
  domain: 'context',
  unit: 'tokens',
  scope: 'workspace',
  availability,
  value: null,
  denominator: null,
  outcome: null,
  reason: 'static profile 은 명령을 실행하지 않는다',
  evidence: [],
  ...overrides,
});

export const artifact = (overrides: Overrides = {}) => ({
  metadata: metadata(),
  inventory: null,
  observations: [available(), missing('not-run')],
  bundles: [],
  contexts: [],
  evals: [],
  designSystem: null,
  packageSurfaces: [],
  ...overrides,
});
