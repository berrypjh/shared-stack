import type { ComparisonResult } from '../ci/compare';
import type { RunConditions } from '../ci/conditions';
import { FAILURE_CATEGORIES, type FailureCategory } from '../graders';
import type { ConsumerEvalTask, Platform } from '../runner/schema';
import type { GradedTrace } from '../runner/trace';
import type { VariantContext } from '../variants/context';
import type { Variant } from '../variants/index';

import { buildConfusion, type ConfusionMatrix } from './confusion';

/**
 * 분모가 0이거나 데이터가 없으면 `value: null`. 0으로 대체하지 않는다.
 * report에서 `N/A`로 렌더링된다.
 */
type FailureFreePlatform = Platform;

export type Rate = { value: number | null; numerator: number; denominator: number };
export type Agg = { value: number | null; n: number };

const rate = (numerator: number, denominator: number): Rate => ({
  value: denominator === 0 ? null : numerator / denominator,
  numerator,
  denominator,
});

const mean = (xs: (number | null | undefined)[]): Agg => {
  const vs = xs.filter((x): x is number => typeof x === 'number');
  return {
    value: vs.length === 0 ? null : vs.reduce((a, b) => a + b, 0) / vs.length,
    n: vs.length,
  };
};

const median = (xs: (number | null | undefined)[]): Agg => {
  const vs = xs.filter((x): x is number => typeof x === 'number').sort((a, b) => a - b);
  if (vs.length === 0) return { value: null, n: 0 };
  const mid = Math.floor(vs.length / 2);
  return {
    value: vs.length % 2 === 1 ? vs[mid] : (vs[mid - 1] + vs[mid]) / 2,
    n: vs.length,
  };
};

export type VariantMetrics = {
  variant: string;
  label: string;
  tasks: number;
  trials: number;
  context: VariantContext;
  primary: {
    verifiedTaskSuccessRate: Rate;
    routingAccuracy: Rate;
    requiredEvidenceRecallAtK: Agg;
    medianInputTokens: Agg;
    falseSuccessRate: Rate;
  };
  secondary: {
    wrongPackageRate: Rate;
    mrr: Agg;
    unnecessaryToolCallRate: Rate;
    toolCallsPerSuccessfulTask: Agg;
    tokensPerSuccessfulTask: Agg;
    noToolCorrectness: Rate;
    verificationInvocationRate: Agg;
    verificationPassRate: Rate;
    medianRepairAttempts: Agg;
    /** repair를 시도한 시행 중 최종 통과 비율. 시도가 없으면 N/A. */
    repairSuccessRate: Rate;
    /** 같은 지문의 실패가 반복된 시행 비율. */
    repeatedFailureRate: Rate;
    /** required check가 이 repository/harness에서 실행 불가였던 시행 비율. */
    verificationUnsupportedRate: Rate;
  };
  diagnostic: {
    medianRetrievedTokens: Agg;
    medianRetrievedFiles: Agg;
    medianDuplicateRetrievals: Agg;
    medianLatencyMs: Agg;
    medianRepairTokens: Agg;
    /** 실행된 verification의 총 소요시간 중앙값. */
    medianVerificationMs: Agg;
  };
  failureBreakdown: Record<FailureCategory, number>;
  /** 값이 null인 metric 목록 — 측정 불가와 0을 구분하기 위한 명시 표기. */
  unsupported: string[];
};

const emptyBreakdown = (): Record<FailureCategory, number> =>
  Object.fromEntries(FAILURE_CATEGORIES.map((c) => [c, 0])) as Record<FailureCategory, number>;

const countUnsupported = (m: Omit<VariantMetrics, 'unsupported'>): string[] => {
  const out: string[] = [];
  for (const group of ['primary', 'secondary', 'diagnostic'] as const) {
    for (const [key, value] of Object.entries(m[group])) {
      if ((value as Rate | Agg).value === null) out.push(`${group}.${key}`);
    }
  }
  return out;
};

export const aggregateVariant = (
  variant: Variant,
  context: VariantContext,
  tasks: ConsumerEvalTask[],
  traces: GradedTrace[],
): VariantMetrics => {
  const taskById = new Map(tasks.map((t) => [t.taskId, t]));
  const succeeded = traces.filter((t) => t.grade.success.taskSucceeded);
  const routable = traces.filter(
    (t) => t.grade.routing.platformCorrect !== null && t.grade.routing.packageCorrect !== null,
  );
  // false success 분모: true/false를 명시적으로 주장한 시행만. 'unknown'과 미보고는 제외.
  const claimed = traces.filter((t) => t.grade.success.claimCounted);
  const packageJudged = traces.filter((t) => t.grade.routing.packageCorrect !== null);
  const verificationJudged = traces.filter((t) => t.grade.verification.passed !== null);
  const noToolTrials = traces.filter((t) => t.toolCalls.length === 0);
  const repaired = traces.filter((t) => t.repairAttempts > 0);
  const verificationTimed = traces.map((t) => {
    const durations = t.verification
      .map((v) => v.durationMs)
      .filter((d): d is number => typeof d === 'number');
    return durations.length === 0 ? null : durations.reduce((a, b) => a + b, 0);
  });

  let totalToolCalls = 0;
  let unnecessaryToolCalls = 0;
  for (const t of traces) {
    const allowed = taskById.get(t.taskId)?.expected.allowedCapabilities ?? [];
    for (const call of t.toolCalls) {
      totalToolCalls += 1;
      if (call.duplicate || (allowed.length > 0 && !allowed.includes(call.capability))) {
        unnecessaryToolCalls += 1;
      }
    }
  }

  const failureBreakdown = emptyBreakdown();
  for (const t of traces) {
    const c = t.grade.success.failureCategory;
    if (c) failureBreakdown[c] += 1;
  }

  const base = {
    variant: variant.id,
    label: variant.label,
    tasks: new Set(traces.map((t) => t.taskId)).size,
    trials: traces.length,
    context,
    primary: {
      verifiedTaskSuccessRate: rate(succeeded.length, traces.length),
      routingAccuracy: rate(
        routable.filter(
          (t) =>
            t.grade.routing.platformCorrect === true && t.grade.routing.packageCorrect === true,
        ).length,
        routable.length,
      ),
      requiredEvidenceRecallAtK: mean(traces.map((t) => t.grade.retrieval.recallAtK)),
      medianInputTokens: median(traces.map((t) => t.inputTokens)),
      falseSuccessRate: rate(
        claimed.filter((t) => t.grade.success.falseSuccess).length,
        claimed.length,
      ),
    },
    secondary: {
      wrongPackageRate: rate(
        packageJudged.filter((t) => t.grade.routing.packageCorrect === false).length,
        packageJudged.length,
      ),
      mrr: mean(traces.map((t) => t.grade.retrieval.reciprocalRank)),
      unnecessaryToolCallRate: rate(unnecessaryToolCalls, totalToolCalls),
      toolCallsPerSuccessfulTask: mean(succeeded.map((t) => t.toolCalls.length)),
      tokensPerSuccessfulTask: mean(succeeded.map((t) => t.inputTokens)),
      noToolCorrectness: rate(
        noToolTrials.filter((t) => t.grade.success.taskSucceeded).length,
        noToolTrials.length,
      ),
      verificationInvocationRate: mean(traces.map((t) => t.grade.verification.invocationRate)),
      verificationPassRate: rate(
        verificationJudged.filter((t) => t.grade.verification.passed === true).length,
        verificationJudged.length,
      ),
      medianRepairAttempts: median(traces.map((t) => t.repairAttempts)),
      repairSuccessRate: rate(
        repaired.filter((t) => t.repairSucceeded === true).length,
        repaired.length,
      ),
      repeatedFailureRate: rate(
        traces.filter((t) => (t.repeatedFailures ?? 0) > 0).length,
        traces.length,
      ),
      verificationUnsupportedRate: rate(
        traces.filter((t) => t.grade.verification.unsupportedRequired.length > 0).length,
        traces.length,
      ),
    },
    diagnostic: {
      medianRetrievedTokens: median(traces.map((t) => t.retrievedTokens)),
      medianRetrievedFiles: median(traces.map((t) => t.retrievedFiles)),
      medianDuplicateRetrievals: median(traces.map((t) => t.grade.retrieval.duplicateRetrievals)),
      medianLatencyMs: median(traces.map((t) => t.latencyMs)),
      medianRepairTokens: median(traces.map((t) => t.repairTokens)),
      medianVerificationMs: median(verificationTimed),
    },
    failureBreakdown,
  };

  return { ...base, unsupported: countUnsupported(base) };
};

/** variant별 routing confusion raw data. selection이 없으면 `unreported`로 센다. */
export const confusionByVariant = (
  traces: {
    variant: string;
    expectedPlatform: FailureFreePlatform;
    selectedPlatform: FailureFreePlatform | null;
  }[],
): Record<string, ConfusionMatrix> => {
  const byVariant: Record<
    string,
    { expected: FailureFreePlatform; predicted: FailureFreePlatform | null }[]
  > = {};
  for (const t of traces) {
    (byVariant[t.variant] ??= []).push({
      expected: t.expectedPlatform,
      predicted: t.selectedPlatform,
    });
  }
  return Object.fromEntries(
    Object.entries(byVariant).map(([variant, pairs]) => [variant, buildConfusion(pairs)]),
  );
};

export type RunSummary = {
  runId: string;
  createdAt: string;
  split: string;
  gitSha: string | null;
  executor: string;
  model: string | null;
  harnessVersion: string;
  taskCount: number;
  trialCount: number;
  k: number;
  variants: VariantMetrics[];
  routingConfusion: Record<string, ConfusionMatrix> | null;
  /** 비교 가능성 판단용 조건. 수집하지 않았으면 null. */
  conditions: RunConditions | null;
  /** baseline 대비 비교. 요청하지 않았으면 null. */
  comparison: ComparisonResult | null;
};
