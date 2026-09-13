import type { Fetcher } from '../data/loadObservability';
import { EmptyRuns, Mono } from '../ui';

import { isNoData, LoadProblem, problemOf, statusText } from './RunPanel';
import { useObservability } from './useObservability';

/** 공개 index 의 run 목록. 값은 개요 화면이 보여주고, 여기서는 무엇이 export 됐는지만 말한다. */
export const RunList = ({ fetcher, expectedSha }: { fetcher: Fetcher; expectedSha: string }) => {
  const { loading, result, lastReady } = useObservability(fetcher, expectedSha);
  const problem = problemOf(result, lastReady !== null);

  return (
    <section aria-labelledby="run-list-title" aria-busy={loading} className="flex flex-col gap-lg">
      <h2 id="run-list-title" className="text-text-default text-lg leading-lg font-semiBold">
        공개된 실행
      </h2>
      <p role="status" aria-live="polite" className="text-text-light text-xsm leading-xsm">
        {statusText(loading, result)}
      </p>
      {problem && <LoadProblem problem={problem} keptRun={lastReady !== null} />}
      {!lastReady && isNoData(result) && <EmptyRuns />}
      {lastReady && (
        <ol className="flex flex-col gap-xs text-xsm leading-xsm text-text-default">
          {lastReady.runIds.map((id) => (
            <li key={id}>
              <Mono>{id}</Mono>
              {id === lastReady.runId ? ' — 개요에 표시 중' : ''}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};
