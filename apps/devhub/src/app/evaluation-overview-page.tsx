import { EvaluationFrame } from '@/components/evaluation/evaluation-frame';
import { BundlesCard, ContextsCard, EvalsCard } from '@/components/evaluation/overview/area-cards';
import { RecentFailures } from '@/components/evaluation/overview/recent-failures';
import { RunStatus } from '@/components/evaluation/overview/run-status';
import { RunBar } from '@/components/evaluation/run-bar';
import { Section } from '@/components/evaluation/section';
import { StatusNotice } from '@/components/evaluation/status-notice';
import { useRunData, useSummaries } from '@/components/evaluation/use-run-data';
import { loadingState, notApplicableState } from '@/lib/evaluation/status';

const SPEC = { keys: ['run'] } as const;

/** 평가 개요: 실행 하나의 영역을 독립 카드로, 최근 실패는 근거 화면으로 잇는다. */
export const EvaluationOverviewPage = () => {
  const data = useRunData('summary', SPEC);
  const summaries = useSummaries(data.runIds);
  const { summary, freshness } = data;

  return (
    <EvaluationFrame screen="overview" data={data}>
      <RunBar data={data} />
      {data.view && <StatusNotice state={data.view} />}
      {data.loading && !data.view && !summary && <StatusNotice state={loadingState('실행 요약')} />}
      {summary && freshness && (
        <>
          <RunStatus summary={summary} freshness={freshness} />
          <div className="grid grid-cols-1 gap-lg md:grid-cols-2">
            <BundlesCard summary={summary} summaries={summaries} />
            <ContextsCard summary={summary} summaries={summaries} />
            <EvalsCard summary={summary} summaries={summaries} />
          </div>
          <RecentFailures summary={summary} />
          <Section title="기준선 비교">
            <StatusNotice
              level={3}
              state={notApplicableState(
                'baseline 기능은 아직 없음. 이전 실행과의 차이를 계산하지 않음.',
              )}
            />
          </Section>
        </>
      )}
    </EvaluationFrame>
  );
};
