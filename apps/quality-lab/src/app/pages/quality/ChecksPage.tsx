import type { Observation, RunSummary } from '@berrypjh/observability-contracts';
import { Chip, List, ListItem } from '@berrypjh/react-ui';

import { Link } from 'react-router-dom';

import { DataTable } from '../../components/DataTable';
import { EvidenceList } from '../../components/Evidence';
import { LabeledSelect } from '../../components/LabeledSelect';
import { Mono } from '../../components/Mono';
import { RunBar } from '../../components/RunBar';
import { Section } from '../../components/Section';
import { StatusLabel } from '../../components/StatusLabel';
import { StatusNotice } from '../../components/StatusNotice';
import { availabilityLabel, observationValueText } from '../../data/format';
import { CHECK_KIND_LABEL, VERIFICATION_LABEL } from '../../data/labels';
import { queryString } from '../../data/query';
import { loadingState, noMatchState, unsupportedState } from '../../data/status';
import { type RunData, runsWith, useRunData, useSummaries } from '../../data/useRunData';
import { Page } from '../../ui';

const STATUSES = ['passed', 'failed', 'not-run', 'unsupported', 'timeout'] as const;
const SPEC = { keys: ['run', 'package', 'status'], statuses: STATUSES } as const;
const LINK = 'text-text-link underline underline-offset-2';
const TOOLS_ID = 'test.tools';

const STATUS_CHIPS: { value: string | undefined; label: string }[] = [
  { value: undefined, label: '전체' },
  ...STATUSES.map((status) => ({ value: status, label: VERIFICATION_LABEL[status] })),
];

type CheckRow = { observation: Observation; kind: string; status: string };

/** metric 인 tools 결과는 판정이 있을 때만 통과·실패다. 판정이 없으면 원본 availability 를 쓴다. */
const metricStatus = (observation: Observation) => {
  if (observation.availability !== 'available') return observation.availability;
  if (observation.outcome === 'pass') return 'passed';
  if (observation.outcome === 'fail') return 'failed';
  return 'no-outcome';
};

export const checkRows = (summary: RunSummary): CheckRow[] =>
  summary.observations.flatMap((observation): CheckRow[] => {
    if (observation.domain === 'verification') {
      return [
        { observation, kind: CHECK_KIND_LABEL[observation.kind], status: observation.status },
      ];
    }
    return observation.id === TOOLS_ID
      ? [{ observation, kind: 'Tools — pnpm tools:check', status: metricStatus(observation) }]
      : [];
  });

const statusText = (status: string) =>
  VERIFICATION_LABEL[status] ?? (status === 'no-outcome' ? '판정 없음' : availabilityLabel(status));

const Checks = ({
  summary,
  data,
  alternatives,
}: {
  summary: RunSummary;
  data: RunData;
  alternatives: string[];
}) => {
  const { query, setQuery } = data;
  const { runId, profile } = summary.metadata;
  const rows = checkRows(summary);

  if (rows.length === 0) {
    return (
      <StatusNotice
        state={unsupportedState({
          section: '검증 결과',
          runId,
          profile,
          collectProfile: 'core',
          alternatives,
        })}
      >
        <List className="flex flex-wrap gap-sm text-xsm">
          {alternatives.map((id) => (
            <ListItem key={id}>
              <Link className={LINK} to={`/quality/checks${queryString({ run: id })}`}>
                {id}
              </Link>
            </ListItem>
          ))}
        </List>
      </StatusNotice>
    );
  }

  const scopes = [...new Set(rows.map((row) => row.observation.scope))];
  const matched = rows.filter(
    (row) =>
      (!query.package || row.observation.scope === query.package) &&
      (!query.status || row.status === query.status),
  );

  return (
    <>
      <Section title="필터">
        <div className="flex flex-wrap items-end gap-md">
          <LabeledSelect
            label="패키지"
            value={query.package ?? ''}
            options={[
              { value: '', label: '전체' },
              ...scopes.map((scope) => ({ value: scope, label: scope })),
            ]}
            onChange={(value) => setQuery({ ...query, package: value || undefined })}
          />
          <div role="group" aria-label="검증 상태" className="flex flex-wrap gap-xs">
            {STATUS_CHIPS.map((chip) => (
              <Chip
                key={chip.label}
                selected={query.status === chip.value}
                onClick={() => setQuery({ ...query, status: chip.value })}
              >
                {chip.label}
              </Chip>
            ))}
          </div>
        </div>
        <p role="status" aria-live="polite" className="text-text-default text-xsm leading-xsm">
          {`검증 ${rows.length}개 중 필터와 일치 ${matched.length}개`}
        </p>
      </Section>

      {matched.length === 0 ? (
        <StatusNotice
          state={noMatchState(
            [
              query.package && `package ${query.package}`,
              query.status && `상태 ${statusText(query.status)}`,
            ]
              .filter(Boolean)
              .join(' · ') || '없음',
          )}
        />
      ) : (
        <Section title="검증 결과">
          <DataTable
            caption="검증 결과"
            headers={['검증', '종류', '대상', '상태', 'exit', '시간', '이유·근거']}
          >
            {matched.map(({ observation, kind, status }) => (
              <tr key={observation.id} id={`check-${observation.id}`}>
                <th scope="row">
                  <Mono>{observation.id}</Mono>
                </th>
                <td>{kind}</td>
                <td>
                  <Mono>{observation.scope}</Mono>
                </td>
                <td>
                  <StatusLabel tone={status} label={statusText(status)} />
                </td>
                <td>
                  {observation.domain !== 'verification'
                    ? '해당 없음 (지표)'
                    : observation.exitCode === null
                      ? 'exit 없음'
                      : `exit ${observation.exitCode}`}
                </td>
                <td>
                  {observation.domain !== 'verification'
                    ? '해당 없음 (지표)'
                    : observation.durationMs === null
                      ? '측정 안 됨'
                      : `${observation.durationMs} ms`}
                </td>
                <td>
                  {observation.availability !== 'available' ? (
                    <p className="m-0">{`${availabilityLabel(observation.availability)} — ${observation.reason}`}</p>
                  ) : observation.domain !== 'verification' ? (
                    <p className="m-0">{observationValueText(observation)}</p>
                  ) : null}
                  <EvidenceList evidence={observation.evidence} />
                </td>
              </tr>
            ))}
          </DataTable>
        </Section>
      )}
    </>
  );
};

export const ChecksPage = () => {
  const data = useRunData('summary', SPEC);
  const summaries = useSummaries(data.runIds);
  return (
    <Page path="/quality/checks">
      <RunBar data={data} />
      {data.view && <StatusNotice state={data.view} />}
      {data.loading && !data.view && !data.summary && (
        <StatusNotice state={loadingState('실행 요약')} />
      )}
      {data.summary && (
        <Checks
          summary={data.summary}
          data={data}
          alternatives={runsWith(summaries, (summary) => checkRows(summary).length > 0)}
        />
      )}
    </Page>
  );
};
