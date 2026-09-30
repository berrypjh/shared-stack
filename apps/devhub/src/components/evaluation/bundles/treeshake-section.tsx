import { BarChart, DataTable, TermList } from '@berrypjh/devhub-ui';
import type { RunArtifact } from '@berrypjh/observability-contracts';

import { Mono } from '@/components/evaluation/mono';
import { Section } from '@/components/evaluation/section';
import { StatusNotice } from '@/components/evaluation/status-notice';
import {
  groupedBars,
  TREESHAKE_KINDS,
  type TreeshakeGroup,
  valueText,
} from '@/lib/evaluation/bundles';
import { formatBytes } from '@/lib/evaluation/format';
import { noMatchState, notRunState, unsupportedState } from '@/lib/evaluation/status';

const COMPRESSION_TITLE = { none: 'raw (압축 없음)', gzip: 'gzip' } as const;

/** 아래 표의 컬럼. CLI 의 `vs all` 같은 비율은 만들지 않는다 — 비교는 같은 축의 막대로 한다. */
const COLUMNS = [
  { term: 'scenario', meaning: 'single: X · multi: X+Y · all-exports (baseline)' },
  { term: '종류', meaning: 'scenario 이름 앞부분으로 가른 single · multi · all-exports' },
  { term: 'import', meaning: '가짜 entry 가 import 한 심볼. all-exports 는 *' },
  { term: 'raw (none)', meaning: 'minify 후 byte, 압축 없음' },
  { term: 'gzip', meaning: 'gzip 압축 후 byte' },
  {
    term: 'method · target · 조정',
    meaning: 'treeshake-esbuild · esbuild 기본 target · 조정 없음(standalone)',
  },
];

/** package 하나의 raw · gzip 차트 두 개와 scenario 표. 축은 한 압축 안의 최댓값이다. */
const TreeshakePackage = ({ group }: { group: TreeshakeGroup }) => (
  <Section title={group.package} level={3}>
    {(['none', 'gzip'] as const).map((compression) => {
      const { max, bars } = groupedBars(group, compression);
      return (
        <BarChart
          key={compression}
          title={`Tree-shaking — ${group.package} · ${COMPRESSION_TITLE[compression]}`}
          description="esbuild standalone 번들 크기. size-limit 조정값과 method 가 달라 budget 과 비교하지 않고, 축은 이 압축 안의 최댓값"
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
          <div className="flex flex-col gap-xs">
            <p className="typo-caption-small text-text-light">컬럼 읽기</p>
            <TermList items={COLUMNS} label="tree-shaking 컬럼" />
          </div>
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
