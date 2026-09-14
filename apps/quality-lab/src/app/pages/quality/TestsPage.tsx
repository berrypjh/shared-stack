import type { RunArtifact, TestSummary } from '@berrypjh/observability-contracts';
import { Button, Chip, List, ListItem, SearchField } from '@berrypjh/react-ui';

import { Link } from 'react-router-dom';

import { DataTable } from '../../components/DataTable';
import { LabeledSelect } from '../../components/LabeledSelect';
import { Mono } from '../../components/Mono';
import { RunBar } from '../../components/RunBar';
import { Section } from '../../components/Section';
import { StatusLabel } from '../../components/StatusLabel';
import { StatusNotice } from '../../components/StatusNotice';
import { countText } from '../../data/format';
import { CASE_STATUS_LABEL, EXECUTION_LABEL, OUTCOME_LABEL, REPORT_LABEL } from '../../data/labels';
import { queryString } from '../../data/query';
import { loadingState, noMatchState, unsupportedState } from '../../data/status';
import { type RunData, runsWith, useRunData, useSummaries } from '../../data/useRunData';
import { Page } from '../../ui';

const STATUSES = ['failed', 'passed', 'skipped', 'todo'] as const;
const SPEC = { keys: ['run', 'package', 'status', 'q'], statuses: STATUSES } as const;
const CASE_LIMIT = 200;
const LINK = 'text-text-link underline underline-offset-2';

const STATUS_CHIPS: { value: string | undefined; label: string }[] = [
  { value: undefined, label: '전체' },
  { value: 'failed', label: '실패' },
  { value: 'passed', label: '통과' },
  { value: 'skipped', label: 'skip' },
  { value: 'todo', label: 'todo' },
];

const SOURCE_HEADERS = [
  'source',
  '실행',
  'cache',
  'report',
  'source 파일 (scan)',
  'report 파일',
  'suite',
  'case (실행)',
  '통과',
  '실패',
  'skip',
  'todo',
  '시도 (재시도)',
  'coverage',
  '결과',
];

const coverageText = (coverage: TestSummary['coverage']) =>
  coverage.status === 'not-measured'
    ? `측정 안 함 — ${coverage.reason}`
    : `lines ${coverage.lines.covered}/${coverage.lines.total} · branches ${coverage.branches.covered}/${coverage.branches.total} (${coverage.provider}, ${coverage.reportPath})`;

const SourceRow = ({ summary }: { summary: TestSummary }) => {
  const { counts, execution, report } = summary;
  return (
    <tr id={`source-${summary.sourceId}`}>
      <th scope="row">
        <Mono>{summary.sourceId}</Mono>
      </th>
      <td>
        {EXECUTION_LABEL[execution.status]}
        {execution.exitCode === null ? '' : ` (exit ${execution.exitCode})`}
      </td>
      <td>{summary.cache}</td>
      <td>
        {REPORT_LABEL[report.status]}
        {report.path && (
          <>
            {' '}
            <Mono>{report.path}</Mono>
          </>
        )}
        {report.reason ? ` — ${report.reason}` : ''}
      </td>
      <td>{countText(counts.sourceFiles)}</td>
      <td>{countText(counts.reportedFiles)}</td>
      <td>{countText(counts.suites)}</td>
      <td>{countText(counts.cases)}</td>
      <td>{countText(counts.passed)}</td>
      <td>{countText(counts.failed)}</td>
      <td>{countText(counts.skipped)}</td>
      <td>{countText(counts.todo)}</td>
      <td>{`${countText(counts.attempts)} (${countText(counts.retriedCases)})`}</td>
      <td>{coverageText(summary.coverage)}</td>
      <td>
        {summary.outcome ? (
          <StatusLabel tone={summary.outcome} label={OUTCOME_LABEL[summary.outcome]} />
        ) : (
          '판정 없음'
        )}{' '}
        — {summary.outcomeReason}
      </td>
    </tr>
  );
};

const Tests = ({
  run,
  data,
  alternatives,
}: {
  run: RunArtifact;
  data: RunData;
  alternatives: string[];
}) => {
  const { query, setQuery } = data;
  const { runId, profile } = run.metadata;

  if (run.tests.length === 0) {
    return (
      <StatusNotice
        state={unsupportedState({
          section: '테스트 결과',
          runId,
          profile,
          collectProfile: 'core',
          alternatives,
        })}
      >
        <List className="flex flex-wrap gap-sm text-xsm">
          {alternatives.map((id) => (
            <ListItem key={id}>
              <Link className={LINK} to={`/quality/tests${queryString({ run: id })}`}>
                {id}
              </Link>
            </ListItem>
          ))}
        </List>
      </StatusNotice>
    );
  }

  const projects = [...new Set(run.tests.map((summary) => summary.project))];
  const sources = query.package
    ? run.tests.filter((summary) => summary.project === query.package)
    : run.tests;
  const total = run.tests.reduce((sum, summary) => sum + summary.cases.length, 0);
  const needle = query.q?.toLowerCase();
  const matched = sources
    .flatMap((summary) => summary.cases)
    .filter(
      (testCase) =>
        (!query.status || testCase.status === query.status) &&
        (!needle ||
          testCase.fullName.toLowerCase().includes(needle) ||
          testCase.file.toLowerCase().includes(needle)),
    );
  const filtered = Boolean(query.package || query.status || query.q);
  const described = [
    query.package && `package ${query.package}`,
    query.status && `상태 ${CASE_STATUS_LABEL[query.status]}`,
    query.q && `검색 "${query.q}"`,
  ]
    .filter(Boolean)
    .join(' · ');
  const patch = (next: typeof query, replace = false) =>
    setQuery({ ...query, ...next }, { replace });

  return (
    <>
      <Section title="필터">
        <div className="flex flex-wrap items-end gap-md">
          <LabeledSelect
            label="패키지"
            value={query.package ?? ''}
            options={[
              { value: '', label: '전체' },
              ...projects.map((project) => ({ value: project, label: project })),
            ]}
            onChange={(value) => patch({ package: value || undefined })}
          />
          <div role="group" aria-label="사례 상태" className="flex flex-wrap gap-xs">
            {STATUS_CHIPS.map((chip) => (
              <Chip
                key={chip.label}
                selected={query.status === chip.value}
                onClick={() => patch({ status: chip.value })}
              >
                {chip.label}
              </Chip>
            ))}
          </div>
          <SearchField
            value={query.q ?? ''}
            onValueChange={(value) => patch({ q: value || undefined }, true)}
            clearable
            clearAriaLabel="검색어 지우기"
            placeholder="사례 이름·파일"
            inputProps={{ 'aria-label': '사례 이름·파일 검색' }}
          />
          <Button
            variant="text"
            size="sm"
            disabled={!filtered}
            onClick={() => setQuery({ run: query.run })}
          >
            필터 초기화
          </Button>
        </div>
        <p className="text-text-light text-xsm leading-xsm">
          필터는 표시만 바꿉니다. source 요약의 count 는 원본 run 전체 값입니다.
        </p>
        <p role="status" aria-live="polite" className="text-text-default text-xsm leading-xsm">
          전체 case {total}개 중 필터와 일치 {matched.length}개
          {matched.length > CASE_LIMIT ? ` — 처음 ${CASE_LIMIT}개만 표시` : ''}
        </p>
        {query.package && (
          <Link
            className={LINK}
            to={`/quality/packages${queryString({ run: runId, package: query.package })}`}
          >
            {`${query.package} 패키지 표면 보기`}
          </Link>
        )}
      </Section>

      {sources.length > 0 && (
        <Section title="source 요약">
          <DataTable caption="test source 요약" headers={SOURCE_HEADERS}>
            {sources.map((summary) => (
              <SourceRow key={summary.sourceId} summary={summary} />
            ))}
          </DataTable>
        </Section>
      )}

      {matched.length === 0 ? (
        <StatusNotice state={noMatchState(described || '없음')} />
      ) : (
        <Section title="case">
          <DataTable
            caption="test case"
            headers={['이름', '파일', '상태', '시도', '시간', 'layer']}
          >
            {matched.slice(0, CASE_LIMIT).map((testCase) => (
              <tr key={testCase.id}>
                <th scope="row">{testCase.fullName}</th>
                <td>
                  <Mono>{testCase.file}</Mono>
                </td>
                <td>
                  <StatusLabel tone={testCase.status} label={CASE_STATUS_LABEL[testCase.status]} />
                </td>
                <td>{countText(testCase.attempts)}</td>
                <td>
                  {testCase.durationMs === null
                    ? '측정 안 됨'
                    : `${testCase.durationMs.toFixed(1)} ms`}
                </td>
                <td>
                  {testCase.layer === 'unknown'
                    ? '모름'
                    : `${testCase.layer} — ${testCase.layerEvidence}`}
                </td>
              </tr>
            ))}
          </DataTable>
        </Section>
      )}
    </>
  );
};

export const TestsPage = () => {
  const data = useRunData('run', SPEC);
  const summaries = useSummaries(data.runIds);
  return (
    <Page path="/quality/tests">
      <RunBar data={data} />
      {data.view && <StatusNotice state={data.view} />}
      {data.loading && !data.view && !data.run && <StatusNotice state={loadingState('실행')} />}
      {data.run && (
        <Tests
          run={data.run}
          data={data}
          alternatives={runsWith(summaries, (summary) => summary.sections.tests > 0)}
        />
      )}
    </Page>
  );
};
