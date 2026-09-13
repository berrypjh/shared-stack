/**
 * eval import test 전용. consumer eval harness 를 scripted executor 로 실제로 돌려
 * summary·trace 를 만든다 — 숫자를 손으로 적지 않고 기존 grader·aggregate 가 계산하게 한다.
 */
import { loadDataset } from '../../../evals/consumer/runner/dataset';
import {
  createScriptedExecutor,
  type ExecutorOutcome,
  outcomeKey,
} from '../../../evals/consumer/runner/executor';
import { runEval } from '../../../evals/consumer/runner/pipeline';
import type { ConsumerEvalTask } from '../../../evals/consumer/runner/schema';
import { emptyOutcome, passingVerification } from '../../../evals/consumer/tests/helpers';
import { planVerifications } from '../../../evals/consumer/verification/policy';

import { SHA } from './fixtures';

/** task 별 완료 주장. false success 분모는 true·false 만 센다. */
export const CLAIMS: Record<string, boolean | 'unknown' | null> = {
  'web-button-loading': true,
  'web-button-polymorphic': true,
  'web-textfield-helper': 'unknown',
  'web-select-menuitem': null,
  'rn-use-theme-getcolor': false,
  'no-ui-date-format': true,
};

/** ANSI·홈 경로·credential 모양이 섞인 발췌. 공개 전에 정제돼야 한다. */
export const DIRTY_EXCERPT =
  '\u001b[32m✓\u001b[39m /Users/someone/work/App.test.tsx token sk-abcdefghijklmnopqrstuvwx';

const importLine = (pkg: string) => `import * as ui from '${pkg}';\nexport const used = ui;\n`;

const outcomeFor = (task: ConsumerEvalTask): ExecutorOutcome => {
  const base: ExecutorOutcome = {
    ...emptyOutcome(),
    selectedPlatform: task.expected.platform,
    selectedPackages: task.expected.packages,
    retrieved: task.expected.requiredEvidence,
    toolCalls: [
      { capability: task.expected.allowedCapabilities[0], target: null, duplicate: false },
    ],
    changedFiles: task.expected.packages.map((pkg, i) => ({
      path: `src/Generated${i}.tsx`,
      content: importLine(pkg),
    })),
    inputTokens: 1000,
    claimedSuccess: CLAIMS[task.taskId],
  };

  switch (task.taskId) {
    case 'web-button-loading':
      return {
        ...base,
        verification: passingVerification(task).map((run) =>
          run.kind === 'test' ? { ...run, excerpt: DIRTY_EXCERPT } : run,
        ),
      };
    case 'web-button-polymorphic': {
      // 검증 없이 성공을 주장한다. evidence 중복 2건과 tool call 중복 1건은 서로 다른 신호다.
      const [first, second] = task.expected.requiredEvidence;
      return {
        ...base,
        retrieved: [...task.expected.requiredEvidence, first, second],
        toolCalls: [
          { capability: 'read-api-catalog', target: 'react-ui', duplicate: false },
          { capability: 'read-api-catalog', target: 'react-ui', duplicate: true },
        ],
      };
    }
    case 'web-textfield-helper':
      return { ...base, selectedPlatform: null, selectedPackages: null };
    case 'rn-use-theme-getcolor':
      return {
        ...base,
        // policy 가 미지원으로 판정한 check 는 executePlan 과 같은 모양의 unsupported run 이 된다.
        verification: planVerifications(task, { workspaceDir: 'unused' }).map((plan) => ({
          kind: plan.kind,
          required: plan.required,
          status: plan.supported ? ('passed' as const) : ('unsupported' as const),
          command: plan.supported ? `stub:${plan.kind}` : null,
          exitCode: plan.supported ? 0 : null,
          durationMs: plan.supported ? 1 : null,
          attempt: plan.supported ? 1 : 0,
          failureFingerprint: null,
          excerpt: plan.unsupportedReason,
        })),
      };
    default:
      return { ...base, verification: passingVerification(task) };
  }
};

/** 관찰 전용 variant 로만 돈다 — D4·D5 는 harness 가 실제 명령을 실행한다. */
export const runFixture = async (executorName = 'scripted', variantIds = ['consumer-docs']) => {
  const tasks = (await loadDataset('dev')).filter((task) => task.taskId in CLAIMS);
  const outcomes = Object.fromEntries(
    variantIds.flatMap((variant) =>
      tasks.map((task) => [outcomeKey(variant, task.taskId, 1), outcomeFor(task)] as const),
    ),
  );
  return runEval({
    split: 'dev',
    trials: 1,
    variantIds,
    taskIds: Object.keys(CLAIMS),
    executor: createScriptedExecutor(outcomes, executorName),
    gitSha: SHA,
    runId: 'eval-fixture',
    createdAt: '2026-09-13T10:14:30.312Z',
  });
};
