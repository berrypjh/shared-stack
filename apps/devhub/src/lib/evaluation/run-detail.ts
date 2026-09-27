import type { Freshness, RunArtifact } from '@berrypjh/observability-contracts';

import type { Problem, RunResult } from './client';

/** 실행 상세가 그리는 검증된 run 하나와, 불러오기 결과를 글로 바꾸는 규칙. */

export type VerifiedRun = {
  runId: string;
  artifact: RunArtifact;
  partial: boolean;
  freshness: Freshness;
};

export const verifiedRun = (artifact: RunArtifact, freshness: Freshness): VerifiedRun => ({
  runId: artifact.metadata.runId,
  artifact,
  partial: artifact.metadata.state !== 'complete',
  freshness,
});

/** 공개 index 자체가 없거나 비었다 — 오류가 아니라 아직 수집하지 않은 상태다. */
export const isNoData = (result: RunResult | null) =>
  result !== null && result.status === 'missing' && result.target === 'index';

/** 보여 줄 문제. 이미 검증된 run 이 있으면 index 가 사라진 것도 문제로 알린다. */
export const problemOf = (result: RunResult | null, hasRun: boolean): Problem | null => {
  if (result === null || result.status === 'ready') return null;
  return isNoData(result) && !hasRun ? null : result;
};

export const statusText = (loading: boolean, result: RunResult | null) => {
  if (loading) return '실행 기록을 불러오는 중이다';
  if (result === null) return '';
  if (result.status === 'ready') return `${result.value.metadata.runId} 실행을 불러왔다`;
  if (isNoData(result)) return '공개된 실행 기록이 없다';
  if (result.status === 'invalid') return '실행 기록이 계약과 맞지 않는다';
  if (result.status === 'missing') return '선택한 실행 파일이 없다';
  return '실행 기록을 불러오지 못했다';
};
