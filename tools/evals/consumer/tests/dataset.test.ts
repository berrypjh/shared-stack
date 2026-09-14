import { describe, expect, it } from 'vitest';

import { loadDataset, parseTasks } from '../runner/dataset';

const dev = await loadDataset('dev');
const held = await loadDataset('test');
const all = [...dev, ...held];

describe('dataset', () => {
  // 상한은 코퍼스가 자라면 의식적으로 올린다 — 이 검사의 의미는 "데이터셋이 조용히 비거나
  // 중복 폭증하지 않는다"이고, 그 역할은 하한이 한다.
  it('parses both splits into the 24-48 task range', () => {
    expect(dev.length).toBeGreaterThan(0);
    expect(held.length).toBeGreaterThan(0);
    expect(all.length).toBeGreaterThanOrEqual(24);
    expect(all.length).toBeLessThanOrEqual(48);
  });

  it('keeps dev and test disjoint', () => {
    const devIds = new Set(dev.map((t) => t.taskId));
    expect(held.some((t) => devIds.has(t.taskId))).toBe(false);
  });

  it('covers every platform and the required task shapes', () => {
    expect(new Set(all.map((t) => t.expected.platform))).toEqual(
      new Set(['web', 'react-native', 'both', 'none']),
    );

    const categories = new Set(all.map((t) => t.category));
    expect(categories).toContain('negative-api');
    expect(categories).toContain('routing-ambiguous');
    expect(categories).toContain('routing-none');

    const kinds = new Set(all.flatMap((t) => t.verification.map((v) => v.kind)));
    expect(kinds).toContain('public-import');
    expect(kinds).toContain('typecheck');
    expect(kinds).toContain('test');
    expect(kinds).toContain('build');
  });

  it('never expects UI packages for platform "none"', () => {
    for (const t of all.filter((t) => t.expected.platform === 'none')) {
      expect(t.expected.packages).toEqual([]);
    }
  });

  it('requires at least one verification per task', () => {
    for (const t of all) expect(t.verification.some((v) => v.required)).toBe(true);
  });

  it('fails loudly on an invalid task line', () => {
    const bad = [{ line: 3, value: { taskId: 'Bad Id', category: 'x' } }];
    expect(() => parseTasks(bad, 'inline.jsonl')).toThrow(/inline\.jsonl:3 invalid task/);
  });

  it('rejects prose in requiredEvidence', () => {
    const rows = [
      {
        line: 1,
        value: {
          ...dev[0],
          expected: { ...dev[0].expected, requiredEvidence: ['the Button component'] },
        },
      },
    ];
    expect(() => parseTasks(rows, 'inline.jsonl')).toThrow(/requiredEvidence/);
  });

  it('rejects duplicate task ids', () => {
    const rows = [
      { line: 1, value: dev[0] },
      { line: 2, value: dev[0] },
    ];
    expect(() => parseTasks(rows, 'inline.jsonl')).toThrow(/duplicate taskId/);
  });
});
