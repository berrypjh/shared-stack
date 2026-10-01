import { BarChart, DataTable, Mono } from '@berrypjh/devhub-ui';
import type { BundleMeasurement, RunArtifact } from '@berrypjh/observability-contracts';

import { Section } from '@/components/evaluation/section';
import { StatusNotice } from '@/components/evaluation/status-notice';
import {
  type GzipBar,
  gzipBars,
  treeshakeConditions,
  type TreeshakeGroup,
  valueText,
} from '@/lib/evaluation/bundles';
import { formatBytes } from '@/lib/evaluation/format';
import { noMatchState, notRunState, unsupportedState } from '@/lib/evaluation/status';

/**
 * 표의 컬럼과 뜻. 뜻은 상세 칸이 보인다(`measures/index.ts`).
 * CLI 의 `vs all` 같은 비율은 만들지 않는다 — 비교는 같은 축의 막대로 한다.
 */
export const TREESHAKE_COLUMNS = [
  { term: 'scenario', meaning: 'single: 심볼 하나 · multi: 여럿 · all-exports: 전부(기준)' },
  { term: 'import', meaning: '가짜 entry 가 import 한 심볼. all-exports 는 *' },
  { term: 'raw', meaning: 'minify 후 byte, 압축 없음' },
  { term: 'gzip', meaning: 'gzip 압축 후 byte' },
];

/** 크기 칸. 숫자는 한 줄로 두고, 값이 없을 때의 이유 글은 칸 안에서 줄을 바꾼다. */
const SizeCell = ({ row }: { row: BundleMeasurement | null }) => (
  <td className={row && row.value !== null ? 'whitespace-nowrap' : undefined}>
    {row ? valueText(row) : '이 압축의 행 없음'}
  </td>
);

const barText = (bar: GzipBar) =>
  bar.value === null ? `N/A — ${bar.reason}` : formatBytes(bar.value);

/**
 * package 하나의 gzip 차트와 scenario 표. all-exports 는 막대 대신 설명의 기준 값이고, raw 와
 * 측정 조건은 표 · 머리 한 줄에서 읽는다.
 */
const TreeshakePackage = ({ group }: { group: TreeshakeGroup }) => {
  const { baseline, max, bars } = gzipBars(group);
  return (
    <Section title={group.package} level={3}>
      <p className="typo-caption-small text-text-light">
        측정 조건 <Mono>{treeshakeConditions(group).join(' / ')}</Mono>
      </p>
      <BarChart
        title={`gzip 크기 — ${group.package}`}
        description={`import 한 심볼만 묶은 esbuild 번들. 기준 all-exports ${
          baseline ? barText(baseline) : '없음'
        } 은 막대에서 빼 축이 이 심볼들의 최댓값임. size-limit 과 method 가 달라 budget 과 비교하지 않음`}
        unit="bytes"
        groups={[
          {
            label: `scenario — ${group.package}`,
            bars: bars.map((bar) => ({
              key: bar.caseName,
              label: bar.caseName,
              value: bar.value,
              scale: max,
              text: barText(bar),
            })),
          },
        ]}
      />
      <DataTable
        caption={`tree-shaking 행 — ${group.package}`}
        headers={TREESHAKE_COLUMNS.map((column) => column.term)}
      >
        {group.scenarios.map((scenario) => (
          <tr key={scenario.caseName}>
            <th scope="row">{scenario.caseName}</th>
            <td>
              <Mono>{scenario.importSpec}</Mono>
            </td>
            <SizeCell row={scenario.raw} />
            <SizeCell row={scenario.gzip} />
          </tr>
        ))}
      </DataTable>
    </Section>
  );
};

/**
 * tree-shaking 진단. 행이 없으면 이유를 가른다 — 필터에 걸림(no-match), 수집기가 실행하지 않음
 * (not-run 관측), 이 profile 에 없음(unsupported).
 */
export const TreeshakeSection = ({
  run,
  groups,
  filtered,
  alternatives,
}: {
  run: RunArtifact;
  groups: TreeshakeGroup[];
  filtered: string | undefined;
  alternatives: string[] | null;
}) => {
  const { runId, profile } = run.metadata;
  const observation = run.observations.find(
    (item) => item.domain === 'bundle' && item.id.startsWith('bundle.treeshake'),
  );
  const hasRows = run.bundles.some((row) => row.method === 'treeshake-esbuild');
  return (
    <Section title="Tree-shaking (esbuild standalone)" anchor="treeshake">
      {groups.length > 0 ? (
        <>
          {groups.map((group) => (
            <TreeshakePackage key={group.package} group={group} />
          ))}
        </>
      ) : hasRows ? (
        <StatusNotice level={3} state={noMatchState(`package ${filtered}`)} />
      ) : observation && observation.availability !== 'available' ? (
        <StatusNotice
          level={3}
          state={notRunState({
            section: 'tree-shaking 측정',
            runId,
            reason: observation.reason,
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
