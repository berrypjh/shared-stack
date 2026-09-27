import { AccessibilityView } from '@/components/evaluation/accessibility/accessibility-view';
import { EvaluationFrame } from '@/components/evaluation/evaluation-frame';
import { RunBar } from '@/components/evaluation/run-bar';
import { StatusNotice } from '@/components/evaluation/status-notice';
import { useRunData, useSummaries } from '@/components/evaluation/use-run-data';
import { PANELS } from '@/lib/evaluation/accessibility';
import { loadingState } from '@/lib/evaluation/status';

const SPEC = { keys: ['run', 'panel', 'base', 'target'], panels: PANELS } as const;

/** 접근성: 출처별 Static/Test Results · Runtime Audit 와 따로 둔 수동 확인. */
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
