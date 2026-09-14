import { z } from 'zod';

import { compareBundle } from './bundle.js';
import { compareContext } from './context.js';
import type { OriginalEvalComparison } from './eval.js';
import { metricPoints, type SeriesPoint } from './metrics.js';
import { isoTimeSchema, runIdSchema } from './primitives.js';
import { PROFILES, type RunArtifact, type RunMetadata } from './run.js';

/**
 * 명시한 두 실행의 비교. 모든 행은 보고 전용이다 — 통과·실패 threshold 를 만들지 않는다.
 * 조건이 같을 때만 delta 를 주고, 모르는 조건은 unknown 으로 남긴다.
 */

export const COMPARISON_STATES = ['comparable', 'incompatible', 'unknown', 'no-baseline'] as const;
export const COMPARISON_ROW_STATUSES = [
  'compared',
  'incompatible',
  'unknown',
  'not-measured',
  'added',
  'removed',
] as const;
/** `blocks` 는 비교를 막고, `unknown` 은 판단할 수 없고, `informs` 는 비교는 하되 알린다. */
export const REASON_EFFECTS = ['blocks', 'unknown', 'informs'] as const;

export type ComparisonState = (typeof COMPARISON_STATES)[number];
export type ComparisonRowStatus = (typeof COMPARISON_ROW_STATUSES)[number];
export type ComparisonReason = {
  key: string;
  effect: (typeof REASON_EFFECTS)[number];
  message: string;
};

export type Delta = {
  /** current − baseline. 부호를 지운 값이 아니다. */
  absolute: number;
  relative: number | null;
  relativeNote: 'zero-baseline' | 'percentage-point' | null;
  percentagePoints: number | null;
};

/** 비율(0–1)은 percentage point 로, 기준 0 의 상대 차이는 N/A 로 둔다. */
export const deltaOf = ({
  unit,
  baseline,
  current,
}: {
  unit: SeriesPoint['unit'];
  baseline: number;
  current: number;
}): Delta => {
  const absolute = current - baseline;
  if (unit === 'ratio') {
    return {
      absolute,
      relative: null,
      relativeNote: 'percentage-point',
      percentagePoints: absolute * 100,
    };
  }
  if (baseline === 0) {
    return { absolute, relative: null, relativeNote: 'zero-baseline', percentagePoints: null };
  }
  return { absolute, relative: absolute / baseline, relativeNote: null, percentagePoints: null };
};

export type ComparisonRow = Pick<SeriesPoint, 'id' | 'domain' | 'label' | 'unit' | 'statistic'> & {
  status: ComparisonRowStatus;
  baseline: number | null;
  current: number | null;
  delta: Delta | null;
  reasons: ComparisonReason[];
  gate: 'report-only';
};

export type RunLineage = {
  runId: string;
  profile: RunMetadata['profile'];
  state: RunMetadata['state'];
  sourceSha: string;
  sourceDirty: boolean | 'unknown';
  lockfileHash: string;
  collectedAt: string;
  collectorSha: string;
};

export type RunComparison = {
  state: ComparisonState;
  reasons: ComparisonReason[];
  lineage: { current: RunLineage; baseline: RunLineage | null };
  rows: ComparisonRow[];
  counts: Record<ComparisonRowStatus, number>;
  /** evaluator 가 낸 원래 비교. 대시보드 판정과 따로 둔다. */
  originalEval: { sourceId: string; comparison: OriginalEvalComparison }[];
};

const lineageOf = ({ metadata }: RunArtifact): RunLineage => ({
  runId: metadata.runId,
  profile: metadata.profile,
  state: metadata.state,
  sourceSha: metadata.source.sha,
  sourceDirty: metadata.source.dirty,
  lockfileHash: metadata.source.lockfileHash,
  collectedAt: metadata.collection.startedAt,
  collectorSha: metadata.collection.sha,
});

const reason = (
  key: string,
  effect: ComparisonReason['effect'],
  message: string,
): ComparisonReason => ({ key, effect, message });

/** 실행 단위 조건. source SHA·lockfile·toolchain 변화는 비교하려는 변화라 막지 않고 알린다. */
const runReasons = (current: RunMetadata, baseline: RunMetadata): ComparisonReason[] => {
  const reasons: ComparisonReason[] = [];
  if (current.runId === baseline.runId) {
    reasons.push(reason('metadata.runId', 'blocks', '같은 실행을 기준으로 골랐다'));
  }
  if (current.profile !== baseline.profile) {
    reasons.push(
      reason(
        'metadata.profile',
        'blocks',
        `profile 이 다르다: ${baseline.profile} → ${current.profile}`,
      ),
    );
  }
  for (const key of ['sha', 'lockfileHash'] as const) {
    const [before, after] = [baseline.source[key], current.source[key]];
    if (before === 'unknown' || after === 'unknown') {
      reasons.push(reason(`source.${key}`, 'informs', `source.${key} 를 모르는 실행이 있다`));
    } else if (before !== after) {
      reasons.push(reason(`source.${key}`, 'informs', `source.${key} 가 다르다`));
    }
  }
  if (current.source.dirty !== false || baseline.source.dirty !== false) {
    reasons.push(
      reason('source.dirty', 'informs', 'commit 되지 않은 변경이 있거나 모르는 실행이 있다'),
    );
  }
  const tools = new Set([...Object.keys(current.tools), ...Object.keys(baseline.tools)]);
  for (const tool of [...tools].sort()) {
    if (current.tools[tool] !== baseline.tools[tool]) {
      reasons.push(
        reason(
          `tools.${tool}`,
          'informs',
          `${tool} 이 다르다: ${baseline.tools[tool] ?? '없음'} → ${current.tools[tool] ?? '없음'}`,
        ),
      );
    }
  }
  return reasons;
};

const conditionReasons = (messages: string[]): ComparisonReason[] =>
  messages
    .filter((message) => !/missing$/.test(message))
    .map((message) => reason(message.split(' ')[0], 'blocks', message));

const parseKey = (point: SeriesPoint) => JSON.parse(point.comparableKey) as Record<string, unknown>;

const flatKey = (point: SeriesPoint): Record<string, string> => {
  const { conditions, ...rest } = parseKey(point);
  const flat = Object.fromEntries(
    Object.entries(rest).map(([key, value]) => [key, JSON.stringify(value)]),
  );
  if (conditions && typeof conditions === 'object') {
    for (const [key, value] of Object.entries(conditions)) {
      flat[`conditions.${key}`] = JSON.stringify(value);
    }
  }
  return flat;
};

/** key 전체를 비교한다. 모르는 조건(`unknownKeys`)은 차이로 세지 않고 unknown 이유가 된다. */
const keyReasons = (current: SeriesPoint, baseline: SeriesPoint): ComparisonReason[] => {
  const unknown = [...new Set([...baseline.unknownKeys, ...current.unknownKeys])].sort();
  const skip = (key: string) => unknown.some((name) => key === name || key.startsWith(`${name}.`));
  const [after, before] = [flatKey(current), flatKey(baseline)];
  const blocks = [...new Set([...Object.keys(after), ...Object.keys(before)])]
    .sort()
    .filter((key) => !skip(key) && after[key] !== before[key])
    .map((key) => reason(key, 'blocks', `${key} differs`));
  return [...blocks, ...unknown.map((key) => reason(key, 'unknown', `${key} 를 모른다`))];
};

type Sides = { current: RunArtifact; baseline: RunArtifact };

const pairReasons = (
  id: string,
  pair: { current: SeriesPoint; baseline: SeriesPoint },
  runs: Sides,
) => {
  if (pair.current.domain === 'bundle') {
    const find = (run: RunArtifact) => run.bundles.find((measurement) => measurement.id === id);
    const [after, before] = [find(runs.current), find(runs.baseline)];
    if (after && before) return conditionReasons(compareBundle(after, before).reasons);
  }
  if (pair.current.domain === 'context') {
    const find = (run: RunArtifact) => run.contexts.find((measurement) => measurement.id === id);
    const [after, before] = [find(runs.current), find(runs.baseline)];
    if (after && before) {
      const unknown = keyReasons(pair.current, pair.baseline).filter((r) => r.effect === 'unknown');
      return [...conditionReasons(compareContext(after, before).reasons), ...unknown];
    }
  }
  return keyReasons(pair.current, pair.baseline);
};

const rowOf = (
  point: SeriesPoint,
  values: Pick<ComparisonRow, 'status' | 'baseline' | 'current' | 'delta' | 'reasons'>,
): ComparisonRow => ({
  id: point.id,
  domain: point.domain,
  label: point.label,
  unit: point.unit,
  statistic: point.statistic,
  ...values,
  gate: 'report-only',
});

const pairRow = (current: SeriesPoint, baseline: SeriesPoint, runs: Sides): ComparisonRow => {
  const reasons = pairReasons(current.id, { current, baseline }, runs);
  const values = { baseline: baseline.value, current: current.value, reasons, delta: null };
  if (reasons.some((r) => r.effect === 'blocks'))
    return rowOf(current, { ...values, status: 'incompatible' });
  if (reasons.some((r) => r.effect === 'unknown'))
    return rowOf(current, { ...values, status: 'unknown' });
  if (current.value === null || baseline.value === null) {
    return rowOf(current, { ...values, status: 'not-measured' });
  }
  if (current.unit !== baseline.unit) return rowOf(current, { ...values, status: 'incompatible' });
  return rowOf(current, {
    ...values,
    status: 'compared',
    delta: deltaOf({ unit: current.unit, baseline: baseline.value, current: current.value }),
  });
};

const metricRows = (runs: Sides): ComparisonRow[] => {
  const currentPoints = metricPoints(runs.current);
  const baselinePoints = new Map(metricPoints(runs.baseline).map((point) => [point.id, point]));
  const rows = currentPoints.map((point) => {
    const before = baselinePoints.get(point.id);
    return before
      ? pairRow(point, before, runs)
      : rowOf(point, {
          status: 'added',
          baseline: null,
          current: point.value,
          delta: null,
          reasons: [],
        });
  });
  const currentIds = new Set(currentPoints.map((point) => point.id));
  for (const [id, point] of baselinePoints) {
    if (currentIds.has(id)) continue;
    rows.push(
      rowOf(point, {
        status: 'removed',
        baseline: point.value,
        current: null,
        delta: null,
        reasons: [],
      }),
    );
  }
  return rows;
};

const countRows = (rows: ComparisonRow[]) =>
  Object.fromEntries(
    COMPARISON_ROW_STATUSES.map((status) => [
      status,
      rows.filter((row) => row.status === status).length,
    ]),
  ) as Record<ComparisonRowStatus, number>;

/** 함께 가진 metric 이 하나라도 비교되면 comparable. 모두 막히거나 모르면 그 상태다. */
const stateOf = (rows: ComparisonRow[]): ComparisonState => {
  const has = (status: ComparisonRowStatus) => rows.some((row) => row.status === status);
  if (has('compared')) return 'comparable';
  if (has('unknown')) return 'unknown';
  if (has('incompatible')) return 'incompatible';
  return 'comparable';
};

export const compareRuns = (current: RunArtifact, baseline: RunArtifact | null): RunComparison => {
  const lineage = { current: lineageOf(current), baseline: baseline && lineageOf(baseline) };
  const originalEval = current.evals.flatMap((run) =>
    run.originalComparison ? [{ sourceId: run.sourceId, comparison: run.originalComparison }] : [],
  );
  if (!baseline) {
    return {
      state: 'no-baseline',
      reasons: [],
      lineage,
      rows: [],
      counts: countRows([]),
      originalEval,
    };
  }
  const reasons = runReasons(current.metadata, baseline.metadata);
  if (reasons.some((r) => r.effect === 'blocks')) {
    return {
      state: 'incompatible',
      reasons,
      lineage,
      rows: [],
      counts: countRows([]),
      originalEval,
    };
  }
  const rows = metricRows({ current, baseline });
  const shared = rows.some((row) => row.status !== 'added' && row.status !== 'removed');
  if (rows.length > 0 && !shared) {
    reasons.push(
      reason('metrics.shared', 'blocks', '함께 가진 지표가 없다 — 추가·제거된 지표만 있다'),
    );
    return { state: 'incompatible', reasons, lineage, rows, counts: countRows(rows), originalEval };
  }
  return { state: stateOf(rows), reasons, lineage, rows, counts: countRows(rows), originalEval };
};

/**
 * profile 마다 사람이 고른 baseline run ID. run 파일을 복사하거나 바꾸지 않는 포인터이고,
 * 최신 실행이 자동으로 baseline 이 되지 않는다. history 는 지우지 않고 쌓는다.
 */
const pointerEntrySchema = z.strictObject({
  profile: z.enum(PROFILES),
  runId: runIdSchema,
  setAt: isoTimeSchema,
});

export const baselinePointerSchema = z
  .strictObject({
    version: z.literal(1),
    pointers: z.array(pointerEntrySchema),
    history: z.array(pointerEntrySchema.extend({ replaced: runIdSchema.nullable() })),
  })
  .superRefine((pointer, ctx) => {
    const profiles = pointer.pointers.map((entry) => entry.profile);
    if (new Set(profiles).size !== profiles.length) {
      ctx.addIssue({ code: 'custom', path: ['pointers'], message: 'one baseline per profile' });
    }
    pointer.pointers.forEach((entry, i) => {
      const recorded = pointer.history.some(
        (item) =>
          item.profile === entry.profile &&
          item.runId === entry.runId &&
          item.setAt === entry.setAt,
      );
      if (!recorded) {
        ctx.addIssue({
          code: 'custom',
          path: ['pointers', i],
          message: 'pointer is not in history',
        });
      }
    });
  });

export type BaselinePointer = z.infer<typeof baselinePointerSchema>;

export const EMPTY_BASELINE_POINTER: BaselinePointer = { version: 1, pointers: [], history: [] };
