import type { RunSummary } from '@berrypjh/observability-contracts';
import { List, ListItem } from '@berrypjh/react-ui';

import { Link } from 'react-router-dom';

import { AlternativeRuns } from '@/components/evaluation/alternative-runs';
import { Mono } from '@/components/evaluation/mono';
import { StatusNotice } from '@/components/evaluation/status-notice';
import { runsWith } from '@/components/evaluation/use-run-data';
import { LINK } from '@/components/ui/entity-link';
import type { SummaryResult } from '@/lib/evaluation/client';
import { EXECUTOR_LABEL, NOTICE_LABEL } from '@/lib/evaluation/labels';
import { queryString } from '@/lib/evaluation/query';
import { type ScreenId, screenPath } from '@/lib/evaluation/screens';
import { unsupportedState } from '@/lib/evaluation/status';

import { AreaCard, Observations } from './area-card';

type CardProps = {
  summary: RunSummary;
  summaries: Record<string, SummaryResult>;
};

/** 이 실행에 없는 영역의 안내. 그 영역이 있는 실행은 요약으로 확인한 것만 말하고 링크한다. */
const Missing = ({
  summary,
  summaries,
  section,
  collectProfile,
  has,
  screen,
  panel,
}: CardProps & {
  section: string;
  collectProfile: string;
  has: (item: RunSummary) => boolean;
  screen: ScreenId;
  panel?: string;
}) => {
  const { runId, profile } = summary.metadata;
  const alternatives = runsWith(summaries, has);
  return (
    <StatusNotice
      level={3}
      state={unsupportedState({ section, runId, profile, collectProfile, alternatives })}
    >
      <AlternativeRuns screen={screen} runs={alternatives} panel={panel} />
    </StatusNotice>
  );
};

export const BundlesCard = ({ summary, summaries }: CardProps) => {
  const over = summary.failures.filter((failure) => failure.domain === 'bundle').length;
  return (
    <AreaCard
      title="번들 budget"
      present={summary.sections.bundles > 0}
      missing={
        <Missing
          summary={summary}
          summaries={summaries}
          section="번들 측정"
          collectProfile="core"
          has={(item) => item.sections.bundles > 0}
          screen="bundles"
        />
      }
    >
      <p className="typo-body-small text-text-default">
        bundle 측정 {summary.sections.bundles}행 · 원본 판정 budget 초과 {over}행
      </p>
      <Observations items={summary.observations.filter((item) => item.domain === 'bundle')} />
      <Link
        className={LINK}
        to={`${screenPath('bundles')}${queryString({ run: summary.metadata.runId })}`}
      >
        번들 화면 보기
      </Link>
    </AreaCard>
  );
};

export const ContextsCard = ({ summary, summaries }: CardProps) => (
  <AreaCard
    title="컨텍스트"
    present={summary.sections.contexts > 0}
    missing={
      <Missing
        summary={summary}
        summaries={summaries}
        section="컨텍스트 측정"
        collectProfile="core"
        has={(item) => item.sections.contexts > 0}
        screen="ai"
        panel="scenario"
      />
    }
  >
    <p className="typo-body-small text-text-default">context 측정 {summary.sections.contexts}행</p>
    <Observations items={summary.observations.filter((item) => item.domain === 'context')} />
    <Link
      className={LINK}
      to={`${screenPath('ai')}${queryString({
        run: summary.metadata.runId,
        panel: summary.sections.evals === 0 ? 'scenario' : undefined,
      })}`}
    >
      컨텍스트 표 보기
    </Link>
  </AreaCard>
);

export const EvalsCard = ({ summary, summaries }: CardProps) => (
  <AreaCard
    title="평가"
    present={summary.sections.evals > 0}
    missing={
      <Missing
        summary={summary}
        summaries={summaries}
        section="평가 결과"
        collectProfile="eval"
        has={(item) => item.sections.evals > 0}
        screen="ai"
      />
    }
  >
    <List className="flex flex-col gap-sm typo-body-small">
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
    <p className="typo-caption-small text-text-light">
      성공률은 원본 분자·분모와 함께 AI 평가 화면에서 보여 준다.
    </p>
    <Link
      className={LINK}
      to={`${screenPath('ai')}${queryString({ run: summary.metadata.runId })}`}
    >
      AI 평가 보기
    </Link>
  </AreaCard>
);
