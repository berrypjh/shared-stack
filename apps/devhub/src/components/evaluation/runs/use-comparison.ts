import { useEffect, useState } from 'react';

import {
  compareRuns,
  type RunArtifact,
  type RunComparison,
} from '@berrypjh/observability-contracts';

import type { BaselinePointerResult } from '@/lib/evaluation/client';

import { useEvaluationClient } from '../evaluation-provider';

export type ComparisonLoad =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'problem'; message: string }
  | { status: 'ready'; value: RunComparison; runs: Record<string, RunArtifact> };

/** baseline 포인터 파일. 보여 주기만 하고 비교 기준으로 쓰지 않는다. */
export const useBaselinePointer = () => {
  const client = useEvaluationClient();
  const [result, setResult] = useState<BaselinePointerResult | null>(null);
  useEffect(() => {
    let active = true;
    void client.baselinePointer().then((next) => {
      if (active) setResult(next);
    });
    return () => {
      active = false;
    };
  }, [client]);
  return result;
};

const pairOf = (currentId: string, baseId: string) => `${currentId}\n${baseId}`;

/**
 * 기준을 명시했을 때만 두 run 전체를 받는다. 최신 실행을 자동으로 기준 삼지 않는다.
 * 결과에는 그 비교의 두 id 를 붙인다 — id 가 바뀐 첫 렌더는 effect 전이라 이전 결과가 남아 있는데,
 * 그것을 새 id 의 비교로 읽지 않고 불러오는 중으로 본다.
 */
export const useComparison = (currentId: string, baseId: string | undefined): ComparisonLoad => {
  const client = useEvaluationClient();
  const [result, setResult] = useState<{ pair: string; load: ComparisonLoad } | null>(null);
  useEffect(() => {
    if (!baseId) return undefined;
    const pair = pairOf(currentId, baseId);
    const setLoad = (load: ComparisonLoad) => setResult({ pair, load });
    let active = true;
    void Promise.all([client.run(currentId), client.run(baseId)]).then(([current, base]) => {
      if (!active) return;
      if (current.status !== 'ready') {
        setLoad({ status: 'problem', message: `${currentId}: ${current.message}` });
      } else if (base.status !== 'ready') {
        setLoad({ status: 'problem', message: `${baseId}: ${base.message}` });
      } else {
        setLoad({
          status: 'ready',
          value: compareRuns(current.value, base.value),
          runs: { [currentId]: current.value, [baseId]: base.value },
        });
      }
    });
    return () => {
      active = false;
    };
  }, [client, currentId, baseId]);
  if (!baseId) return { status: 'idle' };
  return result?.pair === pairOf(currentId, baseId) ? result.load : { status: 'loading' };
};
