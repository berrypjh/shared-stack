import { AXE_SCOPES, type RunArtifact } from '@berrypjh/observability-contracts';
import { Chip } from '@berrypjh/react-ui';

import {
  missingRunState,
  missingScopeState,
  type Panel,
  PANEL_LABEL,
  PANELS,
  RUNTIME_SCOPES,
  SOURCE_SCOPE_LABEL,
  STATIC_SCOPES,
} from '@/lib/evaluation/accessibility';
import type { SummaryResult } from '@/lib/evaluation/client';

import { Section } from '../section';
import { StatusNotice } from '../status-notice';
import { type RunData, runsWith, useOtherRun } from '../use-run-data';

import { AxeSummary } from './axe-summary';
import { CheckSummary } from './check-summary';
import { ManualSummary } from './manual-summary';
import { SourceFacts } from './source-facts';

const PanelSwitch = ({ panel, data }: { panel: Panel; data: RunData }) => {
  const { query, setQuery } = data;
  return (
    <Section title="보기">
      <div role="group" aria-label="보기" className="flex flex-wrap gap-xs">
        {PANELS.map((value) => (
          <Chip
            key={value}
            selected={panel === value}
            onClick={() =>
              setQuery({
                ...query,
                panel: value === 'static' ? undefined : value,
                target: undefined,
              })
            }
          >
            {PANEL_LABEL[value]}
          </Chip>
        ))}
      </div>
      <p className="typo-body-small break-keep text-text-light">
        axe 검사·token 대비 test·CSS 텍스트 검사·UI test·수동 확인은 서로 다른 근거다. 합친 점수나
        접근성 성공률은 없다.
      </p>
    </Section>
  );
};

/** 고른 실행의 접근성 결과. 출처마다 section 하나이고, 없는 출처는 통과로 채우지 않는다. */
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

  if (run.accessibility.length === 0) {
    return (
      <StatusNotice
        state={missingRunState(
          runId,
          runsWith(summaries, (summary) => summary.sections.accessibility > 0, runId),
        )}
      />
    );
  }

  const panel = (query.panel ?? 'static') as Panel;
  const scopes = panel === 'static' ? STATIC_SCOPES : RUNTIME_SCOPES;
  const byScope = (scope: string) =>
    run.accessibility.find((summary) => summary.sourceScope === scope) ?? null;

  return (
    <>
      <PanelSwitch panel={panel} data={data} />
      {scopes.map((scope) => {
        const summary = byScope(scope);
        const label = SOURCE_SCOPE_LABEL[scope];
        return summary ? (
          <Section key={scope} title={label} anchor={scope}>
            <SourceFacts summary={summary} />
            {summary.checks.length > 0 && <CheckSummary summary={summary} />}
            {(AXE_SCOPES as readonly string[]).includes(summary.sourceScope) && (
              <AxeSummary
                summary={summary}
                query={query}
                setQuery={setQuery}
                runIds={data.runIds}
                runId={runId}
                other={other}
              />
            )}
          </Section>
        ) : (
          <StatusNotice key={scope} state={missingScopeState(label)} />
        );
      })}
      <ManualSummary summary={byScope('manual')} />
    </>
  );
};
