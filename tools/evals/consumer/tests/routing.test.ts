import { describe, expect, it } from 'vitest';

import { resolvePlatform } from '../../../consumer-retrieval/platform';
import { buildConfusion } from '../reporters/confusion';
import { loadDataset } from '../runner/dataset';
import {
  type FixtureContext,
  loadFixtureContext,
  toPlatformInput,
} from '../runner/fixture-context';

/**
 * Deterministic platform routing을 dataset 전체에 돌린다.
 * resolver는 fixture에서 관측 가능한 것(dependencies, project tree)과 prompt만 본다 —
 * task의 gold platform은 보지 않는다.
 */

const contexts = new Map<string, FixtureContext>();
const contextFor = async (fixture: string): Promise<FixtureContext> => {
  const cached = contexts.get(fixture);
  if (cached) return cached;
  const loaded = await loadFixtureContext(fixture);
  contexts.set(fixture, loaded);
  return loaded;
};

const routeSplit = async (split: 'dev' | 'test') => {
  const tasks = await loadDataset(split);
  return Promise.all(
    tasks.map(async (task) => ({
      task,
      decision: resolvePlatform(toPlatformInput(task.prompt, await contextFor(task.fixture))),
    })),
  );
};

const dev = await routeSplit('dev');
const held = await routeSplit('test');
const all = [...dev, ...held];

describe.each([
  ['dev', dev],
  ['test', held],
] as const)('%s split routing', (_split, routed) => {
  const matrix = buildConfusion(
    routed.map(({ task, decision }) => ({
      expected: task.expected.platform,
      predicted: decision.canonical,
    })),
  );

  it('never routes a web task to react-native or the reverse', () => {
    expect(matrix.rows.web['react-native']).toBe(0);
    expect(matrix.rows['react-native'].web).toBe(0);
  });

  it('never routes a UI task to none, nor a none task to a UI platform', () => {
    expect(matrix.rows.web.none + matrix.rows['react-native'].none).toBe(0);
    expect(matrix.rows.none.web + matrix.rows.none['react-native']).toBe(0);
  });

  it('reaches at least 90% routing accuracy', () => {
    expect(matrix.accuracy).not.toBeNull();
    expect(matrix.accuracy ?? 0).toBeGreaterThanOrEqual(0.9);
  });
});

describe('routing behaviour', () => {
  it('routes a cross-platform task to both', () => {
    const cross = all.find(({ task }) => task.expected.platform === 'both');
    expect(cross).toBeDefined();
    expect(cross?.decision.canonical).toBe('both');
  });

  it('routes a no-library task to none from the absent dependency alone', () => {
    for (const { task, decision } of all.filter((r) => r.task.expected.platform === 'none')) {
      expect(decision.canonical, task.taskId).toBe('none');
      expect(decision.evidence.some((e) => e.kind === 'dependency-absent')).toBe(true);
    }
  });

  it('infers ambiguous-prompt tasks from the fixture rather than declining', () => {
    const ambiguous = all.filter(({ task }) => task.category === 'routing-ambiguous');
    expect(ambiguous.length).toBeGreaterThan(0);
    for (const { task, decision } of ambiguous) {
      expect(decision.canonical, task.taskId).toBe(task.expected.platform);
      expect(decision.confidence).toBe('medium');
    }
  });

  it('always carries evidence for every decision', () => {
    for (const { task, decision } of all) {
      expect(decision.evidence.length, task.taskId).toBeGreaterThan(0);
      expect(['high', 'medium', 'low']).toContain(decision.confidence);
    }
  });
});
