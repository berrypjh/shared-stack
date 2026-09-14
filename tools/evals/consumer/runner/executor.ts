import type { RepairHook } from '../verification/repair';

import type {
  ChangedFile,
  ConsumerEvalTask,
  Platform,
  Split,
  ToolCall,
  Trace,
  VerificationRun,
} from './schema';

/**
 * Agent executor boundary.
 *
 * 이 repository에는 programmatic LLM executor가 없다. 새 provider SDK나 agent
 * framework를 추가하지 않고, 두 가지 결정적 구현만 제공한다.
 *
 * - scripted: harness 단위 테스트용 in-memory executor
 * - replay:   외부에서 수집한 trace를 다시 채점하는 경로
 *
 * live 결과가 없을 때 가짜 completion을 만들지 않는다. 요청이 오면 throw한다.
 */

export type ExecutorRequest = {
  runId: string;
  split: Split;
  task: ConsumerEvalTask;
  variant: string;
  trial: number;
};

/** trace 중 executor가 책임지는 부분. 나머지 식별 정보는 runner가 채운다. */
export type ExecutorOutcome = {
  selectedPlatform: Platform | null;
  selectedPackages: string[] | null;
  retrieved: string[];
  toolCalls: ToolCall[];
  changedFiles: ChangedFile[];
  inputTokens: number | null;
  outputTokens: number | null;
  retrievedTokens: number | null;
  retrievedFiles: number | null;
  retrievedChunks: number | null;
  latencyMs: number | null;
  claimedSuccess: boolean | 'unknown' | null;
  verification: VerificationRun[];
  repairAttempts: number;
  repairTokens: number | null;
  repairSucceeded: boolean | null;
  repeatedFailures: number | null;
};

export type EvalExecutor = {
  readonly name: string;
  readonly model: string | null;
  run(req: ExecutorRequest): Promise<ExecutorOutcome>;
  /**
   * D5 전용. 실패 근거를 받아 최소 수정을 돌려준다.
   * 없으면 harness는 repair를 시도하지 않고 관찰만 한다 (D4와 같아진다).
   */
  repair?: RepairHook;
};

export const outcomeKey = (variant: string, taskId: string, trial: number): string =>
  `${variant}::${taskId}::${trial}`;

export const outcomeFromTrace = (trace: Trace): ExecutorOutcome => ({
  selectedPlatform: trace.selectedPlatform,
  selectedPackages: trace.selectedPackages,
  retrieved: trace.retrieved,
  toolCalls: trace.toolCalls,
  changedFiles: trace.changedFiles,
  inputTokens: trace.inputTokens,
  outputTokens: trace.outputTokens,
  retrievedTokens: trace.retrievedTokens,
  retrievedFiles: trace.retrievedFiles,
  retrievedChunks: trace.retrievedChunks,
  latencyMs: trace.latencyMs,
  claimedSuccess: trace.claimedSuccess,
  verification: trace.verification,
  repairAttempts: trace.repairAttempts,
  repairTokens: trace.repairTokens,
  repairSucceeded: trace.repairSucceeded,
  repeatedFailures: trace.repeatedFailures,
});

/** 단위 테스트용. 등록되지 않은 조합은 조용히 채우지 않고 실패시킨다. */
export const createScriptedExecutor = (
  outcomes: Record<string, ExecutorOutcome>,
  name = 'scripted',
): EvalExecutor => ({
  name,
  model: null,
  run: async ({ variant, task, trial }) => {
    const key = outcomeKey(variant, task.taskId, trial);
    const outcome = outcomes[key];
    if (!outcome) throw new Error(`scripted executor has no outcome for ${key}`);
    return outcome;
  },
});

/** 외부에서 수집한 trace를 재생한다. 없는 조합은 실패시킨다. */
export const createReplayExecutor = (traces: Trace[]): EvalExecutor => {
  const byKey = new Map(traces.map((t) => [outcomeKey(t.variant, t.taskId, t.trial), t] as const));
  const executors = [...new Set(traces.map((t) => t.executor))];
  const models = [...new Set(traces.map((t) => t.model).filter((m): m is string => m !== null))];
  return {
    name: `replay(${executors.join(',') || 'unknown'})`,
    model: models.length === 1 ? models[0] : null,
    run: async ({ variant, task, trial }) => {
      const key = outcomeKey(variant, task.taskId, trial);
      const trace = byKey.get(key);
      if (!trace) throw new Error(`replay source has no trace for ${key}`);
      return outcomeFromTrace(trace);
    },
  };
};

/** live executor가 없을 때의 기본값. 절대 가짜 결과를 만들지 않는다. */
export const unavailableExecutor: EvalExecutor = {
  name: 'unavailable',
  model: null,
  run: async () => {
    throw new Error(
      'no live executor is configured. pass --replay=<traces.jsonl> to grade recorded trials, ' +
        'or --context-only to measure variant context without an executor.',
    );
  },
};
