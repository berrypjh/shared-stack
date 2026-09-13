import {
  assessFreshness,
  type Freshness,
  publicIndexSchema,
  publicRunArtifactSchema,
  type RunArtifact,
} from '@berrypjh/observability-contracts';

import { type Fetcher, fetchJson, issuesOf, type Problem } from './client';

export { type Fetcher, OBSERVABILITY_BASE } from './client';

export type LoadTarget = 'index' | 'run';

export type LoadResult =
  | { status: 'empty' }
  | { status: 'missing'; target: LoadTarget; message: string }
  | { status: 'invalid'; target: LoadTarget; message: string }
  | { status: 'unreachable'; message: string }
  | {
      status: 'ready';
      runIds: string[];
      runId: string;
      artifact: RunArtifact;
      partial: boolean;
      freshness: Freshness;
    };

const resultOf = (problem: Problem): LoadResult =>
  problem.status === 'unreachable'
    ? { status: 'unreachable', message: problem.message }
    : {
        status: problem.status,
        target: problem.target === 'index' ? 'index' : 'run',
        message: problem.message,
      };

/**
 * index → 선택한 run 순서로 읽는다. 둘 다 unknown JSON 에서 공개 계약으로 검증하고,
 * 통과한 것만 화면에 올린다. 기본 선택은 index 의 마지막(가장 최근에 export 한) run 이다.
 */
export const loadObservability = async (
  fetcher: Fetcher,
  expectedSha: string,
  runId?: string,
): Promise<LoadResult> => {
  const index = await fetchJson(fetcher, 'index', 'index.json');
  if (!index.ok) return resultOf(index.problem);
  const parsedIndex = publicIndexSchema.safeParse(index.value);
  if (!parsedIndex.success) {
    return { status: 'invalid', target: 'index', message: issuesOf(parsedIndex.error.issues) };
  }

  const { runs } = parsedIndex.data;
  if (runs.length === 0) return { status: 'empty' };
  const selectedId = runId ?? runs[runs.length - 1].id;
  const entry = runs.find((run) => run.id === selectedId);
  if (!entry)
    return { status: 'missing', target: 'run', message: `index 에 ${selectedId} 실행이 없습니다` };

  const run = await fetchJson(fetcher, 'run', entry.path);
  if (!run.ok) return resultOf(run.problem);
  const parsedRun = publicRunArtifactSchema.safeParse(run.value);
  if (!parsedRun.success) {
    return { status: 'invalid', target: 'run', message: issuesOf(parsedRun.error.issues) };
  }

  const artifact = parsedRun.data;
  if (artifact.metadata.runId !== entry.id) {
    return {
      status: 'invalid',
      target: 'run',
      message: `${entry.path} 는 ${entry.id} 가 아니라 ${artifact.metadata.runId} 실행의 결과입니다`,
    };
  }
  return {
    status: 'ready',
    runIds: runs.map((item) => item.id),
    runId: entry.id,
    artifact,
    partial: artifact.metadata.state !== 'complete',
    freshness: assessFreshness(artifact.metadata, expectedSha),
  };
};
