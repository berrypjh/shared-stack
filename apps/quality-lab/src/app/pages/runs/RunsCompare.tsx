import { useEffect, useState } from 'react';

import {
  compareRuns,
  COMPARISON_ROW_STATUSES,
  type HistoryInput,
  orderHistory,
  type RunArtifact,
  type RunComparison,
  type RunLineage,
  trendOf,
} from '@berrypjh/observability-contracts';

import { Link } from 'react-router-dom';

import { DataTable } from '../../components/DataTable';
import { LabeledSelect } from '../../components/LabeledSelect';
import { Mono } from '../../components/Mono';
import { Section } from '../../components/Section';
import type { BaselinePointerResult, SummaryResult } from '../../data/client';
import {
  COMPARISON_STATE_LABEL,
  deltaText,
  REASON_EFFECT_LABEL,
  reasonsText,
  ROW_STATUS_LABEL,
  trendStatusText,
  valueText,
} from '../../data/comparison';
import { useQualityLab } from '../../data/context';
import { shortSha } from '../../data/format';
import { FRESHNESS_LABEL, STATE_LABEL } from '../../data/labels';
import { type Query, queryString } from '../../data/query';

const LINK = 'text-text-link underline underline-offset-2';
const NOTE = 'text-text-light text-xsm leading-xsm';

type Props = {
  runIds: string[];
  summaries: Record<string, SummaryResult>;
  currentId: string;
  query: Query;
  setQuery: (next: Query) => void;
};

type ComparisonLoad =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'problem'; message: string }
  | { status: 'ready'; value: RunComparison; runs: Record<string, RunArtifact> };

const useBaselinePointer = () => {
  const { client } = useQualityLab();
  const [result, setResult] = useState<BaselinePointerResult | null>(null);
  useEffect(() => {
    let active = true;
    void client.baselinePointer().then((next) => {
      if (active) setResult(next);
    });
    return () => {
      active = false;
    };
  }, [client]);
  return result;
};

/** 기준을 명시했을 때만 두 run 전체를 받는다. 최신 실행을 자동으로 기준 삼지 않는다. */
const useComparison = (currentId: string, baseId: string | undefined): ComparisonLoad => {
  const { client } = useQualityLab();
  const [load, setLoad] = useState<ComparisonLoad>({ status: 'idle' });
  useEffect(() => {
    if (!baseId) {
      setLoad({ status: 'idle' });
      return undefined;
    }
    let active = true;
    setLoad({ status: 'loading' });
    void Promise.all([client.run(currentId), client.run(baseId)]).then(([current, base]) => {
      if (!active) return;
      if (current.status !== 'ready') {
        setLoad({ status: 'problem', message: `${currentId}: ${current.message}` });
      } else if (base.status !== 'ready') {
        setLoad({ status: 'problem', message: `${baseId}: ${base.message}` });
      } else {
        setLoad({
          status: 'ready',
          value: compareRuns(current.value, base.value),
          runs: { [currentId]: current.value, [baseId]: base.value },
        });
      }
    });
    return () => {
      active = false;
    };
  }, [client, currentId, baseId]);
  return load;
};

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
  if (!pointer) return <p className={NOTE}>baseline 포인터를 불러오는 중입니다</p>;
  if (pointer.status === 'missing') {
    return (
      <p className={NOTE}>
        지정된 baseline 포인터가 없습니다 — <Mono>pnpm quality --run-id=&lt;run id&gt;</Mono> 로
        만듭니다.
      </p>
    );
  }
  if (pointer.status !== 'ready') {
    return (
      <p className={NOTE}>
        baseline 포인터 파일을 읽을 수 없습니다 ({pointer.status}) — {pointer.message}
      </p>
    );
  }
  const entry = pointer.value.pointers.find((item) => item.profile === profile);
  if (!entry) {
    return <p className={NOTE}>{profile ?? '이'} profile 에 지정된 baseline 포인터가 없습니다</p>;
  }
  return (
    <p className={NOTE}>
      지정된 baseline 포인터: {entry.runId} ({entry.profile}, {entry.setAt} 지정){' '}
      {entry.runId !== currentId && query.base !== entry.runId && (
        <Link className={LINK} to={`/runs${queryString({ ...query, base: entry.runId })}`}>
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
  const { client } = useQualityLab();
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
          기준 실행을 고르지 않았습니다 — 최신 실행을 자동으로 기준 삼지 않습니다. 기준 실행을
          고르면 두 실행을 비교합니다.
        </p>
      </>
    );
  }
  if (load.status === 'idle' || load.status === 'loading') {
    return <p className={NOTE}>비교할 두 실행을 불러오는 중입니다</p>;
  }
  if (load.status === 'problem') {
    return <p>비교할 실행을 읽지 못해 비교하지 않았습니다 — {load.message}</p>;
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
        <ul aria-label="실행 조건 차이" className="list-disc pl-lg text-xsm leading-xsm">
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
            ? '실행 조건이 비교를 막아 지표를 비교하지 않았습니다.'
            : '두 실행 모두 비교할 지표(bundle·context·eval)가 없습니다.'}
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
        모든 행은 보고 전용입니다 — 통과·실패 기준을 만들지 않습니다. source SHA 차이는 비교하려는
        변화이고, 방법·압축·tokenizer·eval 조건이 다른 행은 차이를 계산하지 않습니다.
      </p>
    </>
  );
};

const historyInputs = (runIds: string[], summaries: Record<string, SummaryResult>) => {
  const inputs: HistoryInput[] = [];
  for (const runId of runIds) {
    const result = summaries[runId];
    if (!result) return null;
    inputs.push(
      result.status === 'ready'
        ? { runId, summary: result.value, problem: null }
        : { runId, summary: null, problem: result.message },
    );
  }
  return inputs;
};

const TrendSection = ({ runIds, summaries, query, setQuery }: Omit<Props, 'currentId'>) => {
  const inputs = historyInputs(runIds, summaries);
  if (!inputs) {
    return (
      <Section title="실행 기록 추세">
        <p className={NOTE}>요약을 불러오는 중입니다</p>
      </Section>
    );
  }
  const entries = orderHistory(inputs);
  const ids = [
    ...new Set(entries.flatMap((entry) => entry.summary?.series?.map((point) => point.id) ?? [])),
  ].sort();
  const trend = query.series ? trendOf(entries, query.series) : null;
  const profileOf = new Map(entries.map((entry) => [entry.runId, entry.summary?.metadata.profile]));
  const shown = trend?.points.filter((point) => point.status !== 'absent') ?? [];

  return (
    <Section title="실행 기록 추세">
      <p className={NOTE}>
        요약만 읽고 수집 시각 순으로 둡니다. 같은 profile·비교 조건의 이웃한 점만 한 구간으로 잇고,
        요약 없음(gap)·측정 안 됨·조건 모름은 구간을 끊습니다.
      </p>
      <LabeledSelect
        label="추세 지표"
        value={query.series ?? ''}
        options={[
          { value: '', label: '(고르지 않음)' },
          ...ids.map((id) => ({ value: id, label: id })),
        ]}
        onChange={(series) => setQuery({ ...query, series: series || undefined })}
      />
      {trend && (
        <>
          <p className={NOTE}>
            구간 {trend.segmentCount}개 · 이 지표가 없는 실행 {trend.points.length - shown.length}
            개는 표에서 뺐습니다
          </p>
          <DataTable
            caption={`추세 — ${trend.id}`}
            headers={['실행', 'profile', '수집 시각', '값', '구간·상태']}
          >
            {shown.map((point) => (
              <tr key={point.runId}>
                <th scope="row">{point.runId}</th>
                <td>{profileOf.get(point.runId) ?? '모름'}</td>
                <td>{point.collectedAt ?? '모름'}</td>
                <td>{trend.unit ? valueText(trend.unit, point.value) : '값 없음'}</td>
                <td>{trendStatusText(point)}</td>
              </tr>
            ))}
          </DataTable>
        </>
      )}
    </Section>
  );
};

/** Level 1 현재 실행 · Level 2 명시한 baseline 비교 · Level 3 실행 기록 추세. */
export const RunsCompare = ({ runIds, summaries, currentId, query, setQuery }: Props) => {
  const pointer = useBaselinePointer();
  const load = useComparison(currentId, query.base);
  const current = summaries[currentId];
  const profile = current?.status === 'ready' ? current.value.metadata.profile : null;
  const runOptions = runIds.map((id) => ({ value: id, label: id }));

  return (
    <>
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
      <TrendSection runIds={runIds} summaries={summaries} query={query} setQuery={setQuery} />
    </>
  );
};
