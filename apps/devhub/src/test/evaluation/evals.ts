/**
 * test 전용 eval run. 계약(`eval.ts`)의 합계 규칙을 지키도록 trace 에서 값을 맞췄다:
 * variant 둘 × task 넷, RN test unsupported 1, routing 미보고 1, required evidence 없음 1.
 */
import { publicArtifact, SHA } from './fixtures';

type Rate = ReturnType<typeof rate>;
type Agg = ReturnType<typeof agg>;

const rate = (numerator: number, denominator: number) =>
  denominator === 0
    ? { kind: 'rate', value: null, numerator, denominator, nullReason: 'zero-denominator' }
    : { kind: 'rate', value: numerator / denominator, numerator, denominator, nullReason: null };

const agg = (value: number | null, n: number) =>
  value === null
    ? { kind: 'aggregate', value: null, n, nullReason: n === 0 ? 'no-samples' : 'source-null' }
    : { kind: 'aggregate', value, n, nullReason: null };

const FAILURES = [
  'routing-unreported',
  'wrong-platform',
  'wrong-package',
  'forbidden-package',
  'unnecessary-ui-routing',
  'retrieval-failure',
  'hallucinated-api',
  'public-api-violation',
  'verification-failure',
  'verification-unsupported',
  'verification-omitted',
  'repeated-failure',
  'repair-failure',
  'implementation-failure',
  'tool-error',
];

const nullKeys = (groups: Record<string, Record<string, Rate | Agg>>) =>
  Object.entries(groups).flatMap(([group, metrics]) =>
    Object.entries(metrics).flatMap(([key, metric]) =>
      metric.value === null ? [`${group}.${key}`] : [],
    ),
  );

type VariantInput = {
  id: string;
  label: string;
  success: number;
  falseSuccess: number;
  claimed: number;
  invocation: number;
  unsupported: number;
  breakdown: Record<string, number>;
  tokens: number;
  routed: Record<string, { tokens: number; files: number }> | null;
  verificationAuthority: string;
  repair: string;
};

const variant = (input: VariantInput) => {
  const groups = {
    primary: {
      verifiedTaskSuccessRate: rate(input.success, 4),
      routingAccuracy: rate(3, 3),
      requiredEvidenceRecallAtK: agg(2.5 / 3, 3),
      medianInputTokens: agg(1000, 4),
      falseSuccessRate: rate(input.falseSuccess, input.claimed),
    },
    secondary: {
      wrongPackageRate: rate(0, 3),
      mrr: agg(2.5 / 3, 3),
      unnecessaryToolCallRate: rate(0, 4),
      toolCallsPerSuccessfulTask: agg(null, 0),
      tokensPerSuccessfulTask: agg(null, 0),
      noToolCorrectness: rate(0, 0),
      verificationInvocationRate: agg(input.invocation, 4),
      verificationPassRate: rate(input.success, 4),
      medianRepairAttempts: agg(0, 4),
      repairSuccessRate: rate(0, 0),
      repeatedFailureRate: rate(0, 4),
      verificationUnsupportedRate: rate(input.unsupported, 4),
    },
    diagnostic: {
      medianRetrievedTokens: agg(null, 0),
      medianRetrievedFiles: agg(null, 0),
      medianDuplicateRetrievals: agg(0, 4),
      medianLatencyMs: agg(null, 0),
      medianRepairTokens: agg(null, 0),
      medianVerificationMs: agg(null, 0),
    },
  };
  return {
    variant: input.id,
    label: input.label,
    tasks: 4,
    trials: 4,
    ...groups,
    failureBreakdown: Object.fromEntries(
      FAILURES.map((failure) => [failure, input.breakdown[failure] ?? 0]),
    ),
    unsupported: nullKeys(groups),
    context: {
      tokens: input.tokens,
      files: 4,
      missingPaths: [],
      tokenModel: 'gpt-4o',
      routed: input.routed,
    },
    verificationAuthority: input.verificationAuthority,
    repair: input.repair,
  };
};

const EVIDENCE = [
  'package:@berrypjh/react-ui',
  'component:@berrypjh/react-ui#Button',
  'prop:@berrypjh/react-ui#Button.loading',
  'prop:@berrypjh/react-ui#Button.loadingPosition',
];

export const RN_UNSUPPORTED =
  'react-native components cannot render in the jsdom fixture harness (react-native ships untranspiled sources)';

type Run = {
  kind: string;
  required: boolean;
  status: string;
  attempt: number;
  durationMs: number | null;
  exitCode: number | null;
  failureFingerprint: null;
  excerpt: string | null;
};

const passed = (kind: string): Run => ({
  kind,
  required: true,
  status: 'passed',
  attempt: 1,
  durationMs: 300,
  exitCode: 0,
  failureFingerprint: null,
  excerpt: null,
});

type TraceInput = {
  variant: string;
  taskId: string;
  expected: string;
  selected: string | null;
  claimed: boolean | 'unknown' | null;
  required: number;
  hits: number;
  rr: number | null;
  kinds: string[];
  runs: Run[];
  failureCategory: string | null;
};

const trace = (input: TraceInput) => {
  const executed = input.runs.length > 0;
  const unsupportedRequired = input.runs
    .filter((run) => run.required && run.status === 'unsupported')
    .map((run) => run.kind);
  const verificationPassed = executed && input.runs.every((run) => run.status === 'passed');
  const taskSucceeded = input.failureCategory === null;
  return {
    id: `${input.variant}::${input.taskId}::1`,
    variant: input.variant,
    taskId: input.taskId,
    trial: 1,
    split: 'dev',
    expectedPlatform: input.expected,
    selectedPlatform: input.selected,
    claimedSuccess: input.claimed,
    routing: {
      platformCorrect: input.selected === null ? null : input.selected === input.expected,
      packageCorrect: input.selected === null ? null : true,
      forbiddenPackagesUsed: [],
      unnecessaryUiRouting: null,
    },
    retrieval:
      input.required === 0
        ? {
            k: 5,
            requiredCount: 0,
            hitsAtK: 0,
            recallAtK: null,
            reciprocalRank: null,
            firstHitRank: null,
            evidenceDuplicates: 0,
            toolCallDuplicates: 0,
            nullReason: 'no-required-evidence',
            required: [],
            retrieved: [],
          }
        : {
            k: 5,
            requiredCount: input.required,
            hitsAtK: input.hits,
            recallAtK: input.hits / input.required,
            reciprocalRank: input.rr,
            firstHitRank: input.rr ? Math.round(1 / input.rr) : null,
            evidenceDuplicates: input.taskId === 'web-textfield-helper' ? 2 : 0,
            toolCallDuplicates: input.taskId === 'web-textfield-helper' ? 1 : 0,
            nullReason: null,
            required: EVIDENCE.slice(0, input.required),
            retrieved: EVIDENCE.slice(0, input.hits),
          },
    verification: {
      requiredKinds: input.kinds,
      missingRequired: executed ? [] : input.kinds,
      failedRequired: [],
      unsupportedRequired,
      invocationRate: executed ? 1 : 0,
      passed: verificationPassed,
      runs: input.runs,
    },
    success: {
      taskSucceeded,
      falseSuccess: input.claimed === true && !verificationPassed,
      claimCounted: typeof input.claimed === 'boolean',
      failureCategory: input.failureCategory,
    },
    repair: { attempts: 0, succeeded: null, repeatedFailures: null },
    changedFiles: [{ path: 'src/App.tsx', content: 'redacted' }],
  };
};

const TASKS = [
  { taskId: 'web-button-loading', expected: 'web', selected: 'web', required: 4, hits: 4, rr: 1 },
  {
    taskId: 'rn-use-theme-getcolor',
    expected: 'react-native',
    selected: 'react-native',
    required: 3,
    hits: 3,
    rr: 1,
  },
  {
    taskId: 'no-ui-date-format',
    expected: 'none',
    selected: 'none',
    required: 0,
    hits: 0,
    rr: null,
  },
  {
    taskId: 'web-textfield-helper',
    expected: 'web',
    selected: null,
    required: 4,
    hits: 2,
    rr: 0.5,
  },
] as const;

const KINDS = ['public-import', 'typecheck', 'test'];

/** 실행하지 않고 보고만 한 variant — 검증 누락, 주장한 셋 모두 false success. */
const reportedTraces = TASKS.map((task) =>
  trace({
    ...task,
    variant: 'consumer-docs',
    claimed: task.selected === null ? 'unknown' : true,
    kinds: KINDS,
    runs: [],
    failureCategory: task.selected === null ? 'routing-unreported' : 'verification-omitted',
  }),
);

/** harness 가 검증을 실행한 variant — RN test 는 unsupported 로 남는다. */
const executedTraces = TASKS.map((task) =>
  trace({
    ...task,
    variant: 'progressive-with-repair',
    claimed: task.selected === null ? 'unknown' : true,
    kinds: KINDS,
    runs:
      task.taskId === 'rn-use-theme-getcolor'
        ? [
            passed('public-import'),
            passed('typecheck'),
            {
              kind: 'test',
              required: true,
              status: 'unsupported',
              attempt: 0,
              durationMs: null,
              exitCode: null,
              failureFingerprint: null,
              excerpt: RN_UNSUPPORTED,
            },
          ]
        : KINDS.map(passed),
    failureCategory:
      task.selected === null
        ? 'routing-unreported'
        : task.taskId === 'rn-use-theme-getcolor'
          ? 'verification-unsupported'
          : null,
  }),
);

const zeroRow = () => ({ web: 0, 'react-native': 0, none: 0, both: 0, unreported: 0 });

const traceMatrix = {
  rows: {
    web: { ...zeroRow(), web: 1, unreported: 1 },
    'react-native': { ...zeroRow(), 'react-native': 1 },
    both: zeroRow(),
    none: { ...zeroRow(), none: 1 },
  },
  total: 4,
  correct: 3,
  unreported: 1,
  accuracy: 0.75,
};

/** deterministic resolver — both 행과 unreported 열에 실제 관측이 있다. */
export const RESOLVER_MATRIX = {
  rows: {
    web: { ...zeroRow(), web: 15 },
    'react-native': { ...zeroRow(), 'react-native': 19 },
    both: { ...zeroRow(), both: 1, unreported: 1 },
    none: { ...zeroRow(), none: 1 },
  },
  total: 37,
  correct: 36,
  unreported: 1,
  accuracy: 36 / 37,
};

export const evalRun = () => ({
  sourceId: 'eval:local-smoke-01',
  origin: {
    runId: 'local-smoke-01',
    createdAt: '2026-09-13T10:14:30.312Z',
    split: 'dev',
    gitSha: SHA,
    executor: 'smoke-scripted',
    model: null,
    harnessVersion: '0.1.0',
    k: 5,
    taskCount: 4,
    trialsPerTask: 1,
    conditions: null,
  },
  executorClass: 'harness-smoke',
  import: {
    summary: { status: 'parsed', reason: null },
    traces: { status: 'parsed', reason: null },
    routing: { status: 'parsed', reason: null },
    context: { status: 'missing', reason: 'context.json 이 없다' },
  },
  notices: [
    { code: 'harness-smoke', message: 'smoke-scripted 는 harness 사슬 확인용 고정 입력이다' },
    { code: 'no-live-executor', message: 'live agent executor 없이 만든 결과다' },
    { code: 'no-baseline', message: 'No baseline available — reporting current run only' },
  ],
  variants: [
    variant({
      id: 'consumer-docs',
      label: 'Consumer Docs',
      success: 0,
      falseSuccess: 3,
      claimed: 3,
      invocation: 0,
      unsupported: 0,
      breakdown: { 'verification-omitted': 3, 'routing-unreported': 1 },
      tokens: 11959,
      routed: null,
      verificationAuthority: 'executor-reported',
      repair: 'not-in-variant',
    }),
    variant({
      id: 'progressive-with-repair',
      label: 'Progressive + Repair',
      success: 2,
      falseSuccess: 1,
      claimed: 3,
      invocation: 1,
      unsupported: 1,
      breakdown: { 'routing-unreported': 1, 'verification-unsupported': 1 },
      tokens: 35588,
      routed: { web: { tokens: 15195, files: 3 }, 'react-native': { tokens: 20393, files: 3 } },
      verificationAuthority: 'harness-executed',
      repair: 'no-repair-hook',
    }),
  ],
  routing: [
    { source: 'trace-grades', variant: 'consumer-docs', matrix: traceMatrix },
    { source: 'trace-grades', variant: 'progressive-with-repair', matrix: traceMatrix },
    { source: 'deterministic-resolver', variant: null, matrix: RESOLVER_MATRIX },
  ],
  traceCount: 8,
  traces: [...reportedTraces, ...executedTraces],
});

/** executor 없이 routing·context 만 import 한 offline 평가 (실제 local-eval-offline-01 모양). */
export const offlineEvalRun = () => {
  const notRun = {
    status: 'not-run',
    reason: 'executor 를 돌리지 않은 offline 산출물이다 (routing-only·context-only)',
  };
  return {
    sourceId: 'eval:offline',
    origin: null,
    executorClass: null,
    import: {
      summary: notRun,
      traces: notRun,
      routing: { status: 'parsed', reason: null },
      context: { status: 'parsed', reason: null },
    },
    notices: [
      {
        code: 'no-live-executor',
        message: 'executor 를 돌리지 않은 산출물이다 — task success·false success 는 not-run 이다',
      },
    ],
    variants: [],
    routing: [{ source: 'deterministic-resolver', variant: null, matrix: RESOLVER_MATRIX }],
    traceCount: null,
    traces: [],
  };
};

const context = (id: string, scope: string, subject: string, tokens: number | null) => ({
  id,
  scope,
  subject,
  provider: 'openai-tiktoken-local',
  tokenModel: 'gpt-4o',
  tokenizerVersion: '1.0.22',
  tokenizerVersionReason: null,
  contentConstruction:
    scope === 'package-scenario' ? 'measure-tokens-read-files' : 'eval-variant-context-join',
  files: ['libs/react-ui/package.json'],
  ...(tokens === null
    ? {
        missingPaths: ['libs/design-tokens/dist/AGENTS.md'],
        availability: 'unavailable',
        chars: null,
        tokens: null,
        reason: '없는 입력: libs/design-tokens/dist/AGENTS.md',
        reasonCode: 'missing-input',
      }
    : {
        missingPaths: [],
        availability: 'available',
        chars: tokens * 3,
        tokens,
        reason: null,
        reasonCode: null,
      }),
});

export const CONTEXTS = [
  context(
    'context.package-scenario.react-ui.baseline.openai',
    'package-scenario',
    'react-ui/baseline',
    134653,
  ),
  context(
    'context.package-scenario.design-tokens.agents-catalog.openai',
    'package-scenario',
    'design-tokens/agents+catalog',
    null,
  ),
  context(
    'context.variant-initial.consumer-docs.openai',
    'variant-initial',
    'consumer-docs',
    11959,
  ),
  context(
    'context.variant-initial.progressive-with-repair.openai',
    'variant-initial',
    'progressive-with-repair',
    35588,
  ),
  context(
    'context.variant-routed.progressive-with-repair.web.openai',
    'variant-routed',
    'progressive-with-repair@web',
    15195,
  ),
  context(
    'context.variant-routed.progressive-with-repair.react-native.openai',
    'variant-routed',
    'progressive-with-repair@react-native',
    20393,
  ),
];

export const evalArtifact = (runId = 'run-eval', { contexts = CONTEXTS } = {}) => ({
  ...publicArtifact(runId, { profile: 'eval' }),
  observations: [],
  contexts,
  evals: [evalRun()],
});
