import fs from 'node:fs/promises';
import path from 'node:path';

import type { RunSummary } from '../reporters/aggregate';
import { fromRepoRoot } from '../runner/paths';

import type { RunConditions } from './conditions';

/**
 * Baseline snapshot.
 *
 * 실제 run에서만 만들어진다. 손으로 metric을 적어 넣지 않는다.
 * 파일이 없으면 회귀를 지어내지 않고 "baseline 없음"으로 보고한다.
 */

export const BASELINE_DIR = fromRepoRoot('tools/evals/consumer/baseline');

export const baselineFile = (split: string): string => path.join(BASELINE_DIR, `${split}.json`);

export type Baseline = {
  /** baseline을 만든 run의 조건. 비교 가능성 판단에 쓴다. */
  conditions: RunConditions;
  createdAt: string;
  /** variant → metric 이름 → 값. 측정되지 않은 값은 null 그대로 보존한다. */
  metrics: Record<string, Record<string, number | null>>;
};

/** 비교에 쓰는 metric만 평평하게 뽑는다. */
export const extractMetrics = (summary: RunSummary): Baseline['metrics'] =>
  Object.fromEntries(
    summary.variants.map((v) => [
      v.variant,
      {
        verifiedTaskSuccessRate: v.primary.verifiedTaskSuccessRate.value,
        routingAccuracy: v.primary.routingAccuracy.value,
        requiredEvidenceRecallAtK: v.primary.requiredEvidenceRecallAtK.value,
        medianInputTokens: v.primary.medianInputTokens.value,
        falseSuccessRate: v.primary.falseSuccessRate.value,
        wrongPackageRate: v.secondary.wrongPackageRate.value,
        verificationInvocationRate: v.secondary.verificationInvocationRate.value,
        verificationPassRate: v.secondary.verificationPassRate.value,
        repairSuccessRate: v.secondary.repairSuccessRate.value,
        repeatedFailureRate: v.secondary.repeatedFailureRate.value,
        contextTokens: v.context.tokens,
      },
    ]),
  );

export const toBaseline = (summary: RunSummary, conditions: RunConditions): Baseline => ({
  conditions,
  createdAt: summary.createdAt,
  metrics: extractMetrics(summary),
});

/** 없으면 null. 이것이 "baseline 없음"의 유일한 표현이다. */
export const readBaseline = async (split: string): Promise<Baseline | null> => {
  try {
    return JSON.parse(await fs.readFile(baselineFile(split), 'utf8')) as Baseline;
  } catch {
    return null;
  }
};

export const writeBaseline = async (split: string, baseline: Baseline): Promise<string> => {
  await fs.mkdir(BASELINE_DIR, { recursive: true });
  const file = baselineFile(split);
  await fs.writeFile(file, `${JSON.stringify(baseline, null, 2)}\n`, 'utf8');
  return file;
};
