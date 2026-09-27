import { DataTable } from '@berrypjh/devhub-ui';
import type { AccessibilitySummary, AuditTarget } from '@berrypjh/observability-contracts';

import {
  SOURCE_SCOPE_LABEL,
  TARGET_STATUS_LABEL,
  TARGET_TONE,
  unscannedState,
} from '@/lib/evaluation/accessibility';
import type { Query } from '@/lib/evaluation/query';

import { LabeledSelect } from '../labeled-select';
import { Mono } from '../mono';
import { Section } from '../section';
import { StatusLabel } from '../status-label';
import { StatusNotice } from '../status-notice';
import type { OtherRun } from '../use-run-data';

import { ScannedTarget } from './scanned-target';
import { TargetComparison } from './target-comparison';

const countText = (value: number | undefined) => (value === undefined ? '없음' : String(value));

const TARGET_HEADERS = [
  '대상',
  '상태',
  '위반 rule',
  '위반 node',
  'incomplete rule',
  'incomplete node',
  'inapplicable rule',
  'pass rule',
  '이유',
];

const TargetTable = ({ caption, targets }: { caption: string; targets: AuditTarget[] }) => (
  <DataTable caption={caption} headers={TARGET_HEADERS}>
    {targets.map((target) => (
      <tr key={target.id}>
        <th scope="row">
          {target.label}
          <span className="block">
            <Mono>{target.id}</Mono>
          </span>
        </th>
        <td>
          <StatusLabel
            tone={TARGET_TONE[target.status]}
            label={TARGET_STATUS_LABEL[target.status]}
          />
        </td>
        <td>{countText(target.counts?.violationRules)}</td>
        <td>{countText(target.counts?.violationNodes)}</td>
        <td>{countText(target.counts?.incompleteRules)}</td>
        <td>{countText(target.counts?.incompleteNodes)}</td>
        <td>{countText(target.counts?.inapplicableRules)}</td>
        <td>{countText(target.counts?.passRules)}</td>
        <td>
          {target.reason ? `${TARGET_STATUS_LABEL[target.status]}: ${target.reason}` : '없음'}
        </td>
      </tr>
    ))}
  </DataTable>
);

/** axe 가 검사한 출처. 대상 표 → 고른 대상의 impact 막대·rule 표 → 같은 조건일 때만 비교. */
export const AxeSummary = ({
  summary,
  query,
  setQuery,
  runIds,
  runId,
  other,
}: {
  summary: AccessibilitySummary;
  query: Query;
  setQuery: (next: Query) => void;
  runIds: string[];
  runId: string;
  other: OtherRun;
}) => {
  const selected =
    summary.targets.find((target) => target.id === query.target) ??
    summary.targets.find((target) => target.status === 'scanned') ??
    summary.targets[0] ??
    null;

  return (
    <>
      {summary.targets.length > 0 && (
        <TargetTable
          caption={`${SOURCE_SCOPE_LABEL[summary.sourceScope]} 검사 대상`}
          targets={summary.targets}
        />
      )}
      {selected && (
        <Section title="고른 대상" level={3}>
          <LabeledSelect
            label="검사 대상"
            value={selected.id}
            options={summary.targets.map((target) => ({
              value: target.id,
              label: `${target.label} (${TARGET_STATUS_LABEL[target.status]})`,
            }))}
            onChange={(value) => setQuery({ ...query, target: value })}
          />
          {selected.status === 'scanned' ? (
            <ScannedTarget target={selected} />
          ) : (
            <StatusNotice level={3} state={unscannedState(selected)} />
          )}
          <TargetComparison
            summary={summary}
            target={selected}
            query={query}
            setQuery={setQuery}
            runIds={runIds}
            runId={runId}
            other={other}
          />
        </Section>
      )}
    </>
  );
};
