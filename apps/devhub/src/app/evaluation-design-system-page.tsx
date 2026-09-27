import { DesignSystemView } from '@/components/evaluation/design-system/design-system-view';
import { EvaluationFrame } from '@/components/evaluation/evaluation-frame';
import { RunBar } from '@/components/evaluation/run-bar';
import { StatusNotice } from '@/components/evaluation/status-notice';
import { useHashFocus } from '@/components/evaluation/use-hash-focus';
import { useRunData, useSummaries } from '@/components/evaluation/use-run-data';
import { loadingState } from '@/lib/evaluation/status';

const SPEC = { keys: ['run', 'platform'] } as const;

/** 디자인 시스템: 테마 · 산출물 · state 근거 · component token · 대비 기준. */
export const EvaluationDesignSystemPage = () => {
  const data = useRunData('run', SPEC);
  const summaries = useSummaries(data.runIds);
  useHashFocus(data.run !== null);
  return (
    <EvaluationFrame screen="design-system" data={data}>
      <RunBar data={data} />
      {data.view && <StatusNotice state={data.view} />}
      {data.loading && !data.view && !data.run && <StatusNotice state={loadingState('실행')} />}
      {data.run && <DesignSystemView run={data.run} data={data} summaries={summaries} />}
    </EvaluationFrame>
  );
};
