import type { RunArtifact } from '@berrypjh/observability-contracts';

import { missingRunState, SOURCE_SCOPE_LABEL } from '@/lib/evaluation/accessibility';
import type { SummaryResult } from '@/lib/evaluation/client';

import { Section } from '../section';
import { StatusNotice } from '../status-notice';
import { type RunData, runsWith, useOtherRun } from '../use-run-data';

import { AxeSummary } from './axe-summary';
import { SourceFacts } from './source-facts';

/** 고른 실행의 DevHub 평가 화면 접근성 audit. 결과가 없는 실행을 통과로 채우지 않는다. */
export const AccessibilityView = ({
  run,
  data,
  summaries,
}: {
  run: RunArtifact;
  data: RunData;
  summaries: Record<string, SummaryResult>;
}) => {
  const { query, setQuery } = data;
  const { runId } = run.metadata;
  const other = useOtherRun(query.base);
  const summary = run.accessibility[0] ?? null;

  if (!summary) {
    return (
      <StatusNotice
        state={missingRunState(
          runId,
          runsWith(summaries, (summary) => summary.sections.accessibility > 0, runId),
        )}
      />
    );
  }

  return (
    <Section title={SOURCE_SCOPE_LABEL} anchor="devhub">
      <SourceFacts summary={summary} />
      <AxeSummary
        summary={summary}
        query={query}
        setQuery={setQuery}
        runIds={data.runIds}
        runId={runId}
        other={other}
      />
    </Section>
  );
};
