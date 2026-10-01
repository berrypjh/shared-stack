import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Freshness, RunArtifact, RunSummary } from '@berrypjh/observability-contracts';

import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import type { SummaryResult } from '@/lib/evaluation/client';
import { parseQuery, type Query, type QuerySpec, queryString } from '@/lib/evaluation/query';
import {
  type CollectProfile,
  emptyState,
  loadErrorState,
  noAreaRunState,
  queryErrorState,
  runNotFoundState,
  type ViewState,
} from '@/lib/evaluation/status';

import { useEvaluationClient } from './evaluation-provider';

type Loaded = {
  loading: boolean;
  view: ViewState | null;
  runIds: string[];
  run: RunArtifact | null;
  freshness: Freshness | null;
};

const INITIAL: Loaded = {
  loading: true,
  view: null,
  runIds: [],
  run: null,
  freshness: null,
};

export type RunData = Loaded & {
  query: Query;
  selectedRunId: string | null;
  setQuery: (next: Query, options?: { replace?: boolean }) => void;
  selectRun: (runId: string) => void;
  reload: () => void;
};

/**
 * 평가 항목이 보는 영역. 요약에 그 영역이 있는 실행만 목록 · 기본값이 되고, 주소로 고른 실행은
 * 영역이 없어도 목록에 남겨 왜 비었는지 보인다. 수집 명령은 이 영역을 담는 profile 로 준다.
 */
export type RunArea = {
  has: (summary: RunSummary) => boolean;
  section: string;
  collectProfile: CollectProfile;
};

/**
 * 고른 실행 하나를 run 전체로 읽는다. 데이터는 run id 로만 다시 읽고 필터는 렌더에서 적용하므로,
 * 필터를 바꿔도 컨트롤이 사라지지 않는다.
 */
export const useRunData = (spec: QuerySpec, area: RunArea): RunData => {
  const client = useEvaluationClient();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const parsed = useMemo(() => parseQuery(params, spec), [params, spec]);
  const query = useMemo(() => (parsed.ok ? parsed.value : {}), [parsed]);
  const [loaded, setLoaded] = useState<Loaded>(INITIAL);
  const [attempt, setAttempt] = useState(0);

  const runParam = query.run;
  const queryOk = parsed.ok;

  useEffect(() => {
    if (!queryOk) return undefined;
    let active = true;
    const done = (next: Partial<Loaded>) => {
      if (active) setLoaded((current) => ({ ...current, loading: false, ...next }));
    };
    setLoaded((current) => ({ ...current, loading: true }));

    void (async () => {
      const index = await client.index();
      if (index.status === 'empty' || (index.status === 'missing' && index.target === 'index')) {
        return done({ ...INITIAL, loading: false, view: emptyState(area.collectProfile) });
      }
      if (index.status !== 'ready') {
        return done({
          ...INITIAL,
          loading: false,
          view: loadErrorState(index, undefined, area.collectProfile),
        });
      }
      const indexed = index.value.runs.map((run) => run.id);
      if (runParam && !indexed.includes(runParam)) {
        return done({
          ...INITIAL,
          loading: false,
          runIds: indexed,
          view: runNotFoundState(runParam, indexed),
        });
      }
      const summaries = await Promise.all(indexed.map((id) => client.summary(id)));
      const runIds = indexed.filter((id, i) => {
        const summary = summaries[i];
        return id === runParam || (summary.status === 'ready' && area.has(summary.value));
      });
      const runId = runParam ?? runIds[runIds.length - 1];
      if (!runId) {
        const unreadable = indexed.filter((_, i) => summaries[i].status !== 'ready');
        return done({ ...INITIAL, loading: false, view: noAreaRunState({ ...area, unreadable }) });
      }
      const run = await client.run(runId);
      return run.status === 'ready'
        ? done({
            runIds,
            view: null,
            run: run.value,
            freshness: client.freshness(run.value.metadata),
          })
        : done({ ...INITIAL, loading: false, runIds, view: loadErrorState(run, runId) });
    })();

    return () => {
      active = false;
    };
  }, [client, area, runParam, queryOk, attempt]);

  const setQuery = useCallback(
    (next: Query, options?: { replace?: boolean }) =>
      navigate({ pathname, search: queryString(next) }, { replace: options?.replace }),
    [navigate, pathname],
  );

  const selectRun = useCallback(
    (runId: string) => setQuery({ ...query, run: runId }),
    [query, setQuery],
  );

  const reload = useCallback(() => {
    client.clear();
    setAttempt((count) => count + 1);
  }, [client]);

  const selectedRunId =
    runParam ?? (loaded.runIds.length > 0 ? loaded.runIds[loaded.runIds.length - 1] : null);

  return parsed.ok
    ? { ...loaded, query, selectedRunId, setQuery, selectRun, reload }
    : {
        ...INITIAL,
        loading: false,
        view: queryErrorState(parsed.issues),
        query,
        selectedRunId: null,
        setQuery,
        selectRun,
        reload,
      };
};

export type OtherRun =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; run: RunArtifact }
  | { status: 'error'; view: ViewState };

/** 비교용 두 번째 실행 전체 (baseline). id 가 없으면 읽지 않는다. */
export const useOtherRun = (runId: string | undefined): OtherRun => {
  const client = useEvaluationClient();
  const [state, setState] = useState<OtherRun>({ status: 'idle' });

  useEffect(() => {
    if (!runId) {
      setState({ status: 'idle' });
      return undefined;
    }
    let active = true;
    setState({ status: 'loading' });
    void client.run(runId).then((result) => {
      if (!active) return;
      setState(
        result.status === 'ready'
          ? { status: 'ready', run: result.value }
          : { status: 'error', view: loadErrorState(result, runId) },
      );
    });
    return () => {
      active = false;
    };
  }, [client, runId]);

  return state;
};

/** 목록의 모든 run 요약. 요약 파일이 없는 run 은 run 전체를 받지 않고 missing 으로 둔다. */
export const useSummaries = (runIds: string[]): Record<string, SummaryResult> => {
  const client = useEvaluationClient();
  const key = runIds.join('\n');
  const [results, setResults] = useState<Record<string, SummaryResult>>({});

  useEffect(() => {
    let active = true;
    const ids = key ? key.split('\n') : [];
    void Promise.all(ids.map((id) => client.summary(id))).then((list) => {
      if (active) setResults(Object.fromEntries(ids.map((id, i) => [id, list[i]])));
    });
    return () => {
      active = false;
    };
  }, [client, key]);

  return results;
};

/**
 * 요약으로 그 영역을 가진 것이 확인된 run(`except` 는 뺀다). 요약이 없는 run 은 모르므로 넣지 않는다.
 * `useSummaries` 는 요약을 한꺼번에 채우므로 비어 있으면 아직 받지 않은 것이다 — 그때는 null 이라
 * 상태 문장이 "그런 실행이 없다"고 단정하지 않는다.
 */
export const runsWith = (
  results: Record<string, SummaryResult>,
  has: (summary: RunSummary) => boolean,
  except?: string,
): string[] | null =>
  Object.keys(results).length === 0
    ? null
    : Object.entries(results).flatMap(([id, result]) =>
        id !== except && result.status === 'ready' && has(result.value) ? [id] : [],
      );
