import { EvaluationFrame } from '@/components/evaluation/evaluation-frame';
import { useEvaluationClient } from '@/components/evaluation/evaluation-provider';
import { RunBar } from '@/components/evaluation/run-bar';
import { RunComparison } from '@/components/evaluation/runs/run-comparison';
import { RunDetail } from '@/components/evaluation/runs/run-detail';
import { RunList } from '@/components/evaluation/runs/run-list';
import { RunTrend } from '@/components/evaluation/runs/run-trend';
import { StatusNotice } from '@/components/evaluation/status-notice';
import { useRunData, useSummaries } from '@/components/evaluation/use-run-data';
import { loadingState } from '@/lib/evaluation/status';

const SPEC = { keys: ['run', 'base', 'series'] } as const;

/**
 * 실행 기록: 공개 실행 목록(요약만) · 명시한 baseline 비교 · 실행 기록 추세 · 고른 실행의 상세.
 * run 전체는 고른 실행(과 명시한 기준) 하나만 받는다.
 */
export const EvaluationRunsPage = () => {
  const client = useEvaluationClient();
  const data = useRunData('index', SPEC);
  const summaries = useSummaries(data.runIds);
  const selected = data.selectedRunId;
  const current = selected ? summaries[selected] : undefined;
  /** 오른쪽 칸은 목록이 이미 받은 고른 실행의 요약으로 그린다. */
  const inspected =
    current?.status === 'ready'
      ? { ...data, summary: current.value, freshness: client.freshness(current.value.metadata) }
      : data;

  return (
    <EvaluationFrame screen="runs" data={inspected}>
      <RunBar data={data} />
      {data.view && <StatusNotice state={data.view} />}
      {data.loading && !data.view && data.runIds.length === 0 && (
        <StatusNotice state={loadingState('실행 목록')} />
      )}
      {!data.view && data.runIds.length > 0 && (
        <>
          <RunList runIds={data.runIds} selectedRunId={selected} summaries={summaries} />
          {selected && (
            <RunComparison
              runIds={data.runIds}
              currentId={selected}
              profile={current?.status === 'ready' ? current.value.metadata.profile : null}
              query={data.query}
              setQuery={data.setQuery}
            />
          )}
          <RunTrend
            runIds={data.runIds}
            summaries={summaries}
            query={data.query}
            setQuery={data.setQuery}
          />
          {selected && <RunDetail key={selected} runId={selected} />}
        </>
      )}
    </EvaluationFrame>
  );
};
