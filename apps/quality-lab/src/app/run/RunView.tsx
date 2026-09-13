import type {
  BundleMeasurement,
  ContextMeasurement,
  Observation,
  TestSummary,
} from '@berrypjh/observability-contracts';
import { Table, TableScroll } from '@berrypjh/react-ui';

import type { ReactNode } from 'react';

import {
  availabilityLabel,
  bundleRoleLabel,
  countText,
  formatBytes,
  headroomText,
  observationValueText,
} from '../data/format';
import { Mono } from '../ui';

import type { ReadyResult } from './useObservability';

const DOMAIN_LABEL: Record<string, string> = {
  test: '테스트',
  bundle: '번들',
  context: '컨텍스트',
  eval: '평가',
  verification: '검증',
  a11y: '접근성',
  browser: '브라우저',
};

const VERIFICATION_LABEL: Record<string, string> = {
  passed: '통과',
  failed: '실패',
  timeout: '시간 초과',
  'not-run': '실행 안 함',
  unsupported: '지원 안 함',
};

const OUTCOME_LABEL: Record<string, string> = {
  pass: '통과',
  fail: '실패',
  warn: '경고',
  info: '정보',
};
const STATE_LABEL: Record<string, string> = {
  running: '수집 중',
  complete: '완료',
  partial: 'partial — 일부 값 없음',
  failed: '실패',
  cancelled: '취소',
};
const SOURCE_KIND_LABEL: Record<string, string> = { local: '로컬', ci: 'CI', unknown: '모름' };
const FRESHNESS_LABEL: Record<string, string> = {
  fresh: 'fresh',
  stale: 'stale',
  unknown: '비교할 수 없음',
};
const EXECUTION_LABEL: Record<string, string> = {
  completed: '완료',
  failed: '실패 종료',
  timeout: '시간 초과',
  cancelled: '중단',
  imported: 'import',
  'not-run': '실행 안 함',
  unsupported: '지원 안 함',
  unavailable: '실행 불가',
};
const REPORT_LABEL: Record<string, string> = {
  parsed: '읽음',
  missing: '없음',
  corrupt: '깨짐',
  invalid: '형식 오류',
  'not-requested': '요청 안 함',
};
const METHOD_LABEL: Record<string, string> = {
  'size-limit': 'size-limit (빈 프로젝트 상수 차감)',
  'treeshake-esbuild': 'esbuild 단독 번들',
};
const COMPRESSION_LABEL: Record<string, string> = {
  brotli: 'brotli',
  gzip: 'gzip',
  none: '무압축',
};
const SCOPE_LABEL: Record<string, string> = {
  'package-scenario': '패키지 시나리오',
  'variant-initial': 'variant 초기',
  'variant-routed': 'variant routed',
  'agent-input': 'agent 입력',
};

const integer = new Intl.NumberFormat('en-US');
const withReason = (label: string, reason: string | null) =>
  reason ? `${label} — ${reason}` : label;

const Section = ({ id, title, children }: { id: string; title: string; children: ReactNode }) => (
  <section aria-labelledby={id} className="flex flex-col gap-md">
    <h3 id={id} className="text-text-default text-sm leading-sm font-semiBold">
      {title}
    </h3>
    {children}
  </section>
);

const DataTable = ({
  caption,
  headers,
  children,
}: {
  caption: string;
  headers: string[];
  children: ReactNode;
}) => (
  <TableScroll label={`${caption} 표`}>
    <Table>
      <caption>{caption}</caption>
      <thead>
        <tr>
          {headers.map((header) => (
            <th key={header} scope="col">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </Table>
  </TableScroll>
);

const Notices = ({ run }: { run: ReadyResult }) => (
  <>
    {run.partial && (
      <p className="text-text-default text-xsm leading-xsm break-keep">
        partial 실행 — 일부 값이 없습니다. 각 행의 상태와 이유를 확인하세요.
      </p>
    )}
    {run.freshness.status !== 'fresh' && (
      <p className="text-text-default text-xsm leading-xsm break-keep">
        {run.freshness.status === 'stale' ? 'stale' : '기준 비교 불가'} — {run.freshness.reason}
      </p>
    )}
  </>
);

const Summary = ({ run }: { run: ReadyResult }) => {
  const { metadata } = run.artifact;
  const { source, collection } = metadata;
  const rows: [string, ReactNode][] = [
    ['실행 ID', <Mono>{metadata.runId}</Mono>],
    ['profile', metadata.profile],
    ['상태', STATE_LABEL[metadata.state]],
    ['source SHA', <Mono>{source.sha}</Mono>],
    ['source commit 시각', source.time],
    ['source 종류', SOURCE_KIND_LABEL[source.kind]],
    ['CI run ID', source.ciRunId],
    [
      '작업 트리',
      source.dirty === 'unknown' ? '모름' : source.dirty ? '커밋되지 않은 변경 있음' : '깨끗함',
    ],
    ['수집 시작', collection.startedAt],
    ['수집 종료', collection.finishedAt ?? '수집 중'],
    [
      '수집기 SHA',
      collection.sha === source.sha ? 'source 와 같은 checkout' : <Mono>{collection.sha}</Mono>,
    ],
    ['Nx cache', metadata.cache],
    ['기준 SHA 비교', FRESHNESS_LABEL[run.freshness.status]],
  ];
  return (
    <section
      aria-labelledby="run-summary-title"
      className="bg-background-surface border border-stroke-default rounded-md p-lg"
    >
      <h3 id="run-summary-title" className="text-text-default text-sm leading-sm font-semiBold">
        실행 요약
      </h3>
      <dl className="mt-md grid grid-cols-1 sm:grid-cols-[max-content_1fr] gap-x-lg gap-y-xs text-xsm leading-xsm">
        {rows.map(([term, value]) => (
          <div key={term} className="contents">
            <dt className="text-text-light">{term}</dt>
            <dd className="text-text-default m-0 break-all">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

const observationStatus = (observation: Observation) =>
  observation.domain === 'verification'
    ? VERIFICATION_LABEL[observation.status]
    : `${availabilityLabel(observation.availability)}${observation.outcome ? ` · ${OUTCOME_LABEL[observation.outcome]}` : ''}`;

const observationValue = (observation: Observation) => {
  if (observation.domain !== 'verification') return observationValueText(observation);
  if (observation.availability !== 'available')
    return withReason(availabilityLabel(observation.availability), observation.reason);
  return `${VERIFICATION_LABEL[observation.status]}${observation.exitCode === null ? '' : ` (exit ${observation.exitCode})`}`;
};

const ObservationTable = ({ observations }: { observations: Observation[] }) => (
  <DataTable caption="관측 항목" headers={['항목', '영역', '상태', '값·이유']}>
    {observations.map((observation) => (
      <tr key={observation.id}>
        <th scope="row">
          <Mono>{observation.id}</Mono>
        </th>
        <td>{DOMAIN_LABEL[observation.domain]}</td>
        <td>{observationStatus(observation)}</td>
        <td>{observationValue(observation)}</td>
      </tr>
    ))}
  </DataTable>
);

const TestTable = ({ tests }: { tests: TestSummary[] }) => (
  <DataTable
    caption="test 실행"
    headers={[
      'source',
      '실행',
      'report',
      'source 파일',
      'case',
      '통과',
      '실패',
      'skip·todo',
      '결과',
    ]}
  >
    {tests.map((summary) => (
      <tr key={summary.sourceId}>
        <th scope="row">
          <Mono>{summary.sourceId}</Mono>
        </th>
        <td>
          {EXECUTION_LABEL[summary.execution.status]}
          {summary.execution.exitCode === null ? '' : ` (exit ${summary.execution.exitCode})`} ·
          cache {summary.cache}
        </td>
        <td>{withReason(REPORT_LABEL[summary.report.status], summary.report.reason)}</td>
        <td>{countText(summary.counts.sourceFiles)}</td>
        <td>{countText(summary.counts.cases)}</td>
        <td>{countText(summary.counts.passed)}</td>
        <td>{countText(summary.counts.failed)}</td>
        <td>
          {countText(summary.counts.skipped)} · {countText(summary.counts.todo)}
        </td>
        <td>
          {withReason(
            summary.outcome ? OUTCOME_LABEL[summary.outcome] : '판정 없음',
            summary.outcomeReason,
          )}
        </td>
      </tr>
    ))}
  </DataTable>
);

/** 막대는 장식이다 — 같은 정보를 옆 칸의 글이 준다. 값이 없으면 빈 막대다. */
const BudgetBar = ({ value, limit }: { value: number | null; limit: number }) => {
  const ratio = value === null || limit === 0 ? 0 : Math.min(1, value / limit);
  return (
    <div
      aria-hidden
      className="h-[8px] w-[96px] rounded-sm border border-stroke-default bg-background-default overflow-hidden"
    >
      <div
        data-testid="budget-bar-fill"
        className={
          value !== null && value > limit ? 'h-full bg-error-er600' : 'h-full bg-success-su600'
        }
        style={{ width: `${Math.round(ratio * 100)}%` }}
      />
    </div>
  );
};

const BundleTable = ({ bundles }: { bundles: BundleMeasurement[] }) => (
  <DataTable
    caption="bundle 측정"
    headers={['case', '역할', '방법', '압축', '현재', '한도', '여유', '막대']}
  >
    {bundles.map((measurement) => (
      <tr key={measurement.id}>
        <th scope="row">{measurement.caseName}</th>
        <td>{bundleRoleLabel(measurement.role)}</td>
        <td>{METHOD_LABEL[measurement.method]}</td>
        <td>{COMPRESSION_LABEL[measurement.compression]}</td>
        <td>
          {measurement.value === null
            ? withReason(availabilityLabel(measurement.availability), measurement.reason)
            : formatBytes(measurement.value)}
        </td>
        <td>
          {measurement.budget
            ? `${formatBytes(measurement.budget.limitBytes)} (${measurement.budget.limitSource})`
            : '한도 없음'}
        </td>
        <td>
          {measurement.budget
            ? headroomText(measurement.budget.headroomBytes)
            : '해당 없음 (보고 전용)'}
        </td>
        <td>
          {measurement.budget ? (
            <BudgetBar value={measurement.value} limit={measurement.budget.limitBytes} />
          ) : (
            '—'
          )}
        </td>
      </tr>
    ))}
  </DataTable>
);

const ContextTable = ({ contexts }: { contexts: ContextMeasurement[] }) => (
  <DataTable
    caption="context 측정"
    headers={['scope', '대상', 'tokenizer', 'tokens', '파일', '누락 입력']}
  >
    {contexts.map((measurement) => (
      <tr key={measurement.id}>
        <th scope="row">{SCOPE_LABEL[measurement.scope]}</th>
        <td>
          <Mono>{measurement.subject}</Mono>
        </td>
        <td>
          {measurement.provider} · {measurement.tokenModel} ·{' '}
          {measurement.tokenizerVersion ??
            withReason('버전 모름', measurement.tokenizerVersionReason)}
        </td>
        <td>
          {measurement.tokens === null
            ? countText({ value: null, reason: measurement.reason })
            : `${integer.format(measurement.tokens)} tokens`}
        </td>
        <td>{integer.format(measurement.files.length)}</td>
        <td>
          {measurement.missingPaths.length > 0 ? measurement.missingPaths.join(', ') : '없음'}
        </td>
      </tr>
    ))}
  </DataTable>
);

/** 검증된 run 하나. 값이 없는 행도 지우지 않고 상태·이유와 함께 남긴다. */
export const RunView = ({ run }: { run: ReadyResult }) => {
  const { observations, tests, bundles, contexts } = run.artifact;
  return (
    <div className="flex flex-col gap-xl">
      <Notices run={run} />
      <Summary run={run} />
      <Section id="observations-title" title="명령별 관측">
        <ObservationTable observations={observations} />
      </Section>
      {tests.length > 0 && (
        <Section id="tests-title" title="테스트">
          <TestTable tests={tests} />
        </Section>
      )}
      {bundles.length > 0 && (
        <Section id="bundles-title" title="번들 (bytes, KB = 1000 B)">
          <BundleTable bundles={bundles} />
        </Section>
      )}
      {contexts.length > 0 && (
        <Section id="contexts-title" title="컨텍스트 token">
          <ContextTable contexts={contexts} />
        </Section>
      )}
    </div>
  );
};
