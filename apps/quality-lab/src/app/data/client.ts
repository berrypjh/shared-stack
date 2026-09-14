import {
  assessFreshness,
  type BaselinePointer,
  baselinePointerSchema,
  type Freshness,
  publicIndexSchema,
  publicRunArtifactSchema,
  type PublicRunIndex,
  type RunArtifact,
  type RunMetadata,
  type RunSummary,
  runSummarySchema,
  summarizeRun,
} from '@berrypjh/observability-contracts';

/**
 * 공개 JSON 읽기. index → run 요약 → 필요한 run detail 순서로, 필요한 파일만 받는다.
 * 모든 응답은 계약으로 검증하고, 같은 파일은 한 세션에서 한 번만 받는다.
 */

/** Vite 가 `apps/quality-lab/public/observability` 를 서빙하는 경로. */
export const OBSERVABILITY_BASE = '/observability/';

export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;
export type LoadTarget = 'index' | 'summary' | 'run' | 'baseline';

export type Problem = {
  status: 'missing' | 'invalid' | 'unreachable';
  target: LoadTarget;
  message: string;
};

export type IndexResult =
  | { status: 'ready'; value: PublicRunIndex }
  | { status: 'empty' }
  | Problem;
export type SummaryResult =
  | { status: 'ready'; source: 'summary' | 'run'; value: RunSummary }
  | Problem;
export type RunResult = { status: 'ready'; value: RunArtifact } | Problem;
export type BaselinePointerResult = { status: 'ready'; value: BaselinePointer } | Problem;

type Fetched = { ok: true; value: unknown } | { ok: false; problem: Problem };

export const issuesOf = (issues: readonly { path: PropertyKey[]; message: string }[]) =>
  issues
    .map((issue) => `${issue.path.map(String).join('.') || '(root)'}: ${issue.message}`)
    .join('\n');

/**
 * JSON 으로 요청한다. dev 서버는 없는 파일에 index.html 을 200 으로 돌려줄 수 있다 —
 * JSON 이 아니면 데이터로 믿지 않는다.
 */
export const fetchJson = async (
  fetcher: Fetcher,
  target: LoadTarget,
  path: string,
): Promise<Fetched> => {
  let response: Response;
  try {
    response = await fetcher(`${OBSERVABILITY_BASE}${path}`, {
      headers: { accept: 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, problem: { status: 'unreachable', target, message } };
  }
  if (response.status === 404) {
    return {
      ok: false,
      problem: { status: 'missing', target, message: `${path} 파일이 없습니다` },
    };
  }
  if (!response.ok) {
    return {
      ok: false,
      problem: { status: 'unreachable', target, message: `${path}: HTTP ${response.status}` },
    };
  }
  try {
    return { ok: true, value: JSON.parse(await response.text()) };
  } catch {
    return {
      ok: false,
      problem: { status: 'invalid', target, message: `${path} 은 JSON 이 아닙니다` },
    };
  }
};

export type Client = ReturnType<typeof createClient>;

export const createClient = (fetcher: Fetcher, expectedSha: string) => {
  const cache = new Map<string, Promise<unknown>>();
  const once = <T>(key: string, load: () => Promise<T>): Promise<T> => {
    if (!cache.has(key)) cache.set(key, load());
    return cache.get(key) as Promise<T>;
  };

  const index = () =>
    once('index', async (): Promise<IndexResult> => {
      const fetched = await fetchJson(fetcher, 'index', 'index.json');
      if (!fetched.ok) return fetched.problem;
      const parsed = publicIndexSchema.safeParse(fetched.value);
      if (!parsed.success) {
        return { status: 'invalid', target: 'index', message: issuesOf(parsed.error.issues) };
      }
      return parsed.data.runs.length === 0
        ? { status: 'empty' }
        : { status: 'ready', value: parsed.data };
    });

  const entryOf = async (runId: string, target: LoadTarget) => {
    const result = await index();
    if (result.status === 'empty') {
      return {
        problem: { status: 'missing', target: 'index', message: '공개 index 에 실행이 없습니다' },
      } as const;
    }
    if (result.status !== 'ready') return { problem: result };
    const entry = result.value.runs.find((run) => run.id === runId);
    if (!entry) {
      return {
        problem: { status: 'missing', target, message: `index 에 ${runId} 실행이 없습니다` },
      } as const;
    }
    return { entry };
  };

  const run = (runId: string) =>
    once(`run:${runId}`, async (): Promise<RunResult> => {
      const found = await entryOf(runId, 'run');
      if ('problem' in found) return found.problem as Problem;
      const fetched = await fetchJson(fetcher, 'run', found.entry.path);
      if (!fetched.ok) return fetched.problem;
      const parsed = publicRunArtifactSchema.safeParse(fetched.value);
      if (!parsed.success) {
        return { status: 'invalid', target: 'run', message: issuesOf(parsed.error.issues) };
      }
      if (parsed.data.metadata.runId !== runId) {
        return {
          status: 'invalid',
          target: 'run',
          message: `${found.entry.path} 는 ${runId} 가 아니라 ${parsed.data.metadata.runId} 실행의 결과입니다`,
        };
      }
      return { status: 'ready', value: parsed.data };
    });

  /** 요약 파일이 없는 이전 export 는 missing 이다. `fallbackToRun` 이면 run 을 읽어 같은 함수로 요약한다. */
  const summary = (runId: string, { fallbackToRun = false }: { fallbackToRun?: boolean } = {}) =>
    once(`summary:${runId}:${fallbackToRun}`, async (): Promise<SummaryResult> => {
      const found = await entryOf(runId, 'summary');
      if ('problem' in found) return found.problem as Problem;
      if (!found.entry.summary) {
        if (!fallbackToRun) {
          return {
            status: 'missing',
            target: 'summary',
            message: `${runId} 의 요약 파일이 index 에 없습니다 — 다시 export 하세요`,
          };
        }
        const full = await run(runId);
        return full.status === 'ready'
          ? { status: 'ready', source: 'run', value: summarizeRun(full.value) }
          : full;
      }
      const fetched = await fetchJson(fetcher, 'summary', found.entry.summary);
      if (!fetched.ok) return fetched.problem;
      const parsed = runSummarySchema.safeParse(fetched.value);
      if (!parsed.success) {
        return { status: 'invalid', target: 'summary', message: issuesOf(parsed.error.issues) };
      }
      if (parsed.data.metadata.runId !== runId) {
        return {
          status: 'invalid',
          target: 'summary',
          message: `${found.entry.summary} 는 ${runId} 가 아니라 ${parsed.data.metadata.runId} 실행의 요약입니다`,
        };
      }
      return { status: 'ready', source: 'summary', value: parsed.data };
    });

  /** baseline 포인터. 파일이 없으면 missing(아무도 고르지 않음)이고, 깨졌으면 invalid 다 — 둘을 섞지 않는다. */
  const baselinePointer = () =>
    once('baseline', async (): Promise<BaselinePointerResult> => {
      const fetched = await fetchJson(fetcher, 'baseline', 'baseline.json');
      if (!fetched.ok) return fetched.problem;
      const parsed = baselinePointerSchema.safeParse(fetched.value);
      return parsed.success
        ? { status: 'ready', value: parsed.data }
        : { status: 'invalid', target: 'baseline', message: issuesOf(parsed.error.issues) };
    });

  return {
    index,
    summary,
    run,
    baselinePointer,
    clear: () => cache.clear(),
    freshness: (metadata: Pick<RunMetadata, 'source'>): Freshness =>
      assessFreshness(metadata, expectedSha),
  };
};
