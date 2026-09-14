/**
 * eval run 을 화면 글·격자로. metric 이름·분자·분모·n 은 원본 그대로 쓰고,
 * 수집기가 계산하지 않은 비율·합산 점수를 새로 만들지 않는다.
 */
import {
  CONFUSION_EXPECTED,
  CONFUSION_PREDICTED,
  type ConfusionMatrix,
  EVAL_METRICS,
  type EvalAggregate,
  type EvalRate,
  type EvalRun,
  type EvalTrace,
  VERIFICATION_KINDS,
  VERIFICATION_STATUSES,
} from '@berrypjh/observability-contracts';

export type MetricGroup = keyof typeof EVAL_METRICS;
export type PrimaryKey = keyof typeof EVAL_METRICS.primary;

export const PRIMARY_KEYS = Object.keys(EVAL_METRICS.primary) as PrimaryKey[];

export const metricKeys = (group: MetricGroup) => Object.keys(EVAL_METRICS[group]);

export type MetricFormat = 'rate' | 'mean' | 'tokens' | 'ms' | 'count';

/** aggregate 의 단위. registry 에 없는 key 는 단위 없는 평균값으로 읽는다. */
const AGGREGATE_FORMAT: Record<string, MetricFormat> = {
  medianInputTokens: 'tokens',
  tokensPerSuccessfulTask: 'tokens',
  medianRetrievedTokens: 'tokens',
  medianRepairTokens: 'tokens',
  medianLatencyMs: 'ms',
  medianVerificationMs: 'ms',
  medianRetrievedFiles: 'count',
  toolCallsPerSuccessfulTask: 'count',
  medianDuplicateRetrievals: 'count',
  medianRepairAttempts: 'count',
};

export const metricFormatOf = (group: MetricGroup, key: string): MetricFormat => {
  const spec = (EVAL_METRICS[group] as Record<string, { kind: string }>)[key];
  return spec?.kind === 'rate' ? 'rate' : (AGGREGATE_FORMAT[key] ?? 'mean');
};

const NULL_REASON_LABEL: Record<string, string> = {
  'zero-denominator': '분모 0',
  'no-samples': '표본 없음',
  'source-null': '원본 값 없음',
  'not-run': '실행 안 함',
};

const integer = new Intl.NumberFormat('en-US');

const nullText = (reason: string | null) =>
  `N/A — ${reason ? (NULL_REASON_LABEL[reason] ?? reason) : '이유 없음'}`;

/** rate 는 `%` 와 분자/분모, aggregate 는 값과 n. 값이 없으면 0 이 아니라 N/A 와 이유다. */
export const metricText = (metric: EvalRate | EvalAggregate, format: MetricFormat) => {
  if (metric.kind === 'rate') {
    const fraction = `(${metric.numerator}/${metric.denominator})`;
    return metric.value === null
      ? `${nullText(metric.nullReason)} ${fraction}`
      : `${(metric.value * 100).toFixed(1)}% ${fraction}`;
  }
  const n = `(n=${metric.n})`;
  if (metric.value === null) return `${nullText(metric.nullReason)} ${n}`;
  switch (format) {
    case 'tokens':
      return `${integer.format(metric.value)} tokens ${n}`;
    case 'ms':
      return `${integer.format(metric.value)} ms ${n}`;
    case 'count':
      return `${integer.format(metric.value)} ${n}`;
    default:
      return `${metric.value.toFixed(2)} ${n}`;
  }
};

/** eval report import 상태를 not-run 이유 글로. */
export const importReason = (
  name: keyof EvalRun['import'],
  status: { status: string; reason: string | null },
) => `${name} report import ${status.status}${status.reason ? ` — ${status.reason}` : ''}`;

export type RoutingSource = EvalRun['routing'][number]['source'];

/** routing 결과가 없으면 null — 0 으로 채운 격자가 아니라 미측정이다. */
export const routingMatrix = (
  run: EvalRun,
  source: RoutingSource,
  variant: string | null,
): ConfusionMatrix | null =>
  run.routing.find((entry) => entry.source === source && entry.variant === variant)?.matrix ?? null;

export type ConfusionCell = {
  expected: (typeof CONFUSION_EXPECTED)[number];
  predicted: (typeof CONFUSION_PREDICTED)[number];
  count: number;
  diagonal: boolean;
};

/** expected 4행 × predicted 5열. 순서를 바꾸지 않고 both·unreported 를 숨기지 않는다. */
export const confusionGrid = (matrix: ConfusionMatrix) =>
  CONFUSION_EXPECTED.map((expected) => {
    const row = matrix.rows[expected];
    const cells: ConfusionCell[] = CONFUSION_PREDICTED.map((predicted) => ({
      expected,
      predicted,
      count: row[predicted],
      diagonal: expected === predicted,
    }));
    return { expected, rowTotal: cells.reduce((sum, cell) => sum + cell.count, 0), cells };
  });

const NO_EVIDENCE = 'N/A — required evidence 없음';

export const retrievalText = (retrieval: EvalTrace['retrieval']) => {
  if (retrieval.nullReason === 'no-required-evidence') {
    return { recall: NO_EVIDENCE, reciprocalRank: NO_EVIDENCE, firstHitRank: NO_EVIDENCE };
  }
  return {
    recall: retrieval.recallAtK === null ? 'N/A' : retrieval.recallAtK.toFixed(2),
    reciprocalRank: retrieval.reciprocalRank === null ? 'N/A' : retrieval.reciprocalRank.toFixed(2),
    firstHitRank: retrieval.firstHitRank === null ? 'hit 없음' : String(retrieval.firstHitRank),
  };
};

export type VerificationKind = (typeof VERIFICATION_KINDS)[number];
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];
export type VerificationCounts = Record<VerificationKind, Record<VerificationStatus, number>>;

/** trace 안 verification run 을 kind × status 로 센다. 단위는 run 수다 (trace 수가 아니다). */
export const verificationCounts = (traces: EvalTrace[]): VerificationCounts => {
  const counts = Object.fromEntries(
    VERIFICATION_KINDS.map((kind) => [
      kind,
      Object.fromEntries(VERIFICATION_STATUSES.map((status) => [status, 0])),
    ]),
  ) as VerificationCounts;
  for (const trace of traces) {
    for (const run of trace.verification.runs) counts[run.kind][run.status] += 1;
  }
  return counts;
};
