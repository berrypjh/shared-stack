import { evalRunSchema } from '@berrypjh/observability-contracts';

import { describe, expect, it } from 'vitest';

import { evalRun, RESOLVER_MATRIX, RN_UNSUPPORTED } from '../../test/evals';

import {
  confusionGrid,
  metricText,
  PRIMARY_KEYS,
  retrievalText,
  routingMatrix,
  verificationCounts,
} from './ai';

const run = evalRunSchema.parse(evalRun());
const byVariant = (id: string) => {
  const found = run.variants.find((variant) => variant.variant === id);
  if (!found) throw new Error(`no variant ${id}`);
  return found;
};

describe('primary metric — 원본 이름·분자·분모·n 그대로', () => {
  it('primary key 순서를 contracts registry 에서 읽는다', () => {
    expect(PRIMARY_KEYS).toEqual([
      'verifiedTaskSuccessRate',
      'routingAccuracy',
      'requiredEvidenceRecallAtK',
      'medianInputTokens',
      'falseSuccessRate',
    ]);
  });

  it('rate 는 백분율과 분자/분모를 함께 쓴다', () => {
    const { primary } = byVariant('progressive-with-repair');
    expect(metricText(primary.verifiedTaskSuccessRate, 'rate')).toBe('50.0% (2/4)');
  });

  it('false success 분모는 명시적으로 주장한 trial 수다 — trial 전체가 아니다', () => {
    expect(metricText(byVariant('progressive-with-repair').primary.falseSuccessRate, 'rate')).toBe(
      '33.3% (1/3)',
    );
    expect(metricText(byVariant('consumer-docs').primary.falseSuccessRate, 'rate')).toBe(
      '100.0% (3/3)',
    );
  });

  it('aggregate 는 n 을, tokens 는 단위를 붙인다', () => {
    const { primary } = byVariant('consumer-docs');
    expect(metricText(primary.medianInputTokens, 'tokens')).toBe('1,000 tokens (n=4)');
    expect(metricText(primary.requiredEvidenceRecallAtK, 'mean')).toBe('0.83 (n=3)');
  });

  it('값이 없으면 0 이 아니라 N/A 와 원본 이유다', () => {
    const { secondary } = byVariant('consumer-docs');
    expect(metricText(secondary.noToolCorrectness, 'rate')).toBe('N/A — 분모 0 (0/0)');
    expect(metricText(secondary.toolCallsPerSuccessfulTask, 'mean')).toBe('N/A — 표본 없음 (n=0)');
  });
});

describe('confusionGrid — expected 4행 × predicted 5열 고정', () => {
  const grid = confusionGrid(RESOLVER_MATRIX);

  it('행·열 순서를 바꾸지 않고 both·unreported 를 숨기지 않는다', () => {
    expect(grid.map((row) => row.expected)).toEqual(['web', 'react-native', 'both', 'none']);
    expect(grid[0].cells.map((cell) => cell.predicted)).toEqual([
      'web',
      'react-native',
      'none',
      'both',
      'unreported',
    ]);
    const both = grid[2];
    expect(both.cells.map((cell) => cell.count)).toEqual([0, 0, 0, 1, 1]);
    expect(both.rowTotal).toBe(2);
  });

  it('관측된 0 은 0 이고 대각선을 표시한다 — 새 비율을 만들지 않는다', () => {
    const web = grid[0];
    expect(web.cells[1]).toEqual({
      expected: 'web',
      predicted: 'react-native',
      count: 0,
      diagonal: false,
    });
    expect(web.cells[0]).toMatchObject({ count: 15, diagonal: true });
  });

  it('관측 0 인 행과 routing 결과 자체가 없는 경우를 구분한다', () => {
    const traceMatrix = routingMatrix(run, 'trace-grades', 'consumer-docs');
    if (!traceMatrix) throw new Error('trace-grades matrix 가 없다');
    const traceGrid = confusionGrid(traceMatrix);
    expect(traceGrid[2]).toMatchObject({ expected: 'both', rowTotal: 0 });
    expect(traceGrid[0].cells[4]).toMatchObject({ predicted: 'unreported', count: 1 });
    expect(routingMatrix(run, 'trace-grades', 'unknown-variant')).toBeNull();
    expect(routingMatrix(run, 'deterministic-resolver', null)?.total).toBe(37);
  });
});

describe('retrieval', () => {
  it('required evidence 가 없으면 recall·RR 은 N/A 다', () => {
    const noUi = run.traces.find((trace) => trace.taskId === 'no-ui-date-format');
    expect(noUi && retrievalText(noUi.retrieval)).toEqual({
      recall: 'N/A — required evidence 없음',
      reciprocalRank: 'N/A — required evidence 없음',
      firstHitRank: 'N/A — required evidence 없음',
    });
  });

  it('값이 있으면 소수와 순위를 그대로 쓴다', () => {
    const helper = run.traces.find(
      (trace) => trace.id === 'consumer-docs::web-textfield-helper::1',
    );
    expect(helper && retrievalText(helper.retrieval)).toEqual({
      recall: '0.50',
      reciprocalRank: '0.50',
      firstHitRank: '2',
    });
  });
});

describe('verificationCounts — kind × status (verification run 수)', () => {
  it('unsupported 는 통과가 아닌 자기 칸에 센다', () => {
    const traces = run.traces.filter((trace) => trace.variant === 'progressive-with-repair');
    const counts = verificationCounts(traces);
    expect(counts.test).toEqual({ passed: 3, failed: 0, 'not-run': 0, unsupported: 1, timeout: 0 });
    expect(counts.typecheck.passed).toBe(4);
    expect(counts.build).toEqual({
      passed: 0,
      failed: 0,
      'not-run': 0,
      unsupported: 0,
      timeout: 0,
    });
  });

  it('실행하지 않고 보고만 한 variant 에는 run 이 없다', () => {
    const counts = verificationCounts(
      run.traces.filter((trace) => trace.variant === 'consumer-docs'),
    );
    expect(Object.values(counts).every((row) => Object.values(row).every((n) => n === 0))).toBe(
      true,
    );
    expect(RN_UNSUPPORTED).toContain('jsdom');
  });
});
