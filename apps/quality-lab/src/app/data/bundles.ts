/**
 * bundle 행을 화면 모양으로 묶는다. 값은 수집기가 검증한 field 그대로이고,
 * 비교는 contracts 의 `compareBundle` 조건이 모두 같을 때만 한다.
 */
import { type BundleMeasurement, compareBundle } from '@berrypjh/observability-contracts';

export type BudgetBar =
  | { kind: 'budget'; value: number; limit: number; over: boolean }
  | { kind: 'gap'; reason: string }
  | { kind: 'none'; reason: string };

/** 같은 측정의 current·limit 로만 막대를 만든다. 값이 없으면 0 막대가 아니라 gap 이다. */
export const budgetBarOf = (measurement: BundleMeasurement): BudgetBar => {
  if (!measurement.budget) return { kind: 'none', reason: '한도가 없는 진단 값입니다' };
  if (measurement.value === null) {
    return { kind: 'gap', reason: measurement.reason ?? '값이 없습니다' };
  }
  const limit = measurement.budget.limitBytes;
  return { kind: 'budget', value: measurement.value, limit, over: measurement.value > limit };
};

export type BaselineRun = { runId: string; bundles: BundleMeasurement[] };

export type BaselineCell =
  | { status: 'no-baseline'; reason: string }
  | { status: 'missing'; reason: string }
  | { status: 'not-comparable'; reasons: string[] }
  | { status: 'compared'; baselineValue: number; deltaBytes: number; relativeDelta: number | null };

export const baselineCellOf = (
  current: BundleMeasurement,
  baseline: BaselineRun | null,
): BaselineCell => {
  if (!baseline) {
    return { status: 'no-baseline', reason: 'baseline 으로 비교할 실행을 고르지 않았습니다' };
  }
  const previous = baseline.bundles.find((row) => row.id === current.id);
  if (!previous) return { status: 'missing', reason: `${baseline.runId} 에 이 case 가 없습니다` };
  const comparison = compareBundle(current, previous);
  if (!comparison.comparable || comparison.deltaBytes === null || previous.value === null) {
    return { status: 'not-comparable', reasons: comparison.reasons };
  }
  return {
    status: 'compared',
    baselineValue: previous.value,
    deltaBytes: comparison.deltaBytes,
    relativeDelta: comparison.relativeDelta,
  };
};

export type SizeLimitRow = {
  measurement: BundleMeasurement;
  bar: BudgetBar;
  baseline: BaselineCell;
};

/** size-limit 조정값만. standalone esbuild 값은 다른 method 라 같은 표에 넣지 않는다. */
export const sizeLimitRows = (
  bundles: BundleMeasurement[],
  baseline: BaselineRun | null,
): SizeLimitRow[] =>
  bundles
    .filter((row) => row.method === 'size-limit')
    .map((measurement) => ({
      measurement,
      bar: budgetBarOf(measurement),
      baseline: baselineCellOf(measurement, baseline),
    }));

export const TREESHAKE_KINDS = ['single', 'multi', 'all-exports', 'other'] as const;
export type TreeshakeKind = (typeof TREESHAKE_KINDS)[number];

/** 수집기(`normalizers/bundle.ts`)가 붙인 scenario 이름 접두어로 종류를 읽는다. */
export const treeshakeKindOf = (caseName: string): TreeshakeKind => {
  if (caseName.startsWith('single: ')) return 'single';
  if (caseName.startsWith('multi: ')) return 'multi';
  if (caseName.startsWith('all-exports')) return 'all-exports';
  return 'other';
};

export type TreeshakeScenario = {
  caseName: string;
  kind: TreeshakeKind;
  importSpec: string;
  raw: BundleMeasurement | null;
  gzip: BundleMeasurement | null;
};

export type TreeshakeGroup = { package: string; scenarios: TreeshakeScenario[] };

/** package → scenario 순서는 수집 순서 그대로. raw(`none`)와 gzip 은 한 scenario 의 두 칸이다. */
export const treeshakeGroups = (bundles: BundleMeasurement[]): TreeshakeGroup[] => {
  const groups = new Map<string, Map<string, TreeshakeScenario>>();
  for (const row of bundles) {
    if (row.method !== 'treeshake-esbuild') continue;
    const scenarios = groups.get(row.package) ?? new Map<string, TreeshakeScenario>();
    groups.set(row.package, scenarios);
    const scenario = scenarios.get(row.caseName) ?? {
      caseName: row.caseName,
      kind: treeshakeKindOf(row.caseName),
      importSpec: row.importSpec,
      raw: null,
      gzip: null,
    };
    scenarios.set(row.caseName, scenario);
    if (row.compression === 'none') scenario.raw = row;
    if (row.compression === 'gzip') scenario.gzip = row;
  }
  return [...groups].map(([name, scenarios]) => ({
    package: name,
    scenarios: [...scenarios.values()],
  }));
};

export type TreeshakeCompression = 'none' | 'gzip';

export type GroupedBar = {
  caseName: string;
  kind: TreeshakeKind;
  value: number | null;
  reason: string | null;
};

/** 한 압축 안에서만 축을 잡는다. 값이 없는 막대는 value null 과 이유로 남는다. */
export const groupedBars = (
  group: TreeshakeGroup,
  compression: TreeshakeCompression,
): { max: number | null; bars: GroupedBar[] } => {
  const bars = group.scenarios.map((scenario) => {
    const row = compression === 'none' ? scenario.raw : scenario.gzip;
    return {
      caseName: scenario.caseName,
      kind: scenario.kind,
      value: row?.value ?? null,
      reason: row ? row.reason : '이 압축으로 측정한 행이 없습니다',
    };
  });
  const values = bars.flatMap((bar) => (bar.value === null ? [] : [bar.value]));
  return { max: values.length === 0 ? null : Math.max(...values), bars };
};
