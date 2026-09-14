import { resolvePlatform } from '../../../consumer-retrieval/platform';
import type {
  Confidence,
  PlatformClass,
  PlatformDiagnosis,
  PlatformEvidence,
} from '../../../consumer-retrieval/types';
import { buildConfusion, type ConfusionMatrix } from '../reporters/confusion';
import { measureVariantContext, type VariantContext } from '../variants/context';
import { resolveVariants } from '../variants/index';

import { loadDataset } from './dataset';
import { type FixtureContext, loadFixtureContext, toPlatformInput } from './fixture-context';
import type { ConsumerEvalTask, Split } from './schema';

/**
 * executor 없이 도는 두 측정의 데이터 함수. `--context-only`·`--routing-only` 콘솔 출력과
 * JSON writer 가 같은 결과를 쓴다 — 판정·측정 로직은 여기서 새로 만들지 않는다.
 */

export type RoutingDecision = {
  taskId: string;
  fixture: string;
  /** 비교용 gold. resolver 는 이 값을 보지 않는다. */
  expected: PlatformClass;
  /** resolver 의 canonical 결과. `ambiguous` 면 null — confusion 의 `unreported` 칸이다. */
  predicted: PlatformClass | null;
  diagnosis: PlatformDiagnosis;
  confidence: Confidence;
  evidence: PlatformEvidence[];
};

export type RoutingReport = {
  split: Split;
  resolver: 'deterministic';
  matrix: ConfusionMatrix;
  decisions: RoutingDecision[];
};

/** fixture 에서 관측 가능한 근거와 prompt 만으로 판정한다. context 가 없는 task 는 추측하지 않는다. */
export const decideRouting = (
  tasks: ConsumerEvalTask[],
  contexts: Record<string, FixtureContext>,
): RoutingDecision[] =>
  tasks.map((task) => {
    const context = contexts[task.fixture];
    if (!context) throw new Error(`no fixture context for "${task.fixture}" (task ${task.taskId})`);
    const decision = resolvePlatform(toPlatformInput(task.prompt, context));
    return {
      taskId: task.taskId,
      fixture: task.fixture,
      expected: task.expected.platform,
      predicted: decision.canonical,
      diagnosis: decision.platform,
      confidence: decision.confidence,
      evidence: decision.evidence,
    };
  });

export const resolveRouting = async (split: Split): Promise<RoutingReport> => {
  const tasks = await loadDataset(split);
  const contexts: Record<string, FixtureContext> = {};
  for (const fixture of new Set(tasks.map((task) => task.fixture))) {
    contexts[fixture] = await loadFixtureContext(fixture);
  }
  const decisions = decideRouting(tasks, contexts);
  return {
    split,
    resolver: 'deterministic',
    matrix: buildConfusion(decisions.map(({ expected, predicted }) => ({ expected, predicted }))),
    decisions,
  };
};

/** variant 순서대로 초기·routed 컨텍스트를 실측한다. */
export const measureContexts = async (variantIds: string[]): Promise<VariantContext[]> => {
  const contexts: VariantContext[] = [];
  for (const variant of resolveVariants(variantIds))
    contexts.push(await measureVariantContext(variant));
  return contexts;
};
