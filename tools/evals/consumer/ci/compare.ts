import type { RunSummary } from '../reporters/aggregate';

import type { Baseline } from './baseline';
import { extractMetrics } from './baseline';
import { compareConditions, type ConditionWarning, type RunConditions } from './conditions';

/**
 * baseline 대비 변화 보고.
 *
 * **stochastic metric에 임의 임계값을 두지 않는다.** baseline과 반복 시행 분산을
 * 확보하기 전까지는 전부 report-only다. gate는 결정적 불변식만 담당한다
 * (schema/catalog/unit test/typecheck/smoke — CI job이 별도로 강제한다).
 */

export type MetricDelta = {
  variant: string;
  metric: string;
  baseline: number | null;
  current: number | null;
  /** 둘 중 하나라도 null이면 delta도 null — 0으로 만들지 않는다. */
  delta: number | null;
  gate: 'report-only';
};

export type ComparisonResult =
  | { status: 'no-baseline'; message: string; deltas: []; warnings: [] }
  | {
      status: 'compared';
      comparable: boolean;
      warnings: ConditionWarning[];
      deltas: MetricDelta[];
    };

export const NO_BASELINE_MESSAGE = 'No baseline available — reporting current run only';

export const compareToBaseline = (
  summary: RunSummary,
  conditions: RunConditions,
  baseline: Baseline | null,
): ComparisonResult => {
  if (!baseline) {
    return { status: 'no-baseline', message: NO_BASELINE_MESSAGE, deltas: [], warnings: [] };
  }

  const warnings = compareConditions(baseline.conditions, conditions);
  const current = extractMetrics(summary);
  const deltas: MetricDelta[] = [];

  for (const [variant, metrics] of Object.entries(current)) {
    const before = baseline.metrics[variant];
    for (const [metric, value] of Object.entries(metrics)) {
      const previous = before?.[metric] ?? null;
      deltas.push({
        variant,
        metric,
        baseline: previous,
        current: value,
        delta: previous === null || value === null ? null : value - previous,
        gate: 'report-only',
      });
    }
  }

  return { status: 'compared', comparable: warnings.length === 0, warnings, deltas };
};

/** variant 쌍 사이의 ablation 비교 — 같은 run 안에서 짝을 짓는다. */
export const ABLATION_PAIRS: [string, string][] = [
  ['current-discovery', 'current-with-catalog'],
  ['current-with-catalog', 'catalog-with-routing'],
  ['catalog-with-routing', 'progressive-retrieval'],
  ['progressive-retrieval', 'progressive-with-verification'],
  ['progressive-with-verification', 'progressive-with-repair'],
];

export type PairedDelta = {
  from: string;
  to: string;
  metric: string;
  fromValue: number | null;
  toValue: number | null;
  delta: number | null;
};

/** 같은 dataset·같은 trial에서 나온 두 variant를 짝지어 비교한다. */
export const pairedAblation = (summary: RunSummary): PairedDelta[] => {
  const byVariant = extractMetrics(summary);
  const out: PairedDelta[] = [];
  for (const [from, to] of ABLATION_PAIRS) {
    const a = byVariant[from];
    const b = byVariant[to];
    if (!a || !b) continue;
    for (const metric of Object.keys(a)) {
      const fromValue = a[metric] ?? null;
      const toValue = b[metric] ?? null;
      out.push({
        from,
        to,
        metric,
        fromValue,
        toValue,
        delta: fromValue === null || toValue === null ? null : toValue - fromValue,
      });
    }
  }
  return out;
};
