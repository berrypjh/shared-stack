import type { SeriesPoint } from './metrics.js';
import type { RunSummary } from './run-summary.js';

/**
 * 실행 기록과 추세. 요약만 읽는다. 시간순으로 두되 요약이 없는 실행은 자리를 지키는 gap 이고,
 * 비교 키가 같은 이웃한 점만 한 구간으로 잇는다.
 */

export type HistoryInput = { runId: string; summary: RunSummary | null; problem: string | null };
export type HistoryEntry =
  | { runId: string; status: 'ready'; summary: RunSummary; problem: null }
  | { runId: string; status: 'missing'; summary: null; problem: string | null };

const timeOf = (summary: RunSummary) => Date.parse(summary.metadata.collection.startedAt);

/** 요약이 있는 실행을 수집 시각 순으로 정렬하고, 요약이 없는 실행은 원래 자리(index 순서)에 둔다. */
export const orderHistory = (inputs: HistoryInput[]): HistoryEntry[] => {
  const ready = inputs
    .flatMap((input) => (input.summary ? [{ runId: input.runId, summary: input.summary }] : []))
    .sort((a, b) => timeOf(a.summary) - timeOf(b.summary) || a.runId.localeCompare(b.runId));
  let next = 0;
  return inputs.map((input): HistoryEntry => {
    if (!input.summary) {
      return { runId: input.runId, status: 'missing', summary: null, problem: input.problem };
    }
    const entry = ready[next++];
    return { runId: entry.runId, status: 'ready', summary: entry.summary, problem: null };
  });
};

export const TREND_POINT_STATUSES = [
  'point',
  'gap',
  'not-measured',
  'unknown-conditions',
  'absent',
] as const;

export type TrendPoint = {
  runId: string;
  status: (typeof TREND_POINT_STATUSES)[number];
  value: number | null;
  /** 이어 그릴 수 있는 구간 번호. 점이 아니면 null 이다. */
  segment: number | null;
  collectedAt: string | null;
  problem: string | null;
};

export type Trend = {
  id: string;
  unit: SeriesPoint['unit'] | null;
  points: TrendPoint[];
  segmentCount: number;
};

/**
 * 한 metric 의 추세. gap·미측정·조건 모름은 구간을 끊고, 그 metric 을 수집하지 않은 실행(absent)은
 * 끊지 않는다. 조건(profile·comparableKey)이 바뀌면 새 구간이다.
 */
export const trendOf = (entries: HistoryEntry[], id: string): Trend => {
  const points: TrendPoint[] = [];
  let unit: Trend['unit'] = null;
  let segment = 0;
  let previousKey: string | null = null;

  for (const entry of entries) {
    if (entry.status === 'missing' || entry.summary.series === null) {
      const problem =
        entry.status === 'missing'
          ? entry.problem
          : '이 요약에는 추세 값이 없다 — 다시 export 하세요';
      points.push({
        runId: entry.runId,
        status: 'gap',
        value: null,
        segment: null,
        collectedAt: null,
        problem,
      });
      previousKey = null;
      continue;
    }
    const collectedAt = entry.summary.metadata.collection.startedAt;
    const found = entry.summary.series.find((point) => point.id === id);
    const base = { runId: entry.runId, collectedAt, problem: null, segment: null };
    if (!found) {
      points.push({ ...base, status: 'absent', value: null });
      continue;
    }
    unit ??= found.unit;
    if (found.value === null) {
      points.push({ ...base, status: 'not-measured', value: null });
      previousKey = null;
    } else if (!found.keyComplete) {
      points.push({ ...base, status: 'unknown-conditions', value: found.value });
      previousKey = null;
    } else {
      const key = `${entry.summary.metadata.profile}\n${found.comparableKey}`;
      if (key !== previousKey) segment += 1;
      previousKey = key;
      points.push({ ...base, status: 'point', value: found.value, segment });
    }
  }
  return { id, unit, points, segmentCount: segment };
};
