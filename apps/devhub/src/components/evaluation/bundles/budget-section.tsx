import { type Bar, BarChart, DataTable, Mono, StatusLabel } from '@berrypjh/devhub-ui';

import { Section } from '@/components/evaluation/section';
import { TARGET_ROW } from '@/components/evaluation/use-hash-focus';
import {
  byPackage,
  caseLabel,
  sizeLimitConditions,
  type SizeLimitRow,
  valueText,
} from '@/lib/evaluation/bundles';
import { formatBytes, formatInteger, headroomText } from '@/lib/evaluation/format';
import { OUTCOME_LABEL } from '@/lib/evaluation/labels';

import { BaselineText } from './baseline-text';

/** 막대는 case 마다 자기 한도 기준이다. 값이 없으면 gap 막대, 한도가 없으면 막대가 없다. */
const budgetBars = (rows: SizeLimitRow[]): Bar[] =>
  rows.flatMap(({ measurement, bar }): Bar[] => {
    if (bar.kind === 'none') return [];
    if (bar.kind === 'gap') {
      return [
        {
          key: measurement.id,
          label: caseLabel(measurement),
          value: null,
          scale: null,
          text: `N/A — ${bar.reason}`,
        },
      ];
    }
    return [
      {
        key: measurement.id,
        label: caseLabel(measurement),
        value: bar.value,
        scale: Math.max(bar.value, bar.limit),
        marker: bar.limit,
        tone: bar.over ? 'over' : 'default',
        text: `${formatInteger(bar.value)} B / 한도 ${formatInteger(bar.limit)} B · ${headroomText(
          measurement.budget?.headroomBytes ?? null,
        )}`,
      },
    ];
  });

/**
 * 표의 컬럼과 뜻. 뜻은 상세 칸이 보인다(`measures/index.ts`). baseline 비교는 baseline 을 골랐을
 * 때만 생긴다.
 */
export const BUDGET_COLUMNS = [
  { term: 'case', meaning: '.size-limit.cjs 의 항목 이름' },
  { term: 'import', meaning: '항목이 import 한 심볼. * 는 전체' },
  { term: '현재', meaning: 'size-limit 이 잰 크기. 빈 프로젝트 크기를 뺀 값' },
  { term: '한도', meaning: '.size-limit.cjs 에 적은 한도' },
  { term: '여유', meaning: '한도 − 현재. 음수면 초과' },
  { term: '판정', meaning: '수집기가 낸 통과 · 실패' },
  { term: 'baseline 비교', meaning: '고른 baseline 실행과의 차이. 측정 조건이 모두 같을 때만' },
];

const SizeCell = ({ bytes }: { bytes: number | null }) => (
  <td className={bytes === null ? undefined : 'whitespace-nowrap'}>
    {bytes === null ? '한도 없음' : formatBytes(bytes)}
  </td>
);

/** package 하나의 측정 조건 · 한도 차트 · 표. 표의 행은 `#bundle-<id>` 근거 대상이다. */
const BudgetPackage = ({
  name,
  rows,
  pending,
  compare,
}: {
  name: string;
  rows: SizeLimitRow[];
  pending: string | null;
  compare: boolean;
}) => (
  <Section title={name} level={3}>
    <p className="typo-caption-small text-text-light">
      측정 조건 <Mono>{sizeLimitConditions(rows).join(' / ')}</Mono>
    </p>
    <BarChart
      title={`한도 사용 — ${name}`}
      description="막대는 case 마다 자기 한도(세로선) 기준이라 case 사이 길이를 비교하지 않음"
      unit="bytes"
      groups={[{ label: `size-limit — ${name}`, bars: budgetBars(rows) }]}
    />
    <DataTable
      caption={`size-limit budget — ${name}`}
      headers={BUDGET_COLUMNS.map((column) => column.term).filter(
        (term) => compare || term !== 'baseline 비교',
      )}
    >
      {rows.map(({ measurement, baseline }) => (
        <tr
          key={measurement.id}
          id={`bundle-${measurement.id}`}
          tabIndex={-1}
          className={TARGET_ROW}
        >
          <th scope="row">{caseLabel(measurement)}</th>
          <td className="whitespace-nowrap">
            <Mono>{measurement.importSpec}</Mono>
          </td>
          <td className={measurement.value === null ? undefined : 'whitespace-nowrap'}>
            {valueText(measurement)}
          </td>
          <SizeCell bytes={measurement.budget?.limitBytes ?? null} />
          <td className="whitespace-nowrap">
            {headroomText(measurement.budget?.headroomBytes ?? null)}
          </td>
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
          {compare && (
            <td>
              <BaselineText cell={baseline} pending={pending} />
            </td>
          )}
        </tr>
      ))}
    </DataTable>
  </Section>
);

const FloorNote = () => (
  <aside
    role="note"
    aria-label="과거 조사 기록"
    className="flex flex-col gap-xs rounded-md border border-dashed border-stroke-default p-md typo-body-small"
  >
    <span className="typo-caption-small text-text-light">과거 조사 기록</span>
    <span className="break-keep text-text-default">
      <Mono>.size-limit.cjs</Mono> 머리 주석의 floor 설명은 single-symbol case 가 같은 하한에 묶이는
      원인을 과거에 조사한 기록. 현재 HEAD 의 원인을 확정한 측정이 아님.
    </span>
  </aside>
);

/** size-limit budget. package 마다 차트와 표를 두고, 과거 조사 주석은 끝에 한 번 둔다. */
export const BudgetSection = ({
  rows,
  pending,
  compare,
}: {
  rows: SizeLimitRow[];
  pending: string | null;
  /** baseline 실행을 골랐는가. 고르지 않았으면 비교 칸을 두지 않는다. */
  compare: boolean;
}) => (
  <Section title="Budget (size-limit 조정값)" anchor="budget">
    {byPackage(rows, (row) => row.measurement.package).map(([name, items]) => (
      <BudgetPackage key={name} name={name} rows={items} pending={pending} compare={compare} />
    ))}
    <FloorNote />
  </Section>
);
