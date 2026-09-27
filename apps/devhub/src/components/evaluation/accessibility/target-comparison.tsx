import { DataTable } from '@berrypjh/devhub-ui';
import type { AccessibilitySummary, AuditTarget } from '@berrypjh/observability-contracts';

import { compareTarget } from '@/lib/evaluation/accessibility';
import type { Query } from '@/lib/evaluation/query';

import { LabeledSelect } from '../labeled-select';
import { Section } from '../section';
import { StatusNotice } from '../status-notice';
import type { OtherRun } from '../use-run-data';

const signed = (value: number) => (value > 0 ? `+${value}` : String(value));

/** 명시한 baseline 실행과 고른 대상의 rule 별 위반 node 비교. 조건이 다르면 이유만 쓴다. */
export const TargetComparison = ({
  summary,
  target,
  query,
  setQuery,
  runIds,
  runId,
  other,
}: {
  summary: AccessibilitySummary;
  target: AuditTarget;
  query: Query;
  setQuery: (next: Query) => void;
  runIds: string[];
  runId: string;
  other: OtherRun;
}) => {
  const baseline = other.status === 'ready' ? other.run.accessibility : null;
  const comparison = compareTarget(summary, target.id, baseline);
  return (
    <Section title="baseline 비교" level={3}>
      <p className="typo-body-small break-keep text-text-light">
        같은 출처·axe-core 버전·WCAG tag·켠 rule·검사 범위이고 두 실행 모두 이 대상을 검사했을 때만
        rule 별 위반 node 수를 비교한다.
      </p>
      <LabeledSelect
        label="baseline 실행"
        value={query.base ?? ''}
        options={[
          { value: '', label: '없음' },
          ...runIds.filter((id) => id !== runId).map((id) => ({ value: id, label: id })),
        ]}
        onChange={(value) => setQuery({ ...query, base: value || undefined })}
      />
      {other.status === 'loading' && (
        <p className="typo-body-small text-text-light">baseline 실행을 불러오는 중이다</p>
      )}
      {other.status === 'error' && <StatusNotice level={3} state={other.view} />}
      {other.status !== 'loading' && comparison.status === 'no-baseline' && (
        <p className="typo-body-small text-text-light">baseline 실행을 고르지 않았다</p>
      )}
      {comparison.status === 'not-comparable' && (
        <p className="typo-body-small text-text-default">{`비교 불가 — ${comparison.reasons.join(', ')}`}</p>
      )}
      {comparison.status === 'compared' && (
        <DataTable
          caption={`같은 조건 비교 — ${target.label}`}
          headers={['rule', '현재 node', 'baseline node', '차이']}
        >
          {comparison.rules.map((rule) => (
            <tr key={rule.id}>
              <th scope="row">{rule.id}</th>
              <td>{rule.current}</td>
              <td>{rule.base}</td>
              <td>{signed(rule.delta)}</td>
            </tr>
          ))}
        </DataTable>
      )}
    </Section>
  );
};
