import { useCallback, useEffect, useState } from 'react';

import { type Fetcher, loadObservability, type LoadResult } from '../data/loadObservability';

export type ReadyResult = Extract<LoadResult, { status: 'ready' }>;

type ObservabilityState = {
  loading: boolean;
  result: LoadResult | null;
  lastReady: ReadyResult | null;
};

/**
 * 불러올 때마다 공개 계약으로 새로 검증한다. 다시 불러오다 실패해도 마지막으로 검증된 run 은
 * 버리지 않는다 — 실패 결과와 함께 계속 보여준다.
 */
export const useObservability = (fetcher: Fetcher, expectedSha: string) => {
  const [state, setState] = useState<ObservabilityState>({
    loading: true,
    result: null,
    lastReady: null,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true }));
    void loadObservability(fetcher, expectedSha).then((result) => {
      if (!active) return;
      setState((current) => ({
        loading: false,
        result,
        lastReady: result.status === 'ready' ? result : current.lastReady,
      }));
    });
    return () => {
      active = false;
    };
  }, [fetcher, expectedSha, attempt]);

  const reload = useCallback(() => setAttempt((count) => count + 1), []);
  return { ...state, reload };
};
