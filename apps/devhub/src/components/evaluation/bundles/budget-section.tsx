import { type Bar, BarChart, type BarGroup, DataTable } from '@berrypjh/devhub-ui';

import { Mono } from '@/components/evaluation/mono';
import { Section } from '@/components/evaluation/section';
import { StatusLabel } from '@/components/evaluation/status-label';
import { TARGET_ROW } from '@/components/evaluation/use-hash-focus';
import { byPackage, type SizeLimitRow, valueText } from '@/lib/evaluation/bundles';
import { formatInteger, headroomText } from '@/lib/evaluation/format';
import { OUTCOME_LABEL } from '@/lib/evaluation/labels';

import { BaselineText } from './baseline-text';

/** 막대는 case 마다 자기 한도 기준이다. 값이 없으면 gap 막대, 한도가 없으면 막대가 없다. */
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
          tone: bar.over ? 'over' : 'default',
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
    className="flex flex-col gap-xs rounded-md border border-dashed border-stroke-default p-md typo-body-small"
  >
    <span className="typo-caption-small text-text-light">과거 조사 기록</span>
    <span className="break-keep text-text-default">
      <Mono>.size-limit.cjs</Mono> 머리 주석의 floor 설명은 single-symbol case 가 같은 하한에 묶이는
      원인을 과거에 조사한 기록이다. 현재 HEAD 의 원인을 확정한 측정이 아니다.
    </span>
  </aside>
);

/** size-limit budget 차트와 같은 행의 표. 표의 행은 `#bundle-<id>` 근거 대상이다. */
export const BudgetSection = ({
  rows,
  pending,
}: {
  rows: SizeLimitRow[];
  pending: string | null;
}) => {
  const groups = byPackage(rows, (row) => row.measurement.package);
  const ordered = groups.flatMap(([, items]) => items);
  const compressions = [...new Set(rows.map((row) => row.measurement.compression))].join('·');
  return (
    <Section title="Budget (size-limit 조정값)" anchor="budget">
      <BarChart
        title="Budget 사용 — size-limit 조정값"
        description={`막대는 case 마다 자기 한도(세로선) 기준이라 case 사이 길이를 비교하는 공통 축이 아니다. ${compressions} 압축 · size-limit 빈 프로젝트 차감값`}
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
