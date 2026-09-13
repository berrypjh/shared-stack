/**
 * eval import 계약 test 전용 fixture. 값은 `tmp/llm-evals/pr-smoke` (smoke-scripted, dev) 의
 * full-source variant 모양을 따른다. 일부러 느슨한 타입이다.
 */
type Overrides = Record<string, unknown>;

export const EVAL_SHA = '2af38d659407f1651199501fe6265c1201ab5843';

export const rate = (value: number, numerator: number, denominator: number) => ({
  kind: 'rate',
  value,
  numerator,
  denominator,
  nullReason: null,
});
export const nullRate = (
  numerator: number,
  denominator: number,
  nullReason = 'zero-denominator',
) => ({
  kind: 'rate',
  value: null,
  numerator,
  denominator,
  nullReason,
});
export const agg = (value: number, n: number) => ({
  kind: 'aggregate',
  value,
  n,
  nullReason: null,
});
export const nullAgg = (n = 0, nullReason = 'no-samples') => ({
  kind: 'aggregate',
  value: null,
  n,
  nullReason,
});

export const FAILURE_BREAKDOWN = {
  'routing-unreported': 0,
  'wrong-platform': 0,
  'wrong-package': 0,
  'forbidden-package': 0,
  'unnecessary-ui-routing': 0,
  'retrieval-failure': 0,
  'hallucinated-api': 0,
  'public-api-violation': 1,
  'verification-failure': 0,
  'verification-unsupported': 0,
  'verification-omitted': 3,
  'repeated-failure': 0,
  'repair-failure': 0,
  'implementation-failure': 0,
  'tool-error': 0,
};

export const UNSUPPORTED = [
  'secondary.toolCallsPerSuccessfulTask',
  'secondary.tokensPerSuccessfulTask',
  'secondary.noToolCorrectness',
  'secondary.repairSuccessRate',
  'diagnostic.medianRetrievedTokens',
  'diagnostic.medianRetrievedFiles',
  'diagnostic.medianLatencyMs',
  'diagnostic.medianRepairTokens',
  'diagnostic.medianVerificationMs',
];

export const evalVariant = (overrides: Overrides = {}) => ({
  variant: 'full-source',
  label: 'Full Source',
  tasks: 4,
  trials: 4,
  primary: {
    verifiedTaskSuccessRate: rate(0, 0, 4),
    routingAccuracy: rate(1, 4, 4),
    requiredEvidenceRecallAtK: agg(1, 3),
    medianInputTokens: agg(1000, 4),
    falseSuccessRate: rate(1, 4, 4),
  },
  secondary: {
    wrongPackageRate: rate(0, 0, 4),
    mrr: agg(1, 3),
    unnecessaryToolCallRate: rate(0, 0, 4),
    toolCallsPerSuccessfulTask: nullAgg(),
    tokensPerSuccessfulTask: nullAgg(),
    noToolCorrectness: nullRate(0, 0),
    verificationInvocationRate: agg(0, 4),
    verificationPassRate: rate(0, 0, 4),
    medianRepairAttempts: agg(0, 4),
    repairSuccessRate: nullRate(0, 0),
    repeatedFailureRate: rate(0, 0, 4),
    verificationUnsupportedRate: rate(0, 0, 4),
  },
  diagnostic: {
    medianRetrievedTokens: nullAgg(),
    medianRetrievedFiles: nullAgg(),
    medianDuplicateRetrievals: agg(0, 4),
    medianLatencyMs: nullAgg(),
    medianRepairTokens: nullAgg(),
    medianVerificationMs: nullAgg(),
  },
  failureBreakdown: FAILURE_BREAKDOWN,
  unsupported: UNSUPPORTED,
  context: { tokens: 400389, files: 404, missingPaths: [], tokenModel: 'gpt-4o', routed: null },
  verificationAuthority: 'executor-reported',
  repair: 'not-in-variant',
  ...overrides,
});

const zeroRow = () => ({ web: 0, 'react-native': 0, none: 0, both: 0, unreported: 0 });

export const confusion = (overrides: Overrides = {}) => ({
  rows: {
    web: { ...zeroRow(), web: 3 },
    'react-native': zeroRow(),
    both: zeroRow(),
    none: { ...zeroRow(), none: 1 },
  },
  total: 4,
  correct: 4,
  unreported: 0,
  accuracy: 1,
  ...overrides,
});

const REQUIRED = [
  'package:@berrypjh/react-ui',
  'component:@berrypjh/react-ui#Button',
  'prop:@berrypjh/react-ui#Button.loading',
  'prop:@berrypjh/react-ui#Button.loadingPosition',
];

export const evalTrace = (overrides: Overrides = {}) => {
  const taskId = (overrides.taskId as string | undefined) ?? 'web-button-loading';
  const variant = (overrides.variant as string | undefined) ?? 'full-source';
  const trial = (overrides.trial as number | undefined) ?? 1;
  return {
    id: `${variant}::${taskId}::${trial}`,
    variant,
    taskId,
    trial,
    split: 'dev',
    expectedPlatform: 'web',
    selectedPlatform: 'web',
    claimedSuccess: true,
    routing: {
      platformCorrect: true,
      packageCorrect: true,
      forbiddenPackagesUsed: [],
      unnecessaryUiRouting: null,
    },
    retrieval: {
      k: 5,
      requiredCount: 4,
      hitsAtK: 4,
      recallAtK: 1,
      reciprocalRank: 1,
      firstHitRank: 1,
      evidenceDuplicates: 0,
      toolCallDuplicates: 0,
      nullReason: null,
      required: REQUIRED,
      retrieved: REQUIRED,
    },
    verification: {
      requiredKinds: ['public-import', 'typecheck', 'test'],
      missingRequired: ['public-import', 'typecheck', 'test'],
      failedRequired: [],
      unsupportedRequired: [],
      invocationRate: 0,
      passed: false,
      runs: [],
    },
    success: {
      taskSucceeded: false,
      falseSuccess: true,
      claimCounted: true,
      failureCategory: 'verification-omitted',
    },
    repair: { attempts: 0, succeeded: null, repeatedFailures: null },
    changedFiles: [{ path: 'src/App.tsx', content: 'redacted' }],
    ...overrides,
  };
};

export const CONDITIONS = {
  gitSha: EVAL_SHA,
  ref: null,
  split: 'dev',
  datasetHash: '0fdbc956fb31c136',
  datasetTaskCount: 48,
  variants: ['full-source'],
  trials: 1,
  executor: 'smoke-scripted',
  model: null,
  modelSettings: null,
  timeoutMs: null,
  capabilityHash: '261105f09d254803',
  catalogSchemaVersion: 1,
  harnessVersion: '0.1.0',
};

const TASK_IDS = [
  'web-button-loading',
  'web-button-polymorphic',
  'negative-deep-source-import',
  'no-ui-date-format',
];

export const evalRun = (overrides: Overrides = {}) => ({
  sourceId: 'eval:pr-smoke',
  origin: {
    runId: 'pr-smoke',
    createdAt: '2026-09-12T12:13:55.885Z',
    split: 'dev',
    gitSha: EVAL_SHA,
    executor: 'smoke-scripted',
    model: null,
    harnessVersion: '0.1.0',
    k: 5,
    taskCount: 4,
    trialsPerTask: 1,
    conditions: CONDITIONS,
  },
  executorClass: 'harness-smoke',
  import: {
    summary: { status: 'parsed', reason: null },
    traces: { status: 'parsed', reason: null },
    routing: { status: 'missing', reason: 'routing.json 이 없다' },
    context: { status: 'missing', reason: 'context.json 이 없다' },
  },
  notices: [
    { code: 'harness-smoke', message: 'smoke-scripted 는 harness 사슬 검증용 고정 입력이다' },
    { code: 'no-live-executor', message: 'live agent executor 가 없어 모델 성능이 아니다' },
    { code: 'no-baseline', message: 'No baseline available — reporting current run only' },
  ],
  variants: [evalVariant()],
  routing: [{ source: 'trace-grades', variant: 'full-source', matrix: confusion() }],
  traceCount: 4,
  traces: TASK_IDS.map((taskId) => evalTrace({ taskId })),
  ...overrides,
});
