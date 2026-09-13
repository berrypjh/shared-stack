import type {
  BundleMeasurement,
  MetricObservation,
  RunArtifact,
} from '@berrypjh/observability-contracts';
import { List, ListItem } from '@berrypjh/react-ui';

import { type Bar, BarChart, type BarGroup } from '../../components/BarChart';
import { DataTable } from '../../components/DataTable';
import { LabeledSelect } from '../../components/LabeledSelect';
import { Mono } from '../../components/Mono';
import { RunBar } from '../../components/RunBar';
import { Section } from '../../components/Section';
import { StatusLabel } from '../../components/StatusLabel';
import { StatusNotice } from '../../components/StatusNotice';
import { TARGET_ROW, useHashFocus } from '../../components/useHashFocus';
import {
  type BaselineCell,
  type BaselineRun,
  groupedBars,
  type SizeLimitRow,
  sizeLimitRows,
  TREESHAKE_KINDS,
  type TreeshakeGroup,
  treeshakeGroups,
} from '../../data/bundles';
import type { SummaryResult } from '../../data/client';
import {
  availabilityLabel,
  formatBytes,
  formatInteger,
  headroomText,
  observationValueText,
} from '../../data/format';
import { OUTCOME_LABEL } from '../../data/labels';
import { loadingState, noMatchState, notRunState, unsupportedState } from '../../data/status';
import {
  type OtherRun,
  type RunData,
  runsWith,
  useOtherRun,
  useRunData,
  useSummaries,
} from '../../data/useRunData';
import { Page } from '../../ui';

const SPEC = { keys: ['run', 'base', 'package'] } as const;

const valueText = (measurement: BundleMeasurement) =>
  measurement.value === null ? `N/A — ${measurement.reason}` : formatBytes(measurement.value);

const signed = (value: number, text: string) =>
  value > 0 ? `+${text}` : value < 0 ? `-${text}` : text;

const deltaText = (deltaBytes: number, relativeDelta: number | null) =>
  `${signed(deltaBytes, `${formatInteger(Math.abs(deltaBytes))} B`)} (${
    relativeDelta === null
      ? '비율 없음'
      : signed(relativeDelta, `${Math.abs(relativeDelta * 100).toFixed(2)}%`)
  })`;

const BASELINE_PENDING: Record<OtherRun['status'], string | null> = {
  idle: null,
  ready: null,
  loading: 'baseline 실행을 불러오는 중입니다',
  error: 'baseline 실행을 읽지 못했습니다',
};

const BaselineText = ({ cell, pending }: { cell: BaselineCell; pending: string | null }) => {
  if (pending) return <span className="text-text-light">{pending}</span>;
  switch (cell.status) {
    case 'no-baseline':
    case 'missing':
      return <span className="text-text-light">{cell.reason}</span>;
    case 'not-comparable':
      return <span>{`비교 불가 — ${cell.reasons.join(', ')}`}</span>;
    case 'compared':
      return (
        <span className="flex flex-col">
          <span>{`baseline ${formatBytes(cell.baselineValue)}`}</span>
          <span>{deltaText(cell.deltaBytes, cell.relativeDelta)}</span>
        </span>
      );
  }
};

/** 수집 순서를 지키며 package 로 묶는다. 차트와 표가 같은 순서를 쓴다. */
const byPackage = <T,>(items: T[], packageOf: (item: T) => string) => {
  const groups = new Map<string, T[]>();
  for (const item of items)
    groups.set(packageOf(item), [...(groups.get(packageOf(item)) ?? []), item]);
  return [...groups];
};

const budgetGroups = (groups: [string, SizeLimitRow[]][]): BarGroup[] =>
  groups.map(([name, rows]) => ({
    label: name,
    bars: rows.flatMap(({ measurement, bar }): Bar[] => {
      if (bar.kind === 'none') return [];
      if (bar.kind === 'gap') {
        return [
          {
            key: measurement.id,
            label: measurement.caseName,
            value: null,
            scale: null,
            text: `N/A — ${bar.reason}`,
          },
        ];
      }
      return [
        {
          key: measurement.id,
          label: measurement.caseName,
          value: bar.value,
          scale: Math.max(bar.value, bar.limit),
          marker: bar.limit,
          tone: bar.over ? ('over' as const) : ('default' as const),
          text: `${formatInteger(bar.value)} B / 한도 ${formatInteger(bar.limit)} B · ${headroomText(
            measurement.budget?.headroomBytes ?? null,
          )}`,
        },
      ];
    }),
  }));

const FloorNote = () => (
  <aside
    role="note"
    aria-label="과거 조사 기록"
    className="flex flex-col gap-xs rounded-md p-md border border-dashed border-stroke-default text-xsm leading-xsm"
  >
    <span className="text-text-light text-xxsm font-semiBold">과거 조사 기록</span>
    <span className="text-text-default break-keep">
      <Mono>.size-limit.cjs</Mono> 머리 주석의 floor 설명은 single-symbol case 가 같은 하한에 묶이는
      원인을 과거에 조사한 기록입니다. 현재 HEAD 의 원인을 확정한 측정이 아닙니다.
    </span>
  </aside>
);

const BudgetSection = ({ rows, pending }: { rows: SizeLimitRow[]; pending: string | null }) => {
  const groups = byPackage(rows, (row) => row.measurement.package);
  const ordered = groups.flatMap(([, items]) => items);
  const compressions = [...new Set(rows.map((row) => row.measurement.compression))].join('·');
  return (
    <Section title="Budget (size-limit 조정값)" anchor="budget">
      <BarChart
        title="Budget 사용 — size-limit 조정값"
        description={`막대는 case 마다 자기 한도(세로선) 기준이라 case 사이 길이를 비교하는 공통 축이 아닙니다. ${compressions} 압축 · size-limit 빈 프로젝트 차감값`}
        unit="bytes"
        groups={budgetGroups(groups)}
      />
      <DataTable
        caption="size-limit budget"
        headers={[
          'case',
          'package',
          'import',
          '현재',
          '한도',
          '여유',
          '판정',
          'baseline 비교',
          'method · 압축 · 조정 · target',
        ]}
      >
        {ordered.map(({ measurement, baseline }) => (
          <tr
            key={measurement.id}
            id={`bundle-${measurement.id}`}
            tabIndex={-1}
            className={TARGET_ROW}
          >
            <th scope="row">{measurement.caseName}</th>
            <td>
              <Mono>{measurement.package}</Mono>
            </td>
            <td>
              <Mono>{measurement.importSpec}</Mono>
            </td>
            <td>{valueText(measurement)}</td>
            <td>
              {measurement.budget
                ? `${formatInteger(measurement.budget.limitBytes)} B (${measurement.budget.limitSource})`
                : '한도 없음'}
            </td>
            <td>{headroomText(measurement.budget?.headroomBytes ?? null)}</td>
            <td>
              {measurement.budget?.outcome ? (
                <StatusLabel
                  tone={measurement.budget.outcome}
                  label={OUTCOME_LABEL[measurement.budget.outcome]}
                />
              ) : (
                '판정 없음'
              )}
            </td>
            <td>
              <BaselineText cell={baseline} pending={pending} />
            </td>
            <td>
              {`${measurement.method} · ${measurement.compression} · ${measurement.adjustment} · ${measurement.target}`}
              <span className="block text-text-light">{`${measurement.tool.name} ${measurement.tool.version}`}</span>
            </td>
          </tr>
        ))}
      </DataTable>
      <FloorNote />
    </Section>
  );
};

const COMPRESSION_TITLE = { none: 'raw (압축 없음)', gzip: 'gzip' } as const;

const TreeshakePackage = ({ group }: { group: TreeshakeGroup }) => (
  <Section title={group.package} level={3}>
    {(['none', 'gzip'] as const).map((compression) => {
      const { max, bars } = groupedBars(group, compression);
      return (
        <BarChart
          key={compression}
          title={`Tree-shaking — ${group.package} · ${COMPRESSION_TITLE[compression]}`}
          description="esbuild standalone 번들 크기입니다. size-limit 조정값과 method 가 달라 budget 과 비교하지 않고, 축은 이 압축 안의 최댓값입니다"
          unit="bytes"
          groups={TREESHAKE_KINDS.flatMap((kind) => {
            const items = bars.filter((bar) => bar.kind === kind);
            return items.length === 0
              ? []
              : [
                  {
                    label: kind,
                    bars: items.map((bar) => ({
                      key: bar.caseName,
                      label: bar.caseName,
                      value: bar.value,
                      scale: max,
                      text: bar.value === null ? `N/A — ${bar.reason}` : formatBytes(bar.value),
                    })),
                  },
                ];
          })}
        />
      );
    })}
    <DataTable
      caption={`tree-shaking 행 — ${group.package}`}
      headers={['scenario', '종류', 'import', 'raw (none)', 'gzip', 'method · target · 조정']}
    >
      {group.scenarios.map((scenario) => {
        const sample = scenario.raw ?? scenario.gzip;
        return (
          <tr key={scenario.caseName}>
            <th scope="row">{scenario.caseName}</th>
            <td>{scenario.kind}</td>
            <td>
              <Mono>{scenario.importSpec}</Mono>
            </td>
            <td>{scenario.raw ? valueText(scenario.raw) : '이 압축의 행 없음'}</td>
            <td>{scenario.gzip ? valueText(scenario.gzip) : '이 압축의 행 없음'}</td>
            <td>{sample ? `${sample.method} · ${sample.target} · ${sample.adjustment}` : ''}</td>
          </tr>
        );
      })}
    </DataTable>
  </Section>
);

const TreeshakeSection = ({
  run,
  groups,
  filtered,
  alternatives,
}: {
  run: RunArtifact;
  groups: TreeshakeGroup[];
  filtered: string | undefined;
  alternatives: string[];
}) => {
  const { runId, profile } = run.metadata;
  const observation = run.observations.find(
    (item) => item.domain === 'bundle' && item.id.startsWith('bundle.treeshake'),
  );
  const hasRows = run.bundles.some((row) => row.method === 'treeshake-esbuild');
  return (
    <Section title="Tree-shaking (esbuild standalone)" anchor="treeshake">
      {groups.length > 0 ? (
        groups.map((group) => <TreeshakePackage key={group.package} group={group} />)
      ) : hasRows ? (
        <StatusNotice level={3} state={noMatchState(`package ${filtered}`)} />
      ) : observation && observation.availability !== 'available' ? (
        <StatusNotice
          level={3}
          state={notRunState({
            section: 'tree-shaking 측정',
            runId,
            reason: observation.reason ?? availabilityLabel(observation.availability),
            collectProfile: 'core',
            alternatives: null,
          })}
        />
      ) : (
        <StatusNotice
          level={3}
          state={unsupportedState({
            section: 'tree-shaking 측정',
            runId,
            profile,
            collectProfile: 'core',
            alternatives,
          })}
        />
      )}
    </Section>
  );
};

const Bundles = ({
  run,
  data,
  summaries,
}: {
  run: RunArtifact;
  data: RunData;
  summaries: Record<string, SummaryResult>;
}) => {
  const { query, setQuery } = data;
  const { runId, profile } = run.metadata;
  const other = useOtherRun(query.base);
  const alternatives = runsWith(summaries, (summary) => summary.sections.bundles > 0).filter(
    (id) => id !== runId,
  );

  if (run.bundles.length === 0) {
    return (
      <StatusNotice
        state={unsupportedState({
          section: 'bundle 측정',
          runId,
          profile,
          collectProfile: 'core',
          alternatives,
        })}
      />
    );
  }

  const packages = [...new Set(run.bundles.map((row) => row.package))];
  const inPackage = run.bundles.filter((row) => !query.package || row.package === query.package);
  const baseline: BaselineRun | null =
    other.status === 'ready' && query.base
      ? { runId: query.base, bundles: other.run.bundles }
      : null;
  const sizeLimitCount = run.bundles.filter((row) => row.method === 'size-limit').length;
  const rows = sizeLimitRows(inPackage, baseline);
  const collectorJudgements = run.observations.filter(
    (item): item is MetricObservation =>
      item.domain === 'bundle' && !item.id.startsWith('bundle.treeshake'),
  );

  return (
    <>
      <Section title="비교 조건">
        <div className="flex flex-wrap items-end gap-md">
          <LabeledSelect
            label="baseline 실행"
            value={query.base ?? ''}
            options={[
              { value: '', label: '없음' },
              ...data.runIds.filter((id) => id !== runId).map((id) => ({ value: id, label: id })),
            ]}
            onChange={(value) => setQuery({ ...query, base: value || undefined })}
          />
          <LabeledSelect
            label="패키지"
            value={query.package ?? ''}
            options={[
              { value: '', label: '전체' },
              ...packages.map((name) => ({ value: name, label: name })),
            ]}
            onChange={(value) => setQuery({ ...query, package: value || undefined })}
          />
        </div>
        <p role="status" aria-live="polite" className="text-text-default text-xsm leading-xsm">
          {`size-limit ${sizeLimitCount}행 중 필터와 일치 ${rows.length}행 — 필터 결과는 부분 집합이며 판정을 다시 계산하지 않습니다`}
        </p>
        <p className="text-text-light text-xsm leading-xsm break-keep">
          baseline delta 는 package·method·압축·조정·entry·import·target·config hash·tool·externals
          가 모두 같을 때만 냅니다 (계약의 <Mono>compareBundle</Mono>).
        </p>
        {other.status === 'error' && <StatusNotice level={3} state={other.view} />}
        {collectorJudgements.length > 0 && (
          <List className="flex flex-col gap-xs text-xsm">
            {collectorJudgements.map((item) => (
              <ListItem key={item.id}>
                <Mono>{item.id}</Mono> {`수집기 판정 (원본 전체): ${observationValueText(item)}`}
              </ListItem>
            ))}
          </List>
        )}
      </Section>

      {rows.length > 0 ? (
        <BudgetSection rows={rows} pending={query.base ? BASELINE_PENDING[other.status] : null} />
      ) : (
        <StatusNotice
          state={
            sizeLimitCount > 0
              ? noMatchState(`package ${query.package}`)
              : unsupportedState({
                  section: 'size-limit budget',
                  runId,
                  profile,
                  collectProfile: 'core',
                  alternatives,
                })
          }
        />
      )}

      <TreeshakeSection
        run={run}
        groups={treeshakeGroups(inPackage)}
        filtered={query.package}
        alternatives={alternatives}
      />
    </>
  );
};

export const BundlesPage = () => {
  const data = useRunData('run', SPEC);
  const summaries = useSummaries(data.runIds);
  useHashFocus(data.run !== null);
  return (
    <Page path="/bundles">
      <RunBar data={data} />
      {data.view && <StatusNotice state={data.view} />}
      {data.loading && !data.view && !data.run && <StatusNotice state={loadingState('실행')} />}
      {data.run && <Bundles run={data.run} data={data} summaries={summaries} />}
    </Page>
  );
};
