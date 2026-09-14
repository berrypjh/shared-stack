import { describe, expect, it } from 'vitest';

import { loadDataset } from '../runner/dataset';
import {
  createReplayExecutor,
  createScriptedExecutor,
  outcomeKey,
  unavailableExecutor,
} from '../runner/executor';

import { emptyOutcome, traceFor } from './helpers';

const dev = await loadDataset('dev');
const task = dev[0];
const req = { runId: 'r', split: 'dev' as const, task, variant: 'consumer-docs', trial: 1 };

describe('executor boundary', () => {
  it('never fabricates a result when no live executor exists', async () => {
    await expect(unavailableExecutor.run(req)).rejects.toThrow(/no live executor is configured/);
  });

  it('fails loudly on an unregistered scripted combination', async () => {
    const executor = createScriptedExecutor({});
    await expect(executor.run(req)).rejects.toThrow(/no outcome for consumer-docs::/);
  });

  it('returns the registered scripted outcome', async () => {
    const outcome = { ...emptyOutcome(), selectedPlatform: 'web' as const };
    const executor = createScriptedExecutor({
      [outcomeKey('consumer-docs', task.taskId, 1)]: outcome,
    });
    await expect(executor.run(req)).resolves.toEqual(outcome);
  });

  it('replays recorded traces and carries the source executor name', async () => {
    const trace = traceFor(
      task,
      { selectedPlatform: 'web' },
      { executor: 'claude-code', model: 'unknown-model' },
    );
    const executor = createReplayExecutor([trace]);
    expect(executor.name).toBe('replay(claude-code)');
    expect(executor.model).toBe('unknown-model');
    await expect(executor.run(req)).resolves.toMatchObject({ selectedPlatform: 'web' });
  });
});
