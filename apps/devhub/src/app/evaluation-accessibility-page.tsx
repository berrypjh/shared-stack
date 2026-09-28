import { AccessibilityView } from '@/components/evaluation/accessibility/accessibility-view';
import { EvaluationFrame } from '@/components/evaluation/evaluation-frame';
import { RunBar } from '@/components/evaluation/run-bar';
import { StatusNotice } from '@/components/evaluation/status-notice';
import { useRunData, useSummaries } from '@/components/evaluation/use-run-data';
import { loadingState } from '@/lib/evaluation/status';

const SPEC = { keys: ['run', 'base', 'target'] } as const;

/** 접근성: DevHub 평가 화면을 axe 로 검사한 결과. */
export const EvaluationAccessibilityPage = () => {
  const data = useRunData('run', SPEC);
  const summaries = useSummaries(data.runIds);
  return (
    <EvaluationFrame screen="accessibility" data={data}>
      <RunBar data={data} />
      {data.view && <StatusNotice state={data.view} />}
      {data.loading && !data.view && !data.run && <StatusNotice state={loadingState('실행')} />}
      {data.run && <AccessibilityView run={data.run} data={data} summaries={summaries} />}
    </EvaluationFrame>
  );
};
