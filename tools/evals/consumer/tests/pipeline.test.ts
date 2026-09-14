import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { loadDataset } from '../runner/dataset';
import { createScriptedExecutor, type ExecutorOutcome, outcomeKey } from '../runner/executor';
import { runEval, writeRunArtifacts } from '../runner/pipeline';
import type { ConsumerEvalTask } from '../runner/schema';
import { readTraces } from '../runner/trace';
import { VARIANT_IDS, VARIANTS } from '../variants/index';

import { emptyOutcome, passingVerification } from './helpers';

const dev = await loadDataset('dev');

const importLine = (pkg: string) => `import * as ui from '${pkg}';\nexport const used = ui;\n`;

/** gold를 그대로 따르는 이상적 시행. harness 배선만 검증한다 — 모델 품질과 무관. */
const idealOutcome = (task: ConsumerEvalTask): ExecutorOutcome => ({
  ...emptyOutcome(),
  selectedPlatform: task.expected.platform,
  selectedPackages: task.expected.packages,
  retrieved: task.expected.requiredEvidence,
  toolCalls: task.expected.allowedCapabilities.slice(0, 1).map((capability) => ({
    capability,
    target: null,
    duplicate: false,
  })),
  changedFiles: task.expected.packages.map((pkg, i) => ({
    path: `src/Generated${i}.tsx`,
    content: importLine(pkg),
  })),
  verification: passingVerification(task),
  claimedSuccess: true,
  inputTokens: 1000 + task.taskId.length,
});

const scriptedFor = (build: (task: ConsumerEvalTask) => ExecutorOutcome, trials = 1) =>
  createScriptedExecutor(
    Object.fromEntries(
      OBSERVING_VARIANTS.flatMap((variant) =>
        dev.flatMap((task) =>
          Array.from(
            { length: trials },
            (_, i) => [outcomeKey(variant, task.taskId, i + 1), build(task)] as const,
          ),
        ),
      ),
    ),
  );

/**
 * D4/D5는 harness가 실제 명령을 돌려 executor가 보고한 verification을 덮어쓴다.
 * 이 테스트는 배선을 보는 것이므로 관찰 전용(비검증) variant만 대상으로 한다.
 * 실제 검증 동작은 `verification-pipeline.test.ts`가 다룬다.
 */
const OBSERVING_VARIANTS = VARIANT_IDS.filter(
  (id) => !VARIANTS[id].allowedCapabilities.includes('run-verification'),
);

const baseOptions = {
  split: 'dev' as const,
  trials: 1,
  variantIds: [...OBSERVING_VARIANTS],
  gitSha: 'deadbeef',
  runId: 'run-fixed',
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('pipeline', () => {
  it('grades every task against every registered variant', async () => {
    const result = await runEval({ ...baseOptions, executor: scriptedFor(idealOutcome) });

    expect(result.summary.variants.map((v) => v.variant)).toEqual([...OBSERVING_VARIANTS]);
    expect(result.traces).toHaveLength(dev.length * OBSERVING_VARIANTS.length);
    for (const v of result.summary.variants) {
      expect(v.primary.verifiedTaskSuccessRate.value).toBe(1);
      expect(v.primary.falseSuccessRate.value).toBe(0);
      expect(v.primary.routingAccuracy.value).toBe(1);
    }
  });

  it('runs multiple trials per task', async () => {
    const result = await runEval({
      ...baseOptions,
      trials: 2,
      variantIds: ['consumer-docs'],
      executor: scriptedFor(idealOutcome, 2),
    });

    expect(result.traces).toHaveLength(dev.length * 2);
    expect(new Set(result.traces.map((t) => t.trial))).toEqual(new Set([1, 2]));
    expect(result.summary.variants[0].tasks).toBe(dev.length);
    expect(result.summary.variants[0].trials).toBe(dev.length * 2);
  });

  it('separates false success from verified success', async () => {
    const result = await runEval({
      ...baseOptions,
      executor: scriptedFor((task) => ({
        ...idealOutcome(task),
        verification: [],
        claimedSuccess: true,
      })),
    });

    const primary = result.summary.variants[0].primary;
    expect(primary.verifiedTaskSuccessRate.value).toBe(0);
    expect(primary.falseSuccessRate.value).toBe(1);
    expect(result.summary.variants[0].failureBreakdown['verification-omitted']).toBe(dev.length);
  });

  it('writes traces.jsonl / summary.json / report.md that read back', async () => {
    const outDir = await fs.mkdtemp(path.join(os.tmpdir(), 'consumer-eval-'));
    const result = await runEval({ ...baseOptions, executor: scriptedFor(idealOutcome) });
    await writeRunArtifacts(outDir, result);

    const traces = await readTraces(path.join(outDir, 'traces.jsonl'));
    expect(traces).toHaveLength(result.traces.length);
    expect(traces[0].runId).toBe('run-fixed');

    const summary = JSON.parse(await fs.readFile(path.join(outDir, 'summary.json'), 'utf8'));
    expect(summary.split).toBe('dev');
    expect(summary.gitSha).toBe('deadbeef');

    const report = await fs.readFile(path.join(outDir, 'report.md'), 'utf8');
    expect(report).toContain('# Consumer Eval Report');

    await writeRunArtifacts(outDir, result);
    expect(await fs.readFile(path.join(outDir, 'report.md'), 'utf8')).toBe(report);

    await fs.rm(outDir, { recursive: true, force: true });
  });
});
