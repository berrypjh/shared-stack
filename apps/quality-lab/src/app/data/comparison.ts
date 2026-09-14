import type {
  ComparisonReason,
  ComparisonRow,
  ComparisonRowStatus,
  ComparisonState,
  SeriesPoint,
  TrendPoint,
} from '@berrypjh/observability-contracts';

import { formatInteger } from './format';

/** 실행 비교·추세를 글로. 보고 전용이고, 통과·실패 판정 문구를 만들지 않는다. */

export const COMPARISON_STATE_LABEL: Record<ComparisonState, string> = {
  comparable: '비교 가능 (comparable)',
  incompatible: '비교 불가 (incompatible)',
  unknown: '조건 모름 (unknown)',
  'no-baseline': '기준 없음 (no-baseline)',
};

export const REASON_EFFECT_LABEL: Record<ComparisonReason['effect'], string> = {
  blocks: '비교 막음',
  unknown: '모름 (비교 가능으로 가정하지 않음)',
  informs: '참고 (비교는 계속)',
};

export const ROW_STATUS_LABEL: Record<ComparisonRowStatus, string> = {
  compared: '비교함',
  incompatible: '비교 불가',
  unknown: '조건 모름',
  'not-measured': '측정 안 됨',
  added: '새로 생김',
  removed: '없어짐',
};

export const valueText = (unit: SeriesPoint['unit'], value: number | null) => {
  if (value === null) return '값 없음';
  if (unit === 'bytes') return `${formatInteger(value)} B`;
  if (unit === 'tokens') return `${formatInteger(value)} tokens`;
  return `${(value * 100).toFixed(1)}%`;
};

const signed = (value: number, format: (n: number) => string) =>
  value > 0 ? `+${format(value)}` : format(value);

/** 절대 차이(부호 있음)·상대 차이·percentage point 를 구분해서 쓴다. */
export const deltaText = (row: ComparisonRow) => {
  const { delta } = row;
  if (!delta) return `차이 계산 안 함 (${ROW_STATUS_LABEL[row.status]})`;
  const median = row.statistic === 'median' ? ' · median 차이이며 통계 검정이 아님' : '';
  if (delta.relativeNote === 'percentage-point') {
    return `${signed(delta.percentagePoints ?? 0, (n) => n.toFixed(1))} %p${median}`;
  }
  const unit = row.unit === 'bytes' ? 'B' : 'tokens';
  const absolute = `${signed(delta.absolute, formatInteger)} ${unit}`;
  const relative =
    delta.relative === null
      ? ' (상대 차이 N/A — 기준 0)'
      : ` (${signed(delta.relative * 100, (n) => n.toFixed(2))}%)`;
  return `${absolute}${relative}${median}`;
};

export const reasonsText = (reasons: ComparisonReason[]) =>
  reasons.length === 0
    ? '없음'
    : reasons
        .map((reason) => `${reason.message} (${REASON_EFFECT_LABEL[reason.effect]})`)
        .join(' · ');

export const trendStatusText = (point: TrendPoint) => {
  switch (point.status) {
    case 'point':
      return `구간 ${point.segment}`;
    case 'gap':
      return `요약 없음 (gap) — 잇지 않음${point.problem ? `: ${point.problem}` : ''}`;
    case 'not-measured':
      return '측정 안 됨 — 잇지 않음';
    case 'unknown-conditions':
      return '조건 모름 — 잇지 않음';
    case 'absent':
      return '이 실행에 없는 지표';
  }
};
