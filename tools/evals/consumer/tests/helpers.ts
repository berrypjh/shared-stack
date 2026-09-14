import type { ExecutorOutcome } from '../runner/executor';
import type { ConsumerEvalTask, Trace } from '../runner/schema';
import { HARNESS_VERSION } from '../runner/version';

/** 테스트 fixture lookup — 없으면 조용히 넘어가지 않고 실패시킨다. */
export const requireTask = (tasks: ConsumerEvalTask[], taskId: string): ConsumerEvalTask => {
  const task = tasks.find((t) => t.taskId === taskId);
  if (!task) throw new Error(`dataset is missing fixture task "${taskId}"`);
  return task;
};

export const emptyOutcome = (): ExecutorOutcome => ({
  selectedPlatform: null,
  selectedPackages: null,
  retrieved: [],
  toolCalls: [],
  changedFiles: [],
  inputTokens: null,
  outputTokens: null,
  retrievedTokens: null,
  retrievedFiles: null,
  retrievedChunks: null,
  latencyMs: null,
  claimedSuccess: null,
  verification: [],
  repairAttempts: 0,
  repairTokens: null,
  repairSucceeded: null,
  repeatedFailures: null,
});

export const traceFor = (
  task: ConsumerEvalTask,
  outcome: Partial<ExecutorOutcome> = {},
  overrides: Partial<Trace> = {},
): Trace => ({
  runId: 'run-fixed',
  taskId: task.taskId,
  variant: 'consumer-docs',
  trial: 1,
  split: 'dev',
  gitSha: 'deadbeef',
  executor: 'scripted',
  model: null,
  harnessVersion: HARNESS_VERSION,
  expectedPlatform: task.expected.platform,
  expectedPackages: task.expected.packages,
  ...emptyOutcome(),
  ...outcome,
  ...overrides,
});

export const passingVerification = (task: ConsumerEvalTask) =>
  task.verification.map((v) => ({
    kind: v.kind,
    required: v.required,
    status: 'passed' as const,
    command: `stub:${v.kind}`,
    exitCode: 0,
    durationMs: 1,
    attempt: 1,
    failureFingerprint: null,
    excerpt: null,
  }));
