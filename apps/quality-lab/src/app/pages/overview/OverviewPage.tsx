import type { Freshness, Observation, RunSummary } from '@berrypjh/observability-contracts';
import { List, ListItem } from '@berrypjh/react-ui';

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { Mono } from '../../components/Mono';
import { RunBar } from '../../components/RunBar';
import { Section } from '../../components/Section';
import { StatusNotice } from '../../components/StatusNotice';
import { observationValueText, shortSha } from '../../data/format';
import {
  DOMAIN_LABEL,
  EXECUTOR_LABEL,
  FRESHNESS_LABEL,
  NOTICE_LABEL,
  OUTCOME_LABEL,
  SOURCE_KIND_LABEL,
  STATE_LABEL,
  VERIFICATION_LABEL,
} from '../../data/labels';
import { failureHref } from '../../data/links';
import { queryString } from '../../data/query';
import {
  loadingState,
  notApplicableState,
  partialState,
  staleState,
  unsupportedState,
} from '../../data/status';
import { runsWith, useRunData, useSummaries } from '../../data/useRunData';
import { Page } from '../../ui';

const SPEC = { keys: ['run'] } as const;
const LINK = 'text-text-link underline underline-offset-2';

const observationText = (observation: Observation) =>
  observation.domain === 'verification'
    ? VERIFICATION_LABEL[observation.status]
    : `${observationValueText(observation)}${observation.outcome ? ` · 판정 ${OUTCOME_LABEL[observation.outcome]}` : ''}`;

const Observations = ({ items }: { items: Observation[] }) =>
  items.length === 0 ? null : (
    <List className="flex flex-col gap-xs text-xsm leading-xsm">
      {items.map((observation) => (
        <ListItem key={observation.id}>
          <Mono>{observation.id}</Mono> — {observationText(observation)}
        </ListItem>
      ))}
    </List>
  );

const Alternatives = ({ path, runs }: { path: string; runs: string[] }) =>
  runs.length === 0 ? null : (
    <List className="flex flex-wrap gap-sm text-xsm">
      {runs.map((id) => (
        <ListItem key={id}>
          <Link className={LINK} to={`${path}${queryString({ run: id })}`}>
            {id}
          </Link>
        </ListItem>
      ))}
    </List>
  );

type CardProps = {
  summary: RunSummary;
  summaries: Parameters<typeof runsWith>[0];
};

/** 영역 카드. 영역이 없으면 0 이 아니라 unsupported 와 그 영역을 가진 run 을 보여준다. */
const Card = ({
  title,
  present,
  missing,
  children,
}: {
  title: string;
  present: boolean;
  missing: ReactNode;
  children: ReactNode;
}) => (
  <Section title={title} card>
    {present ? children : missing}
  </Section>
);

const TestsCard = ({ summary, summaries }: CardProps) => {
  const { runId, profile } = summary.metadata;
  const alternatives = runsWith(summaries, (item) => item.sections.tests > 0);
  return (
    <Card
      title="테스트"
      present={summary.sections.tests > 0}
      missing={
        <StatusNotice
          level={3}
          state={unsupportedState({
            section: '테스트 결과',
            runId,
            profile,
            collectProfile: 'core',
            alternatives,
          })}
        >
          <Alternatives path="/quality/tests" runs={alternatives} />
        </StatusNotice>
      }
    >
      <p className="text-text-default text-sm leading-sm">
        test source {summary.sections.tests}개 · case {summary.sections.testCases}개
      </p>
      <p className="text-text-light text-xxsm">case 수는 runner report 에서 온 값입니다.</p>
      <Observations items={summary.observations.filter((item) => item.domain === 'test')} />
      <Link className={LINK} to={`/quality/tests${queryString({ run: runId })}`}>
        테스트 보기
      </Link>
    </Card>
  );
};

const BundlesCard = ({ summary }: CardProps) => {
  const { runId, profile } = summary.metadata;
  const over = summary.failures.filter((failure) => failure.domain === 'bundle').length;
  return (
    <Card
      title="번들 budget"
      present={summary.sections.bundles > 0}
      missing={
        <StatusNotice
          level={3}
          state={unsupportedState({
            section: '번들 측정',
            runId,
            profile,
            collectProfile: 'core',
            alternatives: [],
          })}
        />
      }
    >
      <p className="text-text-default text-sm leading-sm">
        bundle 측정 {summary.sections.bundles}행 · 원본 판정 budget 초과 {over}행
      </p>
      <Observations items={summary.observations.filter((item) => item.domain === 'bundle')} />
      <Link className={LINK} to={`/bundles${queryString({ run: runId })}`}>
        번들 화면 보기
      </Link>
    </Card>
  );
};

const ContextsCard = ({ summary }: CardProps) => {
  const { runId, profile } = summary.metadata;
  return (
    <Card
      title="컨텍스트"
      present={summary.sections.contexts > 0}
      missing={
        <StatusNotice
          level={3}
          state={unsupportedState({
            section: '컨텍스트 측정',
            runId,
            profile,
            collectProfile: 'core',
            alternatives: [],
          })}
        />
      }
    >
      <p className="text-text-default text-sm leading-sm">
        context 측정 {summary.sections.contexts}행
      </p>
      <Observations items={summary.observations.filter((item) => item.domain === 'context')} />
      <Link
        className={LINK}
        to={`/ai${queryString({
          run: runId,
          panel: summary.sections.evals === 0 ? 'scenario' : undefined,
        })}`}
      >
        컨텍스트 표 보기
      </Link>
    </Card>
  );
};

const EvalsCard = ({ summary }: CardProps) => {
  const { runId, profile } = summary.metadata;
  return (
    <Card
      title="평가"
      present={summary.sections.evals > 0}
      missing={
        <StatusNotice
          level={3}
          state={unsupportedState({
            section: '평가 결과',
            runId,
            profile,
            collectProfile: 'eval --from=tmp/llm-evals/<dir>',
            alternatives: [],
          })}
        />
      }
    >
      <List className="flex flex-col gap-sm text-xsm leading-xsm">
        {summary.evals.map((item) => (
          <ListItem key={item.sourceId}>
            <Mono>{item.sourceId}</Mono> —{' '}
            {item.executorClass ? EXECUTOR_LABEL[item.executorClass] : 'executor 결과 없음'}
            {item.notices.length > 0 && (
              <span className="block text-text-light">
                {item.notices.map((code) => NOTICE_LABEL[code]).join(' · ')}
              </span>
            )}
          </ListItem>
        ))}
      </List>
      <p className="text-text-light text-xxsm">
        성공률은 원본 분자·분모와 함께 AI 평가 화면에서 보여줍니다.
      </p>
      <Link className={LINK} to={`/ai${queryString({ run: runId })}`}>
        AI 평가 보기
      </Link>
    </Card>
  );
};

const RunStatus = ({ summary, freshness }: { summary: RunSummary; freshness: Freshness }) => {
  const { metadata } = summary;
  const rows: [string, ReactNode][] = [
    ['실행', <Mono>{metadata.runId}</Mono>],
    ['profile', metadata.profile],
    ['상태', STATE_LABEL[metadata.state]],
    ['source', <Mono>{shortSha(metadata.source.sha)}</Mono>],
    ['기준 비교', FRESHNESS_LABEL[freshness.status]],
    ['source 종류', SOURCE_KIND_LABEL[metadata.source.kind]],
    [
      '작업 트리',
      metadata.source.dirty === 'unknown'
        ? '모름'
        : metadata.source.dirty
          ? '커밋되지 않은 변경 있음'
          : '깨끗함',
    ],
    ['수집 시작', metadata.collection.startedAt],
  ];
  return (
    <Section title="실행 상태" card>
      <dl className="grid grid-cols-1 sm:grid-cols-[max-content_1fr] gap-x-lg gap-y-xs text-xsm leading-xsm">
        {rows.map(([term, value]) => (
          <div key={term} className="contents">
            <dt className="text-text-light">{term}</dt>
            <dd className="text-text-default m-0 break-all">{value}</dd>
          </div>
        ))}
      </dl>
      {metadata.state !== 'complete' && (
        <StatusNotice level={3} state={partialState(metadata.runId)} />
      )}
      {freshness.status !== 'fresh' && (
        <StatusNotice level={3} state={staleState(freshness, metadata.profile)} />
      )}
    </Section>
  );
};

const Failures = ({ summary }: { summary: RunSummary }) => {
  const withoutValue = summary.observations.filter((item) => item.availability !== 'available');
  return (
    <Section title="최근 실패">
      <p className="text-text-light text-xsm leading-xsm break-keep">
        원본 판정이 fail 인 행만 모았습니다. 실행하지 않았거나 값이 없는 관측 {withoutValue.length}
        개는 실패로 세지 않았습니다.
      </p>
      {summary.failures.length === 0 ? (
        <p className="text-text-default text-xsm">원본 판정이 fail 인 행이 없습니다.</p>
      ) : (
        <List className="flex flex-col gap-sm text-xsm leading-xsm">
          {summary.failures.map((failure, index) => (
            <ListItem key={`${failure.id}-${index}`}>
              <span aria-hidden className="mr-xs">
                ✕
              </span>
              <Link className={LINK} to={failureHref(failure, summary.metadata.runId)}>
                {failure.id}
              </Link>{' '}
              <span className="text-text-light">({DOMAIN_LABEL[failure.domain]})</span> —{' '}
              {failure.reason}
            </ListItem>
          ))}
        </List>
      )}
    </Section>
  );
};

export const OverviewPage = () => {
  const data = useRunData('summary', SPEC);
  const summaries = useSummaries(data.runIds);
  const { summary, freshness } = data;

  return (
    <Page path="/">
      <RunBar data={data} />
      {data.view && <StatusNotice state={data.view} />}
      {data.loading && !data.view && !summary && <StatusNotice state={loadingState('실행 요약')} />}
      {summary && freshness && (
        <>
          <RunStatus summary={summary} freshness={freshness} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            <TestsCard summary={summary} summaries={summaries} />
            <BundlesCard summary={summary} summaries={summaries} />
            <ContextsCard summary={summary} summaries={summaries} />
            <EvalsCard summary={summary} summaries={summaries} />
          </div>
          <Failures summary={summary} />
          <Section title="기준선 비교">
            <StatusNotice
              level={3}
              state={notApplicableState(
                'baseline 기능은 아직 없습니다. 이전 실행과의 차이를 계산하지 않습니다.',
              )}
            />
          </Section>
        </>
      )}
    </Page>
  );
};
