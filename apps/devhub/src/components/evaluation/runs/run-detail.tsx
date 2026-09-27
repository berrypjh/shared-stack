import { Button } from '@berrypjh/react-ui';

import { isNoData, problemOf, statusText } from '@/lib/evaluation/run-detail';
import { emptyState, loadErrorState } from '@/lib/evaluation/status';

import { Section } from '../section';
import { StatusNotice } from '../status-notice';
import { useHashFocus } from '../use-hash-focus';

import { RunView } from './run-view';
import { useRunDetail } from './use-run-detail';

/**
 * 고른 실행 하나의 상세. 불러오는 중 · 문제 · 미수집 · 검증된 run 을 각각 다르게 보여 준다.
 * 다른 화면의 `#bundles` 같은 링크는 검증된 run 이 그려진 뒤에 그 section 으로 옮긴다.
 */
export const RunDetail = ({ runId }: { runId: string }) => {
  const { loading, result, lastReady, reload } = useRunDetail(runId);
  const problem = problemOf(result, lastReady !== null);
  useHashFocus(lastReady !== null);

  return (
    <Section title="실행 상세">
      <div aria-busy={loading} className="flex flex-col gap-lg">
        <div className="flex flex-wrap items-center gap-md">
          <Button variant="outlined" size="sm" onClick={reload} disabled={loading}>
            상세 다시 불러오기
          </Button>
          <p role="status" aria-live="polite" className="typo-body-small text-text-light">
            {statusText(loading, result)}
          </p>
        </div>
        {problem && (
          <StatusNotice state={loadErrorState(problem, runId)} level={3}>
            {lastReady && (
              <p className="typo-body-small text-text-default">
                마지막으로 검증된 실행을 계속 보여 준다
              </p>
            )}
          </StatusNotice>
        )}
        {!lastReady && isNoData(result) && <StatusNotice state={emptyState()} level={3} />}
        {lastReady && <RunView run={lastReady} />}
      </div>
    </Section>
  );
};
