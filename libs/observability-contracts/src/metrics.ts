import { z } from 'zod';

import { BUNDLE_CONDITIONS, type BundleMeasurement } from './bundle.js';
import { CONTEXT_CONDITIONS, type ContextMeasurement } from './context.js';
import { EVAL_METRICS, type EvalRun } from './eval.js';
import type { RunArtifact } from './run.js';

/**
 * 실행 사이 비교·추세에 쓰는 metric 점 한 벌. 값은 원본 그대로이고, `comparableKey` 는 값을 비교해도
 * 되는 조건(방법·압축·external·provider·tokenizer·scope·eval 조건)을 안정적으로 직렬화한 것이다.
 * source SHA 는 key 가 아니다 — SHA 가 달라지는 것이 비교하려는 변화다.
 */

export const SERIES_DOMAINS = ['bundle', 'context', 'eval'] as const;
export const SERIES_UNITS = ['bytes', 'tokens', 'ratio'] as const;
/** `median`·`aggregate` 는 원본 요약 통계다. 두 median 의 차이는 통계 검정이 아니다. */
export const SERIES_STATISTICS = ['value', 'rate', 'median', 'aggregate'] as const;

export const seriesPointSchema = z.strictObject({
  id: z.string().min(1).max(300),
  domain: z.enum(SERIES_DOMAINS),
  label: z.string().min(1).max(300),
  unit: z.enum(SERIES_UNITS),
  statistic: z.enum(SERIES_STATISTICS),
  value: z.number().finite().nullable(),
  comparableKey: z.string().min(2).max(4000),
  /** 조건을 모두 알 때만 true. 모르는 조건은 `unknownKeys` 에 있고 비교 가능으로 가정하지 않는다. */
  keyComplete: z.boolean(),
  unknownKeys: z.array(z.string().min(1).max(100)),
});

export type SeriesPoint = z.infer<typeof seriesPointSchema>;

const sortKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value === null || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, sortKeys((value as Record<string, unknown>)[key])]),
  );
};

export const stableJson = (value: unknown) => JSON.stringify(sortKeys(value));

const point = (
  fields: Omit<SeriesPoint, 'comparableKey' | 'keyComplete'> & { key: Record<string, unknown> },
): SeriesPoint => {
  const { key, ...rest } = fields;
  return { ...rest, comparableKey: stableJson(key), keyComplete: rest.unknownKeys.length === 0 };
};

export const bundleKey = (measurement: BundleMeasurement) => ({
  domain: 'bundle',
  ...Object.fromEntries(BUNDLE_CONDITIONS.map((key) => [key, measurement[key]])),
  tool: `${measurement.tool.name}@${measurement.tool.version}`,
  externals: [...measurement.externals].sort(),
});

const bundlePoint = (measurement: BundleMeasurement): SeriesPoint =>
  point({
    id: measurement.id,
    domain: 'bundle',
    label: measurement.caseName,
    unit: 'bytes',
    statistic: 'value',
    value: measurement.value,
    unknownKeys: [],
    key: bundleKey(measurement),
  });

const contextPoint = (measurement: ContextMeasurement): SeriesPoint =>
  point({
    id: measurement.id,
    domain: 'context',
    label: measurement.subject,
    unit: 'tokens',
    statistic: 'value',
    value: measurement.tokens,
    unknownKeys: measurement.tokenizerVersion === null ? ['tokenizerVersion'] : [],
    key: {
      domain: 'context',
      ...Object.fromEntries(CONTEXT_CONDITIONS.map((key) => [key, measurement[key]])),
    },
  });

type PrimaryMetric = keyof typeof EVAL_METRICS.primary;

const EVAL_UNIT: Record<PrimaryMetric, SeriesPoint['unit']> = {
  verifiedTaskSuccessRate: 'ratio',
  routingAccuracy: 'ratio',
  requiredEvidenceRecallAtK: 'ratio',
  medianInputTokens: 'tokens',
  falseSuccessRate: 'ratio',
};

const statisticOf = (metric: PrimaryMetric): SeriesPoint['statistic'] => {
  if (EVAL_METRICS.primary[metric].kind === 'rate') return 'rate';
  return metric.startsWith('median') ? 'median' : 'aggregate';
};

/** eval 비교 조건. 원본 조건에서 git 위치(gitSha·ref)만 뺀다. */
export const evalKey = (run: EvalRun) => {
  const { origin } = run;
  if (!origin) return null;
  const conditions = origin.conditions && {
    ...origin.conditions,
    gitSha: undefined,
    ref: undefined,
  };
  return {
    domain: 'eval',
    sourceId: run.sourceId,
    k: origin.k,
    taskCount: origin.taskCount,
    trialsPerTask: origin.trialsPerTask,
    conditions: conditions ? JSON.parse(JSON.stringify(conditions)) : null,
  };
};

/** 모르면 비교 가능으로 가정하지 않는 eval 조건. task 수가 dataset 보다 적으면 어떤 부분집합인지 모른다. */
export const evalUnknownKeys = (run: EvalRun): string[] => {
  const conditions = run.origin?.conditions;
  if (!run.origin || !conditions) return ['conditions'];
  const unknown: string[] = [];
  if (conditions.modelSettings === null) unknown.push('conditions.modelSettings');
  if (conditions.timeoutMs === null) unknown.push('conditions.timeoutMs');
  if (run.origin.taskCount < conditions.datasetTaskCount) unknown.push('task-subset');
  return unknown;
};

const evalPoints = (run: EvalRun): SeriesPoint[] => {
  const key = evalKey(run);
  if (!key) return [];
  const unknownKeys = evalUnknownKeys(run);
  return run.variants.flatMap((variant) =>
    (Object.keys(EVAL_METRICS.primary) as PrimaryMetric[]).map((metric) =>
      point({
        id: `${run.sourceId}:${variant.variant}:${metric}`,
        domain: 'eval',
        label: `${run.sourceId} ${variant.variant} ${metric}`,
        unit: EVAL_UNIT[metric],
        statistic: statisticOf(metric),
        value: variant.primary[metric].value,
        unknownKeys,
        key: { ...key, variant: variant.variant, metric },
      }),
    ),
  );
};

/** run 하나의 비교 가능한 metric 점. trace·raw·evidence 는 싣지 않는다. */
export const metricPoints = (artifact: RunArtifact): SeriesPoint[] => [
  ...artifact.bundles.map(bundlePoint),
  ...artifact.contexts.map(contextPoint),
  ...artifact.evals.flatMap(evalPoints),
];
