import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { REPO_ROOT } from '../runner/paths';
import { runEval } from '../runner/pipeline';
import { VARIANTS } from '../variants/index';
import { EXCERPT_LIMIT } from '../verification/execute';

import { extractMetrics, toBaseline } from './baseline';
import { compareToBaseline, NO_BASELINE_MESSAGE, pairedAblation } from './compare';
import { buildConditions, compareConditions, hashCapabilities, hashDatasets } from './conditions';
import { SMOKE_TASK_IDS, smokeOutcome } from './smoke-fixture';

/** smoke는 모델 없이 도는 결정적 실행이다. */
const smokeExecutor = {
  name: 'smoke-scripted',
  model: null,
  run: async ({ task }: { task: Parameters<typeof smokeOutcome>[0] }) => smokeOutcome(task),
};

const runSmoke = (variantIds: string[]) =>
  runEval({
    split: 'dev',
    trials: 1,
    variantIds,
    taskIds: SMOKE_TASK_IDS,
    executor: smokeExecutor,
    gitSha: 'deadbeef',
    ref: 'refs/heads/test',
    runId: 'ci-test',
    createdAt: '2026-01-01T00:00:00.000Z',
  });

const summary = (await runSmoke(['progressive-with-verification'])).summary;

/** conditions는 항상 채워지지만, 없으면 조용히 넘어가지 않고 실패시킨다. */
const conditionsOf = (s: typeof summary) => {
  if (!s.conditions) throw new Error('run summary carried no conditions');
  return s.conditions;
};

describe('run conditions', () => {
  it('hashes the datasets so a data change breaks comparability', async () => {
    const first = await hashDatasets();
    const second = await hashDatasets();
    expect(first.hash).toBe(second.hash);
    expect(first.hash).toMatch(/^[0-9a-f]{16}$/);
    expect(first.taskCount).toBeGreaterThan(24);
  });

  it('hashes capabilities independently of ordering', () => {
    const a = hashCapabilities([{ id: 'x', allowedCapabilities: ['b', 'a'] }]);
    const b = hashCapabilities([{ id: 'x', allowedCapabilities: ['a', 'b'] }]);
    expect(a).toBe(b);
    expect(a).not.toBe(hashCapabilities([{ id: 'x', allowedCapabilities: ['a'] }]));
  });

  it('records every field needed to judge comparability', () => {
    const c = summary.conditions;
    expect(c).not.toBeNull();
    expect(c).toMatchObject({
      gitSha: 'deadbeef',
      ref: 'refs/heads/test',
      split: 'dev',
      trials: 1,
      executor: 'smoke-scripted',
      model: null,
      modelSettings: null,
    });
    expect(c?.catalogSchemaVersion).toBeGreaterThan(0);
    expect(c?.harnessVersion).toBeTruthy();
  });

  it('warns on each differing condition rather than comparing silently', async () => {
    const base = await buildConditions({
      gitSha: null,
      ref: null,
      split: 'dev',
      variants: [VARIANTS['progressive-retrieval']],
      trials: 1,
      executor: 'a',
      model: null,
    });
    const other = { ...base, executor: 'b', trials: 3 };
    const warnings = compareConditions(base, other);
    expect(warnings.map((w) => w.field).sort()).toEqual(['executor', 'trials']);
    expect(compareConditions(base, base)).toEqual([]);
  });
});

describe('baseline', () => {
  it('reports no baseline instead of inventing a regression', () => {
    const result = compareToBaseline(summary, conditionsOf(summary), null);
    expect(result).toEqual({
      status: 'no-baseline',
      message: NO_BASELINE_MESSAGE,
      deltas: [],
      warnings: [],
    });
  });

  it('round-trips through a file and compares clean against itself', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'eval-baseline-'));
    const file = path.join(dir, 'dev.json');
    const baseline = toBaseline(summary, conditionsOf(summary));
    await fs.writeFile(file, `${JSON.stringify(baseline, null, 2)}\n`, 'utf8');

    const loaded = JSON.parse(await fs.readFile(file, 'utf8'));
    const result = compareToBaseline(summary, conditionsOf(summary), loaded);
    expect(result.status).toBe('compared');
    if (result.status !== 'compared') return;
    expect(result.comparable).toBe(true);
    expect(result.deltas.every((d) => d.delta === 0 || d.delta === null)).toBe(true);
    expect(result.deltas.every((d) => d.gate === 'report-only')).toBe(true);

    await fs.rm(dir, { recursive: true, force: true });
  });

  it('keeps an unmeasured metric null instead of turning it into a zero delta', () => {
    const baseline = toBaseline(summary, conditionsOf(summary));
    const result = compareToBaseline(summary, conditionsOf(summary), baseline);
    if (result.status !== 'compared') throw new Error('expected a comparison');
    const unmeasured = result.deltas.filter((d) => d.current === null);
    expect(unmeasured.length).toBeGreaterThan(0);
    for (const d of unmeasured) expect(d.delta).toBeNull();
  });

  it('flags a comparison across different conditions as not comparable', () => {
    const baseline = toBaseline(summary, { ...conditionsOf(summary), executor: 'other-model' });
    const result = compareToBaseline(summary, conditionsOf(summary), baseline);
    if (result.status !== 'compared') throw new Error('expected a comparison');
    expect(result.comparable).toBe(false);
    expect(result.warnings.map((w) => w.field)).toContain('executor');
  });

  it('extracts only real metric values, preserving nulls', () => {
    const metrics = extractMetrics(summary);
    const variant = metrics['progressive-with-verification'];
    expect(variant.verifiedTaskSuccessRate).toBeCloseTo(0.5);
    expect(variant.contextTokens).toBeGreaterThan(0);
    expect(variant.repairSuccessRate).toBeNull();
  });
});

describe('paired ablation', () => {
  it('pairs neighbouring variants from the same run', async () => {
    const both = await runSmoke(['progressive-retrieval', 'progressive-with-verification']);
    const pairs = pairedAblation(both.summary);
    const step = pairs.filter(
      (p) => p.from === 'progressive-retrieval' && p.to === 'progressive-with-verification',
    );
    expect(step.length).toBeGreaterThan(0);
    const success = step.find((p) => p.metric === 'verifiedTaskSuccessRate');
    expect(success?.fromValue).not.toBeNull();
    expect(success?.toValue).not.toBeNull();
  }, 120_000);

  it('produces no pair when a variant is absent from the run', () => {
    expect(pairedAblation(summary).some((p) => p.from === 'current-discovery')).toBe(false);
  });
});

describe('artifact hygiene', () => {
  it('keeps runner absolute paths out of traces and summary', async () => {
    const result = await runSmoke(['progressive-with-verification']);
    const serialized = JSON.stringify({ traces: result.traces, summary: result.summary });
    expect(serialized).not.toContain(REPO_ROOT);
    expect(serialized).toContain('<repo>');
  }, 120_000);

  it('caps captured command output instead of storing it unbounded', async () => {
    const result = await runSmoke(['progressive-with-verification']);
    for (const trace of result.traces) {
      for (const run of trace.verification) {
        if (run.excerpt) expect(run.excerpt.length).toBeLessThanOrEqual(EXCERPT_LIMIT + 64);
      }
    }
  }, 120_000);
});

describe('deterministic smoke', () => {
  it('needs no model and exercises success and failure paths', () => {
    const variant = summary.variants[0];
    expect(summary.executor).toBe('smoke-scripted');
    expect(summary.model).toBeNull();
    expect(variant.primary.verifiedTaskSuccessRate.value).toBeCloseTo(0.5);
    expect(variant.failureBreakdown['hallucinated-api']).toBe(1);
    expect(variant.failureBreakdown['public-api-violation']).toBe(1);
  });

  it('routes every smoke task correctly, including the no-library one', () => {
    const matrix = summary.routingConfusion?.['progressive-with-verification'];
    expect(matrix?.accuracy).toBe(1);
    expect(matrix?.rows.none.none).toBe(1);
  });

  it('runs real commands rather than trusting the agent report', async () => {
    const result = await runSmoke(['progressive-with-verification']);
    const trace = result.traces.find((t) => t.taskId === 'web-button-loading');
    const typecheck = trace?.verification.find((v) => v.kind === 'typecheck');
    expect(typecheck?.status).toBe('passed');
    expect(typecheck?.command).toContain('tsc');
    expect(typecheck?.durationMs).toBeGreaterThan(0);
  }, 120_000);
});
