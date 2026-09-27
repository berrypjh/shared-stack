import { EvaluationFrame } from '@/components/evaluation/evaluation-frame';
import { PackagesView } from '@/components/evaluation/packages/packages-view';
import { RunBar } from '@/components/evaluation/run-bar';
import { StatusNotice } from '@/components/evaluation/status-notice';
import { runsWith, useRunData, useSummaries } from '@/components/evaluation/use-run-data';
import { PACKAGES_QUERY } from '@/lib/evaluation/packages';
import { loadingState } from '@/lib/evaluation/status';

/** 패키지 표면: 고른 실행 전체에서 선언 · 산출물 · catalog · test 위치를 읽는다. */
export const EvaluationPackagesPage = () => {
  const data = useRunData('run', PACKAGES_QUERY);
  const summaries = useSummaries(data.runIds);
  return (
    <EvaluationFrame screen="packages" data={data}>
      <RunBar data={data} />
      {data.view && <StatusNotice state={data.view} />}
      {data.loading && !data.view && !data.run && <StatusNotice state={loadingState('실행')} />}
      {data.run && (
        <PackagesView
          run={data.run}
          data={data}
          alternatives={runsWith(summaries, (summary) => summary.sections.packageSurfaces > 0)}
        />
      )}
    </EvaluationFrame>
  );
};
