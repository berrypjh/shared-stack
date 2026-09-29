import { Fragment } from 'react';

import type { RunArtifact, RunSummary } from '@berrypjh/observability-contracts';
import { Chip } from '@berrypjh/react-ui';

import { CONTEXT_PANELS, ContextPanels } from '@/components/evaluation/ai/context-panels';
import { Provenance, Scorecard } from '@/components/evaluation/ai/eval-overview';
import { Retrieval } from '@/components/evaluation/ai/retrieval';
import { Routing } from '@/components/evaluation/ai/routing';
import { Verification } from '@/components/evaluation/ai/verification';
import { EvaluationFrame } from '@/components/evaluation/evaluation-frame';
import { RunBar } from '@/components/evaluation/run-bar';
import { Section } from '@/components/evaluation/section';
import { StatusNotice } from '@/components/evaluation/status-notice';
import { useHashFocus } from '@/components/evaluation/use-hash-focus';
import {
  type RunData,
  runsWith,
  useRunData,
  useSummaries,
} from '@/components/evaluation/use-run-data';
import { importReason } from '@/lib/evaluation/ai';
import type { SummaryResult } from '@/lib/evaluation/client';
import { loadingState, noMatchState, notRunState, unsupportedState } from '@/lib/evaluation/status';

const SPEC = { keys: ['run', 'variant', 'panel'], panels: CONTEXT_PANELS } as const;

const Ai = ({
  run,
  data,
  summaries,
}: {
  run: RunArtifact;
  data: RunData;
  summaries: Record<string, SummaryResult>;
}) => {
  const { query, setQuery } = data;
  const { runId, profile } = run.metadata;
  const others = (has: (summary: RunSummary) => boolean) => runsWith(summaries, has, runId);
  const variantIds = [
    ...new Set(run.evals.flatMap((evalRun) => evalRun.variants.map((item) => item.variant))),
  ];
  const matches = (variant: string) => !query.variant || variant === query.variant;
  const matched = variantIds.filter(matches);
  const noMatch = Boolean(query.variant) && matched.length === 0;

  return (
    <>
      {run.evals.length === 0 ? (
        <StatusNotice
          state={unsupportedState({
            section: '평가 결과',
            runId,
            profile,
            collectProfile: 'eval',
            alternatives: others((summary) => summary.sections.evals > 0),
          })}
        />
      ) : (
        <>
          {run.evals.map((evalRun) => (
            <Provenance key={evalRun.sourceId} evalRun={evalRun} />
          ))}
          <Section title="variant 필터">
            <div role="group" aria-label="variant" className="flex flex-wrap gap-xs">
              {[undefined, ...variantIds].map((id) => (
                <Chip
                  key={id ?? 'all'}
                  selected={query.variant === id}
                  onClick={() => setQuery({ ...query, variant: id })}
                >
                  {id ?? '전체'}
                </Chip>
              ))}
            </div>
            <p role="status" aria-live="polite" className="typo-body-small text-text-default">
              {`variant ${variantIds.length}개 중 필터와 일치 ${matched.length}개 — metric 은 variant 별 원본 값이고 다시 계산하지 않음`}
            </p>
          </Section>
          {noMatch ? (
            <StatusNotice state={noMatchState(`variant ${query.variant}`)} />
          ) : (
            run.evals.map((evalRun) =>
              evalRun.variants.length === 0 ? (
                <StatusNotice
                  key={evalRun.sourceId}
                  state={notRunState({
                    section: 'variant metric',
                    runId: evalRun.sourceId,
                    reason: importReason('summary', evalRun.import.summary),
                    collectProfile: 'eval',
                    alternatives: null,
                  })}
                />
              ) : (
                <Scorecard
                  key={evalRun.sourceId}
                  evalRun={evalRun}
                  variants={evalRun.variants.filter((item) => matches(item.variant))}
                />
              ),
            )
          )}
        </>
      )}

      <ContextPanels run={run} data={data} />

      {!noMatch &&
        run.evals.map((evalRun) => (
          <Fragment key={evalRun.sourceId}>
            <Routing evalRun={evalRun} variant={query.variant} />
            <Retrieval evalRun={evalRun} variant={query.variant} />
            <Verification evalRun={evalRun} variant={query.variant} />
          </Fragment>
        ))}
    </>
  );
};

/** AI 평가: 출처 · primary scorecard · context panel · routing · retrieval · verification. */
export const EvaluationAiPage = () => {
  const data = useRunData('run', SPEC);
  const summaries = useSummaries(data.runIds);
  useHashFocus(data.run !== null);
  return (
    <EvaluationFrame screen="ai" data={data}>
      <RunBar data={data} />
      {data.view && <StatusNotice state={data.view} />}
      {data.loading && !data.view && !data.run && <StatusNotice state={loadingState('실행')} />}
      {data.run && <Ai run={data.run} data={data} summaries={summaries} />}
    </EvaluationFrame>
  );
};
