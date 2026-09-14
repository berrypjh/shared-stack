import { EVAL_METRICS } from '@berrypjh/observability-contracts';

import { z } from 'zod';

import {
  FAILURE_CATEGORIES,
  type RetrievalGrade,
  type RoutingGrade,
  type TaskGrade,
  type TaskSuccessGrade,
  type VerificationGrade,
} from '../../../evals/consumer/graders';
import type { RunSummary, VariantMetrics } from '../../../evals/consumer/reporters/aggregate';
import {
  type ConfusionMatrix,
  PREDICTED_CLASSES,
} from '../../../evals/consumer/reporters/confusion';
import { parseJsonl } from '../../../evals/consumer/runner/jsonl';
import { SPLITS, verificationKindSchema } from '../../../evals/consumer/runner/schema';
import { type GradedTrace, parseTraces } from '../../../evals/consumer/runner/trace';
import type { VariantContext } from '../../../evals/consumer/variants/context';

/**
 * consumer eval 산출물 (`summary.json`·`traces.jsonl`·offline JSON) reader.
 * 다시 실행·재채점하지 않는다. 형태만 확인하고, 깨진 곳은 파일·줄 번호와 함께 알린다.
 */

export class EvalImportError extends Error {}

const count = z.number().int().nonnegative();
const rateSchema = z.strictObject({
  value: z.number().nullable(),
  numerator: count,
  denominator: count,
});
const aggSchema = z.strictObject({ value: z.number().nullable(), n: count });

type MetricSchemas<G extends Record<string, { kind: 'rate' | 'aggregate' }>> = {
  [K in keyof G]: G[K]['kind'] extends 'rate' ? typeof rateSchema : typeof aggSchema;
};

/** contracts registry 의 key 로만 만든다 — harness 에 metric 이 늘면 strict 가 거부한다. */
const metricGroup = <G extends Record<string, { kind: 'rate' | 'aggregate' }>>(group: G) =>
  z.strictObject(
    Object.fromEntries(
      Object.entries(group).map(([key, spec]) => [
        key,
        spec.kind === 'rate' ? rateSchema : aggSchema,
      ]),
    ) as MetricSchemas<G>,
  );

const contextSizeSchema = z.object({
  files: z.array(z.string()),
  missingPaths: z.array(z.string()),
  chars: z.number().int().nullable(),
  tokens: z.number().int().nullable(),
});

const variantContextSchema = contextSizeSchema.extend({
  variant: z.string(),
  tokenModel: z.string(),
  routed: z.record(z.string(), contextSizeSchema).nullable(),
});

const confusionRowSchema = z.object(
  Object.fromEntries(PREDICTED_CLASSES.map((predicted) => [predicted, count])) as Record<
    (typeof PREDICTED_CLASSES)[number],
    typeof count
  >,
);

const confusionSchema = z.object({
  rows: z.object({
    web: confusionRowSchema,
    'react-native': confusionRowSchema,
    both: confusionRowSchema,
    none: confusionRowSchema,
  }),
  total: count,
  correct: count,
  unreported: count,
  accuracy: z.number().nullable(),
});

const variantMetricsSchema = z.object({
  variant: z.string(),
  label: z.string(),
  tasks: count,
  trials: count,
  context: variantContextSchema,
  primary: metricGroup(EVAL_METRICS.primary),
  secondary: metricGroup(EVAL_METRICS.secondary),
  diagnostic: metricGroup(EVAL_METRICS.diagnostic),
  failureBreakdown: z.record(z.enum(FAILURE_CATEGORIES), count),
  unsupported: z.array(z.string()),
});

const conditionsSchema = z.object({
  gitSha: z.string().nullable(),
  ref: z.string().nullable(),
  split: z.enum(SPLITS),
  datasetHash: z.string(),
  datasetTaskCount: count,
  variants: z.array(z.string()),
  trials: count,
  executor: z.string(),
  model: z.string().nullable(),
  modelSettings: z.record(z.string(), z.unknown()).nullable(),
  timeoutMs: count.nullable(),
  capabilityHash: z.string(),
  catalogSchemaVersion: count,
  harnessVersion: z.string(),
});

const summarySchema = z.object({
  runId: z.string(),
  createdAt: z.string(),
  split: z.string(),
  gitSha: z.string().nullable(),
  executor: z.string(),
  model: z.string().nullable(),
  harnessVersion: z.string(),
  taskCount: count,
  /** task 당 반복 수. 전체 trace 수가 아니다. */
  trialCount: count,
  k: z.number().int().positive(),
  variants: z.array(variantMetricsSchema),
  routingConfusion: z.record(z.string(), confusionSchema).nullable(),
  conditions: conditionsSchema.nullable(),
  /** evaluator 비교. 옮기는 상태·comparable·warnings 만 확인하고 나머지(deltas 등)는 그대로 둔다. */
  comparison: z
    .discriminatedUnion('status', [
      z.looseObject({ status: z.literal('no-baseline') }),
      z.looseObject({
        status: z.literal('compared'),
        comparable: z.boolean(),
        warnings: z.array(
          z.strictObject({ field: z.string(), baseline: z.string(), current: z.string() }),
        ),
      }),
    ])
    .nullable(),
});

const kinds = z.array(verificationKindSchema);
const routingGradeSchema = z.object({
  platformCorrect: z.boolean().nullable(),
  packageCorrect: z.boolean().nullable(),
  forbiddenPackagesUsed: z.array(z.string()),
  unnecessaryUiRouting: z.boolean().nullable(),
});
const retrievalGradeSchema = z.object({
  k: z.number().int().positive(),
  required: z.array(z.string()),
  retrievedCount: count,
  hitsAtK: count,
  recallAtK: z.number().nullable(),
  firstHitRank: z.number().int().positive().nullable(),
  reciprocalRank: z.number().nullable(),
  duplicateRetrievals: count,
});
const verificationGradeSchema = z.object({
  requiredKinds: kinds,
  invokedKinds: kinds,
  missingRequired: kinds,
  failedRequired: kinds,
  unsupportedRequired: kinds,
  invocationRate: z.number().nullable(),
  passed: z.boolean().nullable(),
});
const successGradeSchema = z.object({
  taskSucceeded: z.boolean(),
  falseSuccess: z.boolean(),
  claimCounted: z.boolean(),
  failureCategory: z.enum(FAILURE_CATEGORIES).nullable(),
});
/** public-import 채점은 화면에 쓰지 않는다 — 통과 여부만 확인하고 나머지는 그대로 둔다. */
const gradedSchema = z.object({
  grade: z.object({
    routing: routingGradeSchema,
    retrieval: retrievalGradeSchema,
    publicImport: z.looseObject({ passed: z.boolean() }),
    verification: verificationGradeSchema,
    success: successGradeSchema,
  }),
});

const routingReportSchema = z
  .object({
    kind: z.literal('routing-only'),
    executor: z.null(),
    split: z.enum(SPLITS),
    resolver: z.literal('deterministic'),
    matrix: confusionSchema,
    decisions: z.array(z.object({ taskId: z.string() })),
  })
  .refine(
    (report) => report.decisions.length === report.matrix.total,
    'decisions must match matrix total',
  );

const contextReportSchema = z.object({
  kind: z.literal('context-only'),
  executor: z.null(),
  contexts: z.array(variantContextSchema),
});

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Assert<T extends true> = T;
/** harness 타입이 바뀌면 여기서 typecheck 가 깨진다. */
export type EvalSchemasMatchHarness = [
  Assert<Same<z.infer<typeof summarySchema>['variants'][number], Omit<VariantMetrics, never>>>,
  Assert<Same<Omit<z.infer<typeof summarySchema>, 'comparison'>, Omit<RunSummary, 'comparison'>>>,
  Assert<Same<z.infer<typeof confusionSchema>, ConfusionMatrix>>,
  Assert<Same<z.infer<typeof variantContextSchema>, VariantContext>>,
  Assert<Same<z.infer<typeof routingGradeSchema>, RoutingGrade>>,
  Assert<Same<z.infer<typeof retrievalGradeSchema>, RetrievalGrade>>,
  Assert<Same<z.infer<typeof verificationGradeSchema>, VerificationGrade>>,
  Assert<Same<z.infer<typeof successGradeSchema>, TaskSuccessGrade>>,
];

const issuesOf = (error: z.ZodError) =>
  error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`).join('; ');

const parseWith = <T>(schema: z.ZodType<T>, text: string, label: string, what: string): T => {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new EvalImportError(`${label} is not valid JSON`);
  }
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new EvalImportError(`${label} does not match the ${what} — ${issuesOf(result.error)}`);
  }
  return result.data;
};

export const parseEvalSummary = (text: string, label: string): RunSummary =>
  parseWith(summarySchema, text, label, 'eval summary') as RunSummary;

/** 기존 `parseTraces` 로 trace 를 검증하고, 같은 줄의 grade 와 variant·task·trial 중복을 확인한다. */
export const parseGradedTraces = (text: string, label: string): GradedTrace[] => {
  let traces;
  try {
    traces = parseTraces(text, label);
  } catch (error) {
    throw new EvalImportError((error as Error).message);
  }
  const firstLine = new Map<string, number>();
  return parseJsonl(text, label).map(({ line, value }, index) => {
    const graded = gradedSchema.safeParse(value);
    if (!graded.success) {
      throw new EvalImportError(`${label}:${line} invalid grade — ${issuesOf(graded.error)}`);
    }
    const trace = traces[index];
    const id = `${trace.variant}::${trace.taskId}::${trace.trial}`;
    const first = firstLine.get(id);
    if (first !== undefined) {
      throw new EvalImportError(`${label}:${line} duplicate trace ${id} (first at line ${first})`);
    }
    firstLine.set(id, line);
    return { ...trace, grade: graded.data.grade as TaskGrade };
  });
};

/** `--routing-only --json` 출력. 화면에는 split 과 confusion 만 싣는다. */
export const parseRoutingReport = (
  text: string,
  label: string,
): { split: (typeof SPLITS)[number]; matrix: ConfusionMatrix } => {
  const { split, matrix } = parseWith(routingReportSchema, text, label, 'routing-only report');
  return { split, matrix };
};

/** `--context-only --json` 출력. */
export const parseContextReport = (text: string, label: string): VariantContext[] =>
  parseWith(contextReportSchema, text, label, 'context-only report').contexts;
