import type { EvalRun, EvalVariant, RunArtifact } from '@berrypjh/observability-contracts';
import { Chip } from '@berrypjh/react-ui';

import type { ReactNode } from 'react';

import { noMatchState, unsupportedState } from '@/lib/evaluation/status';

import { RunSummary } from '../ai/eval-overview';
import { Section } from '../section';
import { StatusNotice } from '../status-notice';
import type { RunData } from '../use-run-data';

/**
 * 소비자 평가 항목의 공통 틀. 고른 실행에 평가 결과가 없으면 이유를 말하고, 있으면 실행 요약과
 * variant 고르기 아래에 평가 실행마다 내용을 그린다. 고르기는 표시만 바꾸고 지표를 다시 계산하지 않는다.
 */
export const EvalRuns = ({
  run,
  data,
  alternatives,
  children,
}: {
  run: RunArtifact;
  data: RunData;
  alternatives: string[] | null;
  children: (evalRun: EvalRun, variants: EvalVariant[]) => ReactNode;
}) => {
  const { query, setQuery } = data;
  const { runId, profile } = run.metadata;

  if (run.evals.length === 0) {
    return (
      <StatusNotice
        state={unsupportedState({
          section: '평가 결과',
          runId,
          profile,
          collectProfile: 'eval',
          alternatives,
        })}
      />
    );
  }

  const labels = new Map(
    run.evals.flatMap((evalRun) => evalRun.variants.map((item) => [item.variant, item.label])),
  );
  const variantIds = [...labels.keys()];
  // 측정 당시 설명이 있는 variant 만. 이 필드 전에 수집한 실행에는 없다.
  const described = [
    ...new Map(
      run.evals.flatMap((evalRun) =>
        evalRun.variants.flatMap((item) =>
          item.description
            ? [[item.variant, { ...item, description: item.description }] as const]
            : [],
        ),
      ),
    ).values(),
  ];
  const matches = (variant: string) => !query.variant || variant === query.variant;
  const matched = variantIds.filter(matches);

  return (
    <>
      {run.evals.map((evalRun) => (
        <RunSummary key={evalRun.sourceId} evalRun={evalRun} />
      ))}
      <Section title="variant 고르기">
        <div role="group" aria-label="variant" className="flex flex-wrap gap-xs">
          {[undefined, ...variantIds].map((id) => (
            <Chip
              key={id ?? 'all'}
              selected={query.variant === id}
              onClick={() => setQuery({ ...query, variant: id })}
            >
              {id ? (labels.get(id) ?? id) : '전체'}
            </Chip>
          ))}
        </div>
        <p role="status" aria-live="polite" className="typo-body-small text-text-default">
          {`variant ${variantIds.length}개 중 ${matched.length}개를 보는 중 — 값은 variant 별 원본이고 다시 계산하지 않음`}
        </p>
        {described.length > 0 && (
          <details className="rounded-md border border-stroke-light bg-background-surface">
            <summary className="cursor-pointer px-md py-sm typo-body-small text-text-light">
              {`variant 설명 ${described.length}개`}
            </summary>
            <dl className="m-0 grid grid-cols-1 gap-x-lg gap-y-sm border-t border-stroke-light p-md typo-body-small sm:grid-cols-[max-content_1fr]">
              {described.map((item) => (
                <div key={item.variant} className="contents">
                  <dt className="text-text-default">{item.label}</dt>
                  <dd className="m-0 break-keep text-text-light">{item.description}</dd>
                </div>
              ))}
            </dl>
          </details>
        )}
      </Section>
      {query.variant && matched.length === 0 ? (
        <StatusNotice state={noMatchState(`variant ${query.variant}`)} />
      ) : (
        run.evals.map((evalRun) => (
          <div key={evalRun.sourceId} className="contents">
            {children(
              evalRun,
              evalRun.variants.filter((item) => matches(item.variant)),
            )}
          </div>
        ))
      )}
    </>
  );
};
