import { DataTable } from '@berrypjh/devhub-ui';
import {
  COMPARISON_ROW_STATUSES,
  type RunArtifact,
  type RunLineage,
} from '@berrypjh/observability-contracts';

import { Link } from 'react-router-dom';

import { LINK } from '@/components/ui/entity-link';
import type { BaselinePointerResult } from '@/lib/evaluation/client';
import {
  COMPARISON_STATE_LABEL,
  deltaText,
  REASON_EFFECT_LABEL,
  reasonsText,
  ROW_STATUS_LABEL,
  valueText,
} from '@/lib/evaluation/comparison';
import { shortSha } from '@/lib/evaluation/format';
import { FRESHNESS_LABEL, STATE_LABEL } from '@/lib/evaluation/labels';
import { type Query, queryString } from '@/lib/evaluation/query';
import { screenPath } from '@/lib/evaluation/screens';

import { useEvaluationClient } from '../evaluation-provider';
import { LabeledSelect } from '../labeled-select';
import { Mono } from '../mono';
import { Section } from '../section';

import { type ComparisonLoad, useBaselinePointer, useComparison } from './use-comparison';

const NOTE = 'typo-body-small text-text-light';

const PointerNotice = ({
  pointer,
  profile,
  currentId,
  query,
}: {
  pointer: BaselinePointerResult | null;
  profile: string | null;
  currentId: string;
  query: Query;
}) => {
  if (!pointer) return <p className={NOTE}>baseline 포인터를 불러오는 중이다</p>;
  if (pointer.status === 'missing') {
    return (
      <p className={NOTE}>
        지정된 baseline 포인터가 없다 — <Mono>pnpm quality --run-id=&lt;run id&gt;</Mono> 로 만든다.
      </p>
    );
  }
  if (pointer.status !== 'ready') {
    return (
      <p className={NOTE}>
        baseline 포인터 파일을 읽을 수 없다 ({pointer.status}) — {pointer.message}
      </p>
    );
  }
  const entry = pointer.value.pointers.find((item) => item.profile === profile);
  if (!entry) {
    return <p className={NOTE}>{profile ?? '이'} profile 에 지정된 baseline 포인터가 없다</p>;
  }
  return (
    <p className={NOTE}>
      지정된 baseline 포인터: {entry.runId} ({entry.profile}, {entry.setAt} 지정){' '}
      {entry.runId !== currentId && query.base !== entry.runId && (
        <Link
          className={LINK}
          to={`${screenPath('runs')}${queryString({ ...query, base: entry.runId })}`}
        >
          포인터 baseline 으로 비교
        </Link>
      )}
    </p>
  );
};

const LineageRow = ({
  label,
  lineage,
  run,
}: {
  label: string;
  lineage: RunLineage;
  run: RunArtifact;
}) => {
  const client = useEvaluationClient();
  return (
    <tr>
      <th scope="row">{label}</th>
      <td>
        <Mono>{lineage.runId}</Mono>
      </td>
      <td>{lineage.profile}</td>
      <td>{STATE_LABEL[lineage.state]}</td>
      <td>
        <Mono>{shortSha(lineage.sourceSha)}</Mono>
        {lineage.sourceDirty === true
          ? ' (dirty)'
          : lineage.sourceDirty === 'unknown'
            ? ' (dirty 모름)'
            : ''}
      </td>
      <td>{FRESHNESS_LABEL[client.freshness(run.metadata).status]}</td>
      <td>{lineage.collectedAt}</td>
    </tr>
  );
};

const ComparisonBody = ({
  load,
  currentId,
  baseId,
}: {
  load: ComparisonLoad;
  currentId: string;
  baseId?: string;
}) => {
  if (!baseId) {
    return (
      <>
        <p>비교 상태: {COMPARISON_STATE_LABEL['no-baseline']}</p>
        <p className={NOTE}>
          기준 실행을 고르지 않았다 — 최신 실행을 자동으로 기준 삼지 않는다. 기준 실행을 고르면 두
          실행을 비교한다.
        </p>
      </>
    );
  }
  if (load.status === 'idle' || load.status === 'loading') {
    return <p className={NOTE}>비교할 두 실행을 불러오는 중이다</p>;
  }
  if (load.status === 'problem') {
    return <p>비교할 실행을 읽지 못해 비교하지 않았다 — {load.message}</p>;
  }
  const { value, runs } = load;
  const { lineage } = value;
  return (
    <>
      <p>비교 상태: {COMPARISON_STATE_LABEL[value.state]}</p>
      <DataTable
        caption="비교하는 두 실행"
        headers={['역할', '실행', 'profile', '상태', 'source', 'source 기준 비교', '수집 시각']}
      >
        <LineageRow label="현재 (current)" lineage={lineage.current} run={runs[currentId]} />
        {lineage.baseline && (
          <LineageRow label="기준 (baseline)" lineage={lineage.baseline} run={runs[baseId]} />
        )}
      </DataTable>
      {value.reasons.length > 0 && (
        <ul aria-label="실행 조건 차이" className="list-disc pl-lg typo-body-small">
          {value.reasons.map((reason) => (
            <li key={reason.key}>
              <Mono>{reason.key}</Mono> — {REASON_EFFECT_LABEL[reason.effect]}: {reason.message}
            </li>
          ))}
        </ul>
      )}
      {value.rows.length === 0 && (
        <p>
          {value.state === 'incompatible'
            ? '실행 조건이 비교를 막아 지표를 비교하지 않았다.'
            : '두 실행 모두 비교할 지표(bundle·context·eval)가 없다.'}
        </p>
      )}
      {value.rows.length > 0 && (
        <>
          <p>
            변화 요약:{' '}
            {COMPARISON_ROW_STATUSES.map(
              (status) => `${ROW_STATUS_LABEL[status]} ${value.counts[status]}`,
            ).join(' · ')}
          </p>
          <DataTable
            caption={`변화 — ${currentId} 대 ${baseId}`}
            headers={['지표', '영역', '기준', '현재', '차이', '상태', '이유']}
          >
            {value.rows.map((row) => (
              <tr key={row.id}>
                <th scope="row">
                  <Mono>{row.id}</Mono>
                </th>
                <td>{row.domain}</td>
                <td>{valueText(row.unit, row.baseline)}</td>
                <td>{valueText(row.unit, row.current)}</td>
                <td>{deltaText(row)}</td>
                <td>{ROW_STATUS_LABEL[row.status]}</td>
                <td>{reasonsText(row.reasons)}</td>
              </tr>
            ))}
          </DataTable>
        </>
      )}
      {value.originalEval.length > 0 && (
        <DataTable
          caption="evaluator 원래 baseline 비교"
          headers={['eval 출처', '읽은 곳', '상태', 'comparable', 'warnings']}
        >
          {value.originalEval.map(({ sourceId, comparison }) => (
            <tr key={sourceId}>
              <th scope="row">{sourceId}</th>
              <td>{comparison.source}</td>
              <td>
                {comparison.status}
                {comparison.reason ? ` — ${comparison.reason}` : ''}
              </td>
              <td>
                {comparison.comparable === null ? '해당 없음' : String(comparison.comparable)}
              </td>
              <td>
                {comparison.warnings.length === 0
                  ? '없음'
                  : comparison.warnings
                      .map(
                        (warning) => `${warning.field}: ${warning.baseline} → ${warning.current}`,
                      )
                      .join(' · ')}
              </td>
            </tr>
          ))}
        </DataTable>
      )}
      <p className={NOTE}>
        모든 행은 보고 전용이다 — 통과·실패 기준을 만들지 않는다. source SHA 차이는 비교하려는
        변화이고, 방법·압축·tokenizer·eval 조건이 다른 행은 차이를 계산하지 않는다.
      </p>
    </>
  );
};

/** Level 1 현재 실행 · Level 2 명시한 baseline 비교. 기준은 주소의 `base` 로만 정한다. */
export const RunComparison = ({
  runIds,
  currentId,
  profile,
  query,
  setQuery,
}: {
  runIds: string[];
  currentId: string;
  /** 현재 실행의 profile. 요약을 읽지 못했으면 null 이다. */
  profile: string | null;
  query: Query;
  setQuery: (next: Query) => void;
}) => {
  const pointer = useBaselinePointer();
  const load = useComparison(currentId, query.base);
  const runOptions = runIds.map((id) => ({ value: id, label: id }));

  return (
    <Section title="실행 비교">
      <div className="flex flex-wrap gap-md">
        <LabeledSelect
          label="현재 실행 (current)"
          value={currentId}
          options={runOptions}
          onChange={(run) => setQuery({ ...query, run })}
        />
        <LabeledSelect
          label="기준 실행 (baseline)"
          value={query.base ?? ''}
          options={[{ value: '', label: '(고르지 않음)' }, ...runOptions]}
          onChange={(base) => setQuery({ ...query, base: base || undefined })}
        />
      </div>
      <PointerNotice pointer={pointer} profile={profile} currentId={currentId} query={query} />
      <ComparisonBody load={load} currentId={currentId} baseId={query.base} />
    </Section>
  );
};
