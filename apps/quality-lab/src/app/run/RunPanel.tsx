import { Button } from '@berrypjh/react-ui';

import type { Fetcher, LoadResult } from '../data/loadObservability';
import { EmptyRuns } from '../ui';

import { RunView } from './RunView';
import { useObservability } from './useObservability';

type Problem = Exclude<LoadResult, { status: 'ready' | 'empty' }>;

/** 공개 index 자체가 없거나 비었다 — 오류가 아니라 아직 수집하지 않은 상태다. */
export const isNoData = (result: LoadResult | null) =>
  result !== null &&
  (result.status === 'empty' || (result.status === 'missing' && result.target === 'index'));

/** 보여줄 문제. 이미 검증된 run 이 있으면 index 가 사라진 것도 문제로 알린다. */
export const problemOf = (result: LoadResult | null, hasRun: boolean): Problem | null => {
  if (result === null || result.status === 'ready' || result.status === 'empty') return null;
  return isNoData(result) && !hasRun ? null : result;
};

export const statusText = (loading: boolean, result: LoadResult | null) => {
  if (loading) return '실행 기록을 불러오는 중입니다';
  if (result === null) return '';
  if (result.status === 'ready') return `${result.runId} 실행을 불러왔습니다`;
  if (isNoData(result)) return '공개된 실행 기록이 없습니다';
  if (result.status === 'invalid') return '실행 기록이 계약과 맞지 않습니다';
  if (result.status === 'missing') return '선택한 실행 파일이 없습니다';
  return '실행 기록을 불러오지 못했습니다';
};

const PROBLEM_TEXT = {
  invalid: {
    title: '공개 artifact 가 계약과 맞지 않습니다',
    description: 'export 된 JSON 을 공개 계약으로 검증하지 못해 화면에 올리지 않았습니다.',
  },
  missing: {
    title: '실행 파일이 없습니다',
    description: '공개 index 나 index 가 가리키는 실행 파일이 없습니다. export 를 다시 실행하세요.',
  },
  unreachable: {
    title: '실행 기록을 불러오지 못했습니다',
    description: '개발 서버와 파일 경로를 확인하세요. 브라우저는 수집 명령을 실행하지 않습니다.',
  },
} as const;

export const LoadProblem = ({ problem, keptRun }: { problem: Problem; keptRun: boolean }) => {
  const text = PROBLEM_TEXT[problem.status];
  return (
    <section
      aria-labelledby="load-problem-title"
      aria-describedby="load-problem-description"
      className="border border-stroke-error rounded-md p-lg bg-background-surface"
    >
      <h3 id="load-problem-title" className="text-text-default text-sm leading-sm font-semiBold">
        {text.title}
      </h3>
      <div id="load-problem-description">
        <p className="text-text-light text-xsm leading-xsm mt-xs break-keep">{text.description}</p>
        <pre className="font-mono text-xxsm text-text-default whitespace-pre-wrap break-all mt-sm">
          {problem.message}
        </pre>
        {keptRun && (
          <p className="text-text-default text-xsm leading-xsm mt-sm">
            마지막으로 검증된 실행을 계속 보여줍니다
          </p>
        )}
      </div>
    </section>
  );
};

type RunPanelProps = { fetcher: Fetcher; expectedSha: string };

/** 가장 최근에 export 한 run. 불러오는 중·문제·미수집·검증된 run 을 각각 다르게 보여준다. */
export const RunPanel = ({ fetcher, expectedSha }: RunPanelProps) => {
  const { loading, result, lastReady, reload } = useObservability(fetcher, expectedSha);
  const problem = problemOf(result, lastReady !== null);

  return (
    <section aria-labelledby="run-panel-title" aria-busy={loading} className="flex flex-col gap-lg">
      <div className="flex flex-wrap items-center justify-between gap-md">
        <h2 id="run-panel-title" className="text-text-default text-lg leading-lg font-semiBold">
          최근 실행
        </h2>
        <Button variant="outlined" size="sm" onClick={reload} disabled={loading}>
          다시 불러오기
        </Button>
      </div>
      <p role="status" aria-live="polite" className="text-text-light text-xsm leading-xsm">
        {statusText(loading, result)}
      </p>
      {problem && <LoadProblem problem={problem} keptRun={lastReady !== null} />}
      {!lastReady && isNoData(result) && <EmptyRuns />}
      {lastReady && <RunView run={lastReady} />}
    </section>
  );
};
