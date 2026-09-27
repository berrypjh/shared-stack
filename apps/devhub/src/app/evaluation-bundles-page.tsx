import { BundlesView } from '@/components/evaluation/bundles/bundles-view';
import { EvaluationFrame } from '@/components/evaluation/evaluation-frame';
import { RunBar } from '@/components/evaluation/run-bar';
import { StatusNotice } from '@/components/evaluation/status-notice';
import { useHashFocus } from '@/components/evaluation/use-hash-focus';
import { useRunData, useSummaries } from '@/components/evaluation/use-run-data';
import { BUNDLES_QUERY } from '@/lib/evaluation/bundles';
import { loadingState } from '@/lib/evaluation/status';

/** 번들: size-limit budget · baseline 비교 · tree-shaking 진단. */
export const EvaluationBundlesPage = () => {
  const data = useRunData('run', BUNDLES_QUERY);
  const summaries = useSummaries(data.runIds);
  useHashFocus(data.run !== null);
  return (
    <EvaluationFrame screen="bundles" data={data}>
      <RunBar data={data} />
      {data.view && <StatusNotice state={data.view} />}
      {data.loading && !data.view && !data.run && <StatusNotice state={loadingState('실행')} />}
      {data.run && <BundlesView run={data.run} data={data} summaries={summaries} />}
    </EvaluationFrame>
  );
};
