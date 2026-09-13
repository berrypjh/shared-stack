import {
  assessFreshness,
  type Freshness,
  publicIndexSchema,
  publicRunArtifactSchema,
  type RunArtifact,
} from '@berrypjh/observability-contracts';

/** Vite 가 `apps/quality-lab/public/observability` 를 서빙하는 경로. */
export const OBSERVABILITY_BASE = '/observability/';

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

export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

type Fetched = { ok: true; value: unknown } | { ok: false; result: LoadResult };

const issuesOf = (issues: readonly { path: PropertyKey[]; message: string }[]) =>
  issues
    .map((issue) => `${issue.path.map(String).join('.') || '(root)'}: ${issue.message}`)
    .join('\n');

/**
 * JSON 으로 요청한다. `accept` 를 주지 않으면 dev 서버가 없는 파일에 index.html 을 200 으로
 * 돌려줄 수 있다 — 그래도 JSON 이 아니면 데이터로 믿지 않는다.
 */
const fetchJson = async (fetcher: Fetcher, target: LoadTarget, path: string): Promise<Fetched> => {
  let response: Response;
  try {
    response = await fetcher(`${OBSERVABILITY_BASE}${path}`, {
      headers: { accept: 'application/json' },
    });
  } catch (error) {
    return {
      ok: false,
      result: {
        status: 'unreachable',
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }
  if (response.status === 404) {
    return { ok: false, result: { status: 'missing', target, message: `${path} 파일이 없습니다` } };
  }
  if (!response.ok) {
    return {
      ok: false,
      result: { status: 'unreachable', message: `${path}: HTTP ${response.status}` },
    };
  }
  try {
    return { ok: true, value: JSON.parse(await response.text()) };
  } catch {
    return {
      ok: false,
      result: { status: 'invalid', target, message: `${path} 은 JSON 이 아닙니다` },
    };
  }
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
  if (!index.ok) return index.result;
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
  if (!run.ok) return run.result;
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
