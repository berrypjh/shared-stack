import type { ComparisonRow, TrendPoint } from '@berrypjh/observability-contracts';

import type { SummaryResult } from './client';
import { deltaText, historyInputs, reasonsText, trendStatusText, valueText } from './comparison';

const row = (overrides: Partial<ComparisonRow>): ComparisonRow => ({
  id: 'bundle.size-limit.react-ui.cx-only',
  domain: 'bundle',
  label: 'cx only',
  unit: 'bytes',
  statistic: 'value',
  status: 'compared',
  baseline: 10574,
  current: 10474,
  delta: { absolute: -100, relative: -100 / 10574, relativeNote: null, percentagePoints: null },
  reasons: [],
  gate: 'report-only',
  ...overrides,
});

describe('valueText', () => {
  it('단위를 붙이고, 값이 없으면 0 이 아니라 값 없음이다', () => {
    expect(valueText('bytes', 10474)).toBe('10,474 B');
    expect(valueText('tokens', 1200)).toBe('1,200 tokens');
    expect(valueText('ratio', 0.5)).toBe('50.0%');
    expect(valueText('bytes', null)).toBe('값 없음');
  });
});

describe('deltaText', () => {
  it('절대 차이는 부호를 지우지 않고 상대 차이와 함께 쓴다', () => {
    expect(deltaText(row({}))).toBe('-100 B (-0.95%)');
    expect(
      deltaText(
        row({
          delta: { absolute: 100, relative: 0.01, relativeNote: null, percentagePoints: null },
        }),
      ),
    ).toBe('+100 B (+1.00%)');
  });

  it('기준이 0 이면 상대 차이는 N/A 다', () => {
    const delta = {
      absolute: 10,
      relative: null,
      relativeNote: 'zero-baseline',
      percentagePoints: null,
    } as const;
    expect(deltaText(row({ unit: 'tokens', delta }))).toBe('+10 tokens (상대 차이 N/A — 기준 0)');
  });

  it('비율은 percentage point 이고 median 차이는 통계 검정이 아니라고 적는다', () => {
    const delta = {
      absolute: 0.05,
      relative: null,
      relativeNote: 'percentage-point',
      percentagePoints: 5,
    } as const;
    expect(deltaText(row({ unit: 'ratio', statistic: 'median', delta }))).toBe(
      '+5.0 %p · median 차이이며 통계 검정이 아님',
    );
  });

  it('차이가 없으면 계산하지 않은 이유를 상태로 준다', () => {
    expect(deltaText(row({ status: 'incompatible', delta: null }))).toBe(
      '차이 계산 안 함 (비교 불가)',
    );
  });
});

describe('reasonsText', () => {
  it('이유와 그 효과를 함께 쓴다', () => {
    expect(reasonsText([])).toBe('없음');
    expect(
      reasonsText([{ key: 'compression', effect: 'blocks', message: 'compression differs' }]),
    ).toBe('compression differs (비교 막음)');
  });
});

describe('trendStatusText', () => {
  const point = (overrides: Partial<TrendPoint>): TrendPoint => ({
    runId: 'run-a',
    status: 'point',
    value: 1,
    segment: 1,
    collectedAt: null,
    problem: null,
    ...overrides,
  });

  it('점은 구간 번호, 끊는 점은 잇지 않는다고 쓴다', () => {
    expect(trendStatusText(point({}))).toBe('구간 1');
    expect(trendStatusText(point({ status: 'gap', problem: '요약 없음' }))).toBe(
      '요약 없음 (gap) — 잇지 않음: 요약 없음',
    );
    expect(trendStatusText(point({ status: 'not-measured' }))).toBe('측정 안 됨 — 잇지 않음');
    expect(trendStatusText(point({ status: 'unknown-conditions' }))).toBe('조건 모름 — 잇지 않음');
    expect(trendStatusText(point({ status: 'absent' }))).toBe('이 실행에 없는 지표');
  });
});

describe('historyInputs', () => {
  it('요약을 다 받기 전에는 순서를 정하지 않는다', () => {
    expect(historyInputs(['run-a'], {})).toBeNull();
  });

  it('읽지 못한 요약은 이유와 함께 자리를 지킨다', () => {
    const missing: SummaryResult = { status: 'missing', target: 'summary', message: '요약 없음' };
    expect(historyInputs(['run-a'], { 'run-a': missing })).toEqual([
      { runId: 'run-a', summary: null, problem: '요약 없음' },
    ]);
  });
});
