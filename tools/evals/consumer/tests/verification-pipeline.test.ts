import { describe, expect, it } from 'vitest';

import { loadDataset } from '../runner/dataset';
import {
  createScriptedExecutor,
  type EvalExecutor,
  type ExecutorOutcome,
  outcomeKey,
} from '../runner/executor';
import { runEval } from '../runner/pipeline';
import type { ChangedFile } from '../runner/schema';

import { emptyOutcome, requireTask } from './helpers';

/**
 * D3 → D4 → D5를 같은 scripted agent로 돌린다.
 * agent는 존재하지 않는 export를 쓰고 성공했다고 주장한다.
 *
 * D3: 주장만 있고 아무도 확인하지 않는다.
 * D4: harness가 실제로 typecheck를 돌려 거짓 주장을 드러낸다.
 * D5: 실패 근거만 보고 최소 수정 후 가장 작은 check를 다시 돌린다.
 */

const dev = await loadDataset('dev');
const task = requireTask(dev, 'web-button-polymorphic');

const BROKEN: ChangedFile = {
  path: 'src/App.tsx',
  content: `import { DataGrid } from '@berrypjh/react-ui';

export const App = () => <DataGrid />;
`,
};

const FIXED: ChangedFile = {
  path: 'src/App.tsx',
  content: `import { Button } from '@berrypjh/react-ui';

export const App = () => (
  <Button component="a" href="https://example.com">
    이동
  </Button>
);
`,
};

/** agent는 성공했다고 주장하고, 스스로는 아무 검증도 돌리지 않았다. */
const claimedOutcome = (): ExecutorOutcome => ({
  ...emptyOutcome(),
  selectedPlatform: 'web',
  selectedPackages: ['@berrypjh/react-ui'],
  retrieved: task.expected.requiredEvidence,
  changedFiles: [BROKEN],
  claimedSuccess: true,
  verification: [],
  inputTokens: 900,
});

const executorFor = (variant: string, repair?: EvalExecutor['repair']): EvalExecutor => {
  const base = createScriptedExecutor({
    [outcomeKey(variant, task.taskId, 1)]: claimedOutcome(),
  });
  return { ...base, repair };
};

const options = {
  split: 'dev' as const,
  trials: 1,
  gitSha: null,
  runId: 'verification-pipeline-test',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const runOne = async (variant: string, repair?: EvalExecutor['repair']) => {
  const result = await runEval({
    ...options,
    variantIds: [variant],
    taskIds: [task.taskId],
    executor: executorFor(variant, repair),
  });
  const trace = result.traces.find((t) => t.taskId === task.taskId);
  if (!trace) throw new Error(`no trace produced for ${task.taskId}`);
  return trace;
};

describe('D3 — no verification', () => {
  it('takes the agent claim at face value and reports the omission', async () => {
    const trace = await runOne('progressive-retrieval');
    expect(trace.verification).toEqual([]);
    expect(trace.claimedSuccess).toBe(true);
    expect(trace.grade.success.taskSucceeded).toBe(false);
    expect(trace.grade.success.falseSuccess).toBe(true);
    expect(trace.grade.success.failureCategory).toBe('verification-omitted');
  }, 60_000);
});

describe('D4 — verification observation', () => {
  it('runs the required checks and exposes the hidden failure', async () => {
    const trace = await runOne('progressive-with-verification');

    const typecheck = trace.verification.find((v) => v.kind === 'typecheck');
    expect(typecheck?.status).toBe('failed');
    expect(typecheck?.exitCode).not.toBe(0);
    expect(typecheck?.command).toContain('tsc');
    expect(typecheck?.failureFingerprint).toContain('TS2305');
    expect(typecheck?.durationMs).toBeGreaterThan(0);

    expect(trace.grade.success.falseSuccess).toBe(true);
    expect(trace.grade.success.failureCategory).toBe('hallucinated-api');
    expect(trace.repairAttempts).toBe(0);
    expect(trace.repairSucceeded).toBeNull();
  }, 120_000);

  it('does not run broader checks once the smallest required one failed', async () => {
    const trace = await runOne('progressive-with-verification');
    const later = trace.verification.filter(
      (v) => v.kind !== 'public-import' && v.kind !== 'typecheck',
    );
    for (const run of later) expect(run.status).toBe('not-run');
  }, 120_000);
});

describe('D5 — bounded minimal repair', () => {
  it('repairs from the failure evidence and re-runs the smallest check', async () => {
    let seenFingerprint: string | null = null;
    const trace = await runOne('progressive-with-repair', async ({ failure }) => {
      seenFingerprint = failure.failureFingerprint;
      return { changedFiles: [FIXED], inputTokens: 250, toolCalls: [] };
    });

    expect(seenFingerprint).toContain('TS2305');
    expect(trace.repairAttempts).toBe(1);
    expect(trace.repairSucceeded).toBe(true);
    expect(trace.repairTokens).toBe(250);
    expect(trace.repeatedFailures).toBe(0);
    // 두 번의 시도가 모두 trace에 남고, 채점은 마지막 시도를 본다.
    const typechecks = trace.verification.filter((v) => v.kind === 'typecheck');
    expect(typechecks.map((v) => v.status)).toEqual(['failed', 'passed']);
    expect(typechecks.map((v) => v.attempt)).toEqual([1, 2]);
    expect(trace.grade.verification.passed).toBe(true);
    expect(trace.grade.success.taskSucceeded).toBe(true);
    expect(trace.grade.success.falseSuccess).toBe(false);
  }, 120_000);

  it('stops instead of looping when the repair does not change the failure', async () => {
    const trace = await runOne('progressive-with-repair', async () => ({
      changedFiles: [BROKEN],
      inputTokens: 100,
      toolCalls: [],
    }));

    expect(trace.repairAttempts).toBe(1);
    expect(trace.repeatedFailures).toBe(1);
    expect(trace.repairSucceeded).toBe(false);
    expect(trace.grade.success.failureCategory).toBe('repeated-failure');
  }, 120_000);

  it('records a declined repair without inventing an edit', async () => {
    const trace = await runOne('progressive-with-repair', async () => null);
    expect(trace.repairAttempts).toBe(0);
    expect(trace.repairSucceeded).toBeNull();
    expect(trace.grade.success.taskSucceeded).toBe(false);
  }, 120_000);
});
