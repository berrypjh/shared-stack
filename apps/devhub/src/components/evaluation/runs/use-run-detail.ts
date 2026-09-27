import { useCallback, useEffect, useState } from 'react';

import type { RunResult } from '@/lib/evaluation/client';
import { type VerifiedRun, verifiedRun } from '@/lib/evaluation/run-detail';

import { useEvaluationClient } from '../evaluation-provider';

type DetailState = {
  loading: boolean;
  result: RunResult | null;
  lastReady: VerifiedRun | null;
};

/**
 * 고른 run 전체. 평가 client 로 읽어 index 확인 · 계약 검증 · run id 대조를 client 와 같이 한다.
 * 다시 불러오다 실패해도 마지막으로 검증된 run 은 버리지 않는다 — 실패 결과와 함께 계속 보여 준다.
 */
export const useRunDetail = (runId: string) => {
  const client = useEvaluationClient();
  const [state, setState] = useState<DetailState>({
    loading: true,
    result: null,
    lastReady: null,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true }));
    void client.run(runId).then((result) => {
      if (!active) return;
      setState((current) => ({
        loading: false,
        result,
        lastReady:
          result.status === 'ready'
            ? verifiedRun(result.value, client.freshness(result.value.metadata))
            : current.lastReady,
      }));
    });
    return () => {
      active = false;
    };
  }, [client, runId, attempt]);

  /** client 는 같은 파일을 한 번만 받으므로, 다시 받으려면 캐시를 비운다. */
  const reload = useCallback(() => {
    client.clear();
    setAttempt((count) => count + 1);
  }, [client]);

  return { ...state, reload };
};
