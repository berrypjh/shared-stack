import { z } from 'zod';

import { excerptSchema } from './evidence.js';
import { VERIFICATION_KINDS, VERIFICATION_STATUSES } from './observation.js';
import { countSchema, gitShaSchema, isoTimeSchema, orUnknown, reasonSchema } from './primitives.js';
import { safeText } from './test-summary.js';

/**
 * consumer eval (`tools/evals/consumer`) 의 summary·trace 를 화면으로 옮기는 계약.
 * metric 을 새로 계산하지 않는다 — 원본 값·분자·분모·n 을 그대로 두고, 없는 값에 이유만 붙인다.
 */

export const EVAL_AXES = ['correctness', 'routing', 'context', 'verification'] as const;

/**
 * 값이 없는 이유. `zero-denominator`·`no-samples` 는 원본 분모·n 에서 확인한 것이고,
 * 확인할 수 없으면 `source-null` 이다.
 */
export const METRIC_NULL_REASONS = [
  'zero-denominator',
  'no-samples',
  'source-null',
  'not-run',
] as const;

type MetricSpec = { kind: 'rate' | 'aggregate'; axis: (typeof EVAL_AXES)[number] };

/** `VariantMetrics` 의 primary·secondary·diagnostic key 한 벌. 원본에 없는 metric 을 더하지 않는다. */
export const EVAL_METRICS = {
  primary: {
    verifiedTaskSuccessRate: { kind: 'rate', axis: 'correctness' },
    routingAccuracy: { kind: 'rate', axis: 'routing' },
    requiredEvidenceRecallAtK: { kind: 'aggregate', axis: 'routing' },
    medianInputTokens: { kind: 'aggregate', axis: 'context' },
    falseSuccessRate: { kind: 'rate', axis: 'verification' },
  },
  secondary: {
    wrongPackageRate: { kind: 'rate', axis: 'routing' },
    mrr: { kind: 'aggregate', axis: 'routing' },
    unnecessaryToolCallRate: { kind: 'rate', axis: 'context' },
    toolCallsPerSuccessfulTask: { kind: 'aggregate', axis: 'context' },
    tokensPerSuccessfulTask: { kind: 'aggregate', axis: 'context' },
    noToolCorrectness: { kind: 'rate', axis: 'correctness' },
    verificationInvocationRate: { kind: 'aggregate', axis: 'verification' },
    verificationPassRate: { kind: 'rate', axis: 'verification' },
    medianRepairAttempts: { kind: 'aggregate', axis: 'verification' },
    repairSuccessRate: { kind: 'rate', axis: 'verification' },
    repeatedFailureRate: { kind: 'rate', axis: 'verification' },
    verificationUnsupportedRate: { kind: 'rate', axis: 'verification' },
  },
  diagnostic: {
    medianRetrievedTokens: { kind: 'aggregate', axis: 'context' },
    medianRetrievedFiles: { kind: 'aggregate', axis: 'context' },
    medianDuplicateRetrievals: { kind: 'aggregate', axis: 'context' },
    medianLatencyMs: { kind: 'aggregate', axis: 'context' },
    medianRepairTokens: { kind: 'aggregate', axis: 'verification' },
    medianVerificationMs: { kind: 'aggregate', axis: 'verification' },
  },
} as const satisfies Record<'primary' | 'secondary' | 'diagnostic', Record<string, MetricSpec>>;

/** harness 가 계산하지 않는 metric 이름. 화면이 기존 metric 처럼 보여주지 않도록 남긴다. */
export const NON_HARNESS_METRICS = [
  'wrongPlatformRate',
  'hitRate',
  'stddev',
  'confidenceInterval',
  'passAt1',
] as const;

const nullReasonSchema = z.enum(METRIC_NULL_REASONS).nullable();

type Issue = { path?: (string | number)[]; message: string };

const rateIssues = (rate: {
  value: number | null;
  numerator: number;
  denominator: number;
  nullReason: string | null;
}): string[] => {
  const issues: string[] = [];
  if (rate.numerator > rate.denominator) issues.push('numerator exceeds denominator');
  if ((rate.value === null) !== (rate.nullReason !== null))
    issues.push('a null value needs a reason; a value has none');
  if (rate.denominator === 0 && (rate.value !== null || rate.nullReason !== 'zero-denominator')) {
    issues.push('a zero denominator has no value (zero-denominator)');
  }
  if (rate.nullReason === 'zero-denominator' && rate.denominator !== 0)
    issues.push('zero-denominator needs denominator 0');
  if (
    rate.value !== null &&
    rate.denominator > 0 &&
    Math.abs(rate.value - rate.numerator / rate.denominator) > 1e-9
  ) {
    issues.push('value must equal numerator / denominator');
  }
  return issues;
};

/** 원본 `Rate` — 분모가 0 이면 값이 없다. */
export const evalRateSchema = z
  .strictObject({
    kind: z.literal('rate'),
    value: z.number().min(0).max(1).nullable(),
    numerator: countSchema,
    denominator: countSchema,
    nullReason: nullReasonSchema,
  })
  .superRefine((rate, ctx) => {
    for (const message of rateIssues(rate)) ctx.addIssue({ code: 'custom', message });
  });

/** 원본 `Agg` — 표본이 없으면 값이 없다. */
export const evalAggregateSchema = z
  .strictObject({
    kind: z.literal('aggregate'),
    value: z.number().nullable(),
    n: countSchema,
    nullReason: nullReasonSchema,
  })
  .superRefine((aggregate, ctx) => {
    if ((aggregate.value === null) !== (aggregate.nullReason !== null)) {
      ctx.addIssue({ code: 'custom', message: 'a null value needs a reason; a value has none' });
    }
    if (aggregate.n === 0 && aggregate.value !== null) {
      ctx.addIssue({ code: 'custom', message: 'an aggregate without samples has no value' });
    }
    if (aggregate.nullReason === 'no-samples' && aggregate.n !== 0) {
      ctx.addIssue({ code: 'custom', message: 'no-samples needs n 0' });
    }
  });

type MetricSchemas<G extends Record<string, MetricSpec>> = {
  [K in keyof G]: G[K]['kind'] extends 'rate' ? typeof evalRateSchema : typeof evalAggregateSchema;
};

const metricGroup = <G extends Record<string, MetricSpec>>(group: G) =>
  z.strictObject(
    Object.fromEntries(
      Object.entries(group).map(([key, spec]) => [
        key,
        spec.kind === 'rate' ? evalRateSchema : evalAggregateSchema,
      ]),
    ) as MetricSchemas<G>,
  );

const METRIC_GROUPS = ['primary', 'secondary', 'diagnostic'] as const;
const slugSchema = z.string().regex(/^[a-z0-9-]+$/);

export const evalVariantSchema = z
  .strictObject({
    variant: slugSchema,
    label: safeText(100),
    tasks: countSchema,
    /** variant 의 전체 시행 수 (task 수 × task 당 반복). */
    trials: countSchema,
    primary: metricGroup(EVAL_METRICS.primary),
    secondary: metricGroup(EVAL_METRICS.secondary),
    diagnostic: metricGroup(EVAL_METRICS.diagnostic),
    failureBreakdown: z.record(slugSchema, countSchema),
    /** 원본 `unsupported` — 값이 null 인 metric 전체다. 화면이 지원하지 않는 목록이 아니다. */
    unsupported: z.array(z.string()),
    context: z.strictObject({
      tokens: countSchema.nullable(),
      files: countSchema,
      missingPaths: z.array(safeText(300)),
      tokenModel: safeText(64),
      routed: z
        .record(slugSchema, z.strictObject({ tokens: countSchema.nullable(), files: countSchema }))
        .nullable(),
    }),
    /** D4·D5 는 harness 가 check 를 직접 실행한다. 나머지는 executor 가 보고한 값이다. */
    verificationAuthority: z.enum(['harness-executed', 'executor-reported']),
    /**
     * repair 가 variant 에 없거나, 있어도 executor 가 hook 을 주지 않았거나 (smoke·replay·unavailable),
     * 산출물만으로 hook 유무를 알 수 없다.
     */
    repair: z.enum(['not-in-variant', 'no-repair-hook', 'unknown']),
  })
  .superRefine((variant, ctx) => {
    const nullKeys = METRIC_GROUPS.flatMap((group) =>
      Object.entries(variant[group] as Record<string, { value: number | null }>)
        .filter(([, metric]) => metric.value === null)
        .map(([key]) => `${group}.${key}`),
    );
    if (JSON.stringify([...nullKeys].sort()) !== JSON.stringify([...variant.unsupported].sort())) {
      ctx.addIssue({
        code: 'custom',
        path: ['unsupported'],
        message: 'unsupported must list exactly the null metrics',
      });
    }
    const success = variant.primary.verifiedTaskSuccessRate;
    const failures = Object.values(variant.failureBreakdown).reduce((sum, count) => sum + count, 0);
    if (success.denominator !== variant.trials) {
      ctx.addIssue({
        code: 'custom',
        path: ['trials'],
        message: 'the success denominator is the trial count',
      });
    }
    if (success.numerator + failures !== variant.trials) {
      ctx.addIssue({
        code: 'custom',
        path: ['failureBreakdown'],
        message: 'every trial is either a success or exactly one failure category',
      });
    }
  });

/** confusion 행 label (expected) 과 열 label (predicted). `both`·`unreported` 를 빼지 않는다. */
export const CONFUSION_EXPECTED = ['web', 'react-native', 'both', 'none'] as const;
export const CONFUSION_PREDICTED = ['web', 'react-native', 'none', 'both', 'unreported'] as const;

const confusionRowSchema = z.strictObject({
  web: countSchema,
  'react-native': countSchema,
  none: countSchema,
  both: countSchema,
  unreported: countSchema,
});

export const confusionMatrixSchema = z
  .strictObject({
    rows: z.strictObject({
      web: confusionRowSchema,
      'react-native': confusionRowSchema,
      both: confusionRowSchema,
      none: confusionRowSchema,
    }),
    total: countSchema,
    correct: countSchema,
    unreported: countSchema,
    accuracy: z.number().min(0).max(1).nullable(),
  })
  .superRefine((matrix, ctx) => {
    const rows = CONFUSION_EXPECTED.map((expected) => matrix.rows[expected]);
    const cells = rows.flatMap((row) => CONFUSION_PREDICTED.map((predicted) => row[predicted]));
    const issues: string[] = [];
    if (cells.reduce((sum, count) => sum + count, 0) !== matrix.total)
      issues.push('cells must add up to total');
    const diagonal = CONFUSION_EXPECTED.reduce(
      (sum, expected) => sum + matrix.rows[expected][expected],
      0,
    );
    if (diagonal !== matrix.correct) issues.push('correct must equal the diagonal');
    if (rows.reduce((sum, row) => sum + row.unreported, 0) !== matrix.unreported) {
      issues.push('unreported must equal the unreported column');
    }
    if ((matrix.total === 0) !== (matrix.accuracy === null))
      issues.push('accuracy is null exactly when total is 0');
    if (
      matrix.accuracy !== null &&
      Math.abs(matrix.accuracy - matrix.correct / matrix.total) > 1e-9
    ) {
      issues.push('accuracy must equal correct / total');
    }
    for (const message of issues) ctx.addIssue({ code: 'custom', message });
  });

const kindSchema = z.enum(VERIFICATION_KINDS);
const platformSchema = z.enum(CONFUSION_EXPECTED);
const splitSchema = z.enum(['dev', 'test']);

/** 채점된 trace 한 건의 공개 가능한 상세. prompt·gold 문장·변경 파일 내용은 담지 않는다. */
export const evalTraceSchema = z
  .strictObject({
    id: safeText(300),
    variant: slugSchema,
    taskId: slugSchema,
    trial: z.number().int().positive(),
    split: splitSchema,
    expectedPlatform: platformSchema,
    selectedPlatform: platformSchema.nullable(),
    claimedSuccess: z.union([z.boolean(), z.literal('unknown')]).nullable(),
    routing: z.strictObject({
      platformCorrect: z.boolean().nullable(),
      packageCorrect: z.boolean().nullable(),
      forbiddenPackagesUsed: z.array(safeText(214)),
      unnecessaryUiRouting: z.boolean().nullable(),
    }),
    retrieval: z.strictObject({
      k: z.number().int().positive(),
      requiredCount: countSchema,
      hitsAtK: countSchema,
      recallAtK: z.number().min(0).max(1).nullable(),
      /** 전체 ranked list 에서의 reciprocal rank (top-K 로 자르지 않는다). */
      reciprocalRank: z.number().min(0).max(1).nullable(),
      firstHitRank: z.number().int().positive().nullable(),
      /** 같은 evidence ID 를 다시 가져온 수. */
      evidenceDuplicates: countSchema,
      /** 같은 target 을 다시 읽은 tool call 수. evidence 중복과 다른 신호다. */
      toolCallDuplicates: countSchema,
      nullReason: z.enum(['no-required-evidence']).nullable(),
      /** held-out split 의 공개 artifact 에서는 null (gold 비공개). */
      required: z.array(safeText(300)).nullable(),
      retrieved: z.array(safeText(300)).nullable(),
    }),
    verification: z.strictObject({
      requiredKinds: z.array(kindSchema),
      missingRequired: z.array(kindSchema),
      failedRequired: z.array(kindSchema),
      unsupportedRequired: z.array(kindSchema),
      invocationRate: z.number().min(0).max(1).nullable(),
      passed: z.boolean().nullable(),
      runs: z.array(
        z.strictObject({
          kind: kindSchema,
          required: z.boolean(),
          status: z.enum(VERIFICATION_STATUSES),
          attempt: countSchema,
          durationMs: countSchema.nullable(),
          exitCode: z.number().int().nullable(),
          failureFingerprint: safeText(500).nullable(),
          excerpt: excerptSchema.nullable(),
        }),
      ),
    }),
    success: z.strictObject({
      taskSucceeded: z.boolean(),
      falseSuccess: z.boolean(),
      claimCounted: z.boolean(),
      failureCategory: slugSchema.nullable(),
    }),
    repair: z.strictObject({
      attempts: countSchema,
      succeeded: z.boolean().nullable(),
      repeatedFailures: countSchema.nullable(),
    }),
    changedFiles: z.array(z.strictObject({ path: safeText(300), content: z.literal('redacted') })),
  })
  .superRefine((trace, ctx) => {
    const issues: Issue[] = [];
    if (trace.id !== `${trace.variant}::${trace.taskId}::${trace.trial}`) {
      issues.push({ path: ['id'], message: 'id must be variant::taskId::trial' });
    }
    if (trace.success.falseSuccess && trace.claimedSuccess !== true) {
      issues.push({
        path: ['success', 'falseSuccess'],
        message: 'false success needs an explicit true claim',
      });
    }
    if (trace.success.claimCounted !== (typeof trace.claimedSuccess === 'boolean')) {
      issues.push({
        path: ['success', 'claimCounted'],
        message: 'only explicit true/false claims are counted',
      });
    }
    const { retrieval } = trace;
    const noEvidence = retrieval.requiredCount === 0;
    if (noEvidence !== (retrieval.nullReason !== null)) {
      issues.push({
        path: ['retrieval', 'nullReason'],
        message: 'no-required-evidence exactly when nothing is required',
      });
    }
    if (
      (retrieval.recallAtK === null) !== noEvidence ||
      (retrieval.reciprocalRank === null) !== noEvidence
    ) {
      issues.push({
        path: ['retrieval', 'recallAtK'],
        message: 'recall and RR are N/A exactly when nothing is required',
      });
    }
    if (trace.success.taskSucceeded !== (trace.success.failureCategory === null)) {
      issues.push({
        path: ['success', 'failureCategory'],
        message: 'a failed trial has exactly one failure category',
      });
    }
    for (const issue of issues) ctx.addIssue({ code: 'custom', ...issue });
  });

export const EVAL_NOTICE_CODES = [
  'harness-smoke',
  'no-live-executor',
  'no-baseline',
  'baseline-not-requested',
  'unsupported-required-check',
  'replay-without-repair-hook',
  'partial-import',
] as const;

export const EXECUTOR_CLASSES = [
  'harness-smoke',
  'scripted',
  'replay',
  'unavailable',
  'unknown',
] as const;

const importStatusSchema = z
  .strictObject({
    status: z.enum(['parsed', 'missing', 'invalid', 'not-run']),
    reason: reasonSchema.nullable(),
  })
  .refine(
    (status) => (status.status === 'parsed') === (status.reason === null),
    'a reason is required unless parsed',
  );

/** 원본 run 조건 (`RunConditions`). 비교 가능성 판단에 그대로 쓴다. */
const conditionsSchema = z.strictObject({
  gitSha: z.string().min(1).max(64).nullable(),
  ref: z.string().max(300).nullable(),
  split: splitSchema,
  datasetHash: z.string().regex(/^[0-9a-f]{16}$/),
  datasetTaskCount: countSchema,
  variants: z.array(slugSchema),
  trials: z.number().int().positive(),
  executor: safeText(100),
  model: safeText(100).nullable(),
  modelSettings: z.record(z.string(), z.unknown()).nullable(),
  timeoutMs: countSchema.nullable(),
  capabilityHash: z.string().regex(/^[0-9a-f]{16}$/),
  catalogSchemaVersion: z.number().int().nonnegative(),
  harnessVersion: safeText(40),
});

const NO_LIVE_EXECUTOR = new Set(['harness-smoke', 'scripted', 'unavailable']);

type EvalRunShape = {
  origin: { taskCount: number; trialsPerTask: number } | null;
  executorClass: string | null;
  import: Record<'summary' | 'traces', { status: string }>;
  notices: { code: string }[];
  variants: { trials: number }[];
  routing: { source: string; variant: string | null }[];
  traceCount: number | null;
  traces: { id: string }[];
};

const runIssues = (run: EvalRunShape): string[] => {
  const issues: string[] = [];
  const summaryParsed = run.import.summary.status === 'parsed';
  const tracesParsed = run.import.traces.status === 'parsed';
  if ((run.origin !== null) !== summaryParsed)
    issues.push('origin comes only from a parsed summary');
  if ((run.executorClass !== null) !== summaryParsed)
    issues.push('executor class comes only from a parsed summary');
  if (!summaryParsed && run.variants.length > 0) issues.push('variants need a parsed summary');
  if (!tracesParsed && run.traces.length > 0) issues.push('traces need a parsed trace file');
  if (tracesParsed !== (run.traceCount !== null))
    issues.push('traceCount exists exactly when traces are parsed');

  const variantTrials = run.variants.reduce((sum, variant) => sum + variant.trials, 0);
  if (run.origin) {
    const expected = run.origin.taskCount * run.origin.trialsPerTask * run.variants.length;
    if (variantTrials !== expected)
      issues.push('variant trials must equal taskCount × trialsPerTask × variants');
  }
  if (run.traceCount !== null) {
    if (run.traceCount !== run.traces.length) issues.push('traceCount must equal the traces');
    if (summaryParsed && run.traceCount !== variantTrials)
      issues.push('summary and trace totals differ');
  }
  const ids = run.traces.map((trace) => trace.id);
  if (new Set(ids).size !== ids.length) issues.push('duplicate variant::task::trial trace');

  const codes = new Set(run.notices.map((notice) => notice.code));
  if (run.executorClass === 'harness-smoke' && !codes.has('harness-smoke')) {
    issues.push('smoke-scripted results always carry the harness-smoke notice');
  }
  if (
    run.executorClass !== null &&
    NO_LIVE_EXECUTOR.has(run.executorClass) &&
    !codes.has('no-live-executor')
  ) {
    issues.push('results without a live executor must say so');
  }
  for (const entry of run.routing) {
    if ((entry.source === 'trace-grades') !== (entry.variant !== null)) {
      issues.push('trace-grade routing belongs to a variant; resolver routing does not');
    }
  }
  return issues;
};

export const ORIGINAL_COMPARISON_STATUSES = [
  'no-baseline',
  'corrupt-baseline',
  'compared',
] as const;

/**
 * evaluator 가 낸 baseline 비교(`compareToBaseline`)를 그대로 옮긴다. 대시보드 비교 가능성과 섞지 않는다.
 * `summary` 는 summary.json 의 comparison, `baseline-file` 은 수집기가 baseline 파일만 확인한 결과다.
 * 깨진 baseline 은 없는 baseline 과 다른 상태이고 이유가 있다.
 */
export const originalEvalComparisonSchema = z
  .strictObject({
    source: z.enum(['summary', 'baseline-file']),
    status: z.enum(ORIGINAL_COMPARISON_STATUSES),
    comparable: z.boolean().nullable(),
    warnings: z.array(
      z.strictObject({
        field: safeText(100),
        baseline: z.string().max(2000),
        current: z.string().max(2000),
      }),
    ),
    reason: reasonSchema.nullable(),
  })
  .refine(
    (comparison) => (comparison.status === 'corrupt-baseline') === (comparison.reason !== null),
    'only a corrupt baseline carries a reason',
  )
  .refine(
    (comparison) => (comparison.status === 'compared') === (comparison.comparable !== null),
    'comparable is known exactly when compared',
  );

export type OriginalEvalComparison = z.infer<typeof originalEvalComparisonSchema>;

/** eval 산출물 한 벌 (summary·traces·resolver routing·context) 을 import 한 결과. */
export const evalRunSchema = z
  .strictObject({
    sourceId: z.string().regex(/^eval:[\w.-]{1,120}$/),
    /** 원본 run 의 식별·조건. 수집기 metadata 와 섞지 않는다. summary 가 없으면 null. */
    origin: z
      .strictObject({
        runId: safeText(120),
        createdAt: isoTimeSchema,
        split: splitSchema,
        gitSha: orUnknown(gitShaSchema),
        executor: safeText(100),
        model: safeText(100).nullable(),
        harnessVersion: safeText(40),
        k: z.number().int().positive(),
        taskCount: countSchema,
        /** task 당 반복 수. 전체 trace 수가 아니다. */
        trialsPerTask: z.number().int().positive(),
        conditions: conditionsSchema.nullable(),
      })
      .nullable(),
    executorClass: z.enum(EXECUTOR_CLASSES).nullable(),
    import: z.strictObject({
      summary: importStatusSchema,
      traces: importStatusSchema,
      routing: importStatusSchema,
      context: importStatusSchema,
    }),
    notices: z.array(z.strictObject({ code: z.enum(EVAL_NOTICE_CODES), message: reasonSchema })),
    variants: z.array(evalVariantSchema),
    routing: z.array(
      z.strictObject({
        source: z.enum(['trace-grades', 'deterministic-resolver']),
        variant: slugSchema.nullable(),
        matrix: confusionMatrixSchema,
      }),
    ),
    traceCount: countSchema.nullable(),
    traces: z.array(evalTraceSchema),
    /** evaluator 원래 비교. 이 필드 이전 export 는 null — 가져오지 않았다. */
    originalComparison: originalEvalComparisonSchema.nullable().default(null),
  })
  .superRefine((run, ctx) => {
    for (const message of runIssues(run)) ctx.addIssue({ code: 'custom', message });
  });

export type EvalRate = z.infer<typeof evalRateSchema>;
export type EvalAggregate = z.infer<typeof evalAggregateSchema>;
export type EvalVariant = z.infer<typeof evalVariantSchema>;
export type ConfusionMatrix = z.infer<typeof confusionMatrixSchema>;
export type EvalTrace = z.infer<typeof evalTraceSchema>;
export type EvalRun = z.infer<typeof evalRunSchema>;
