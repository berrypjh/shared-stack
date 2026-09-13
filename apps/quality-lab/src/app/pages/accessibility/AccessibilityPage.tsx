import type { RunArtifact } from '@berrypjh/observability-contracts';
import { Chip } from '@berrypjh/react-ui';

import { RunBar } from '../../components/RunBar';
import { Section } from '../../components/Section';
import { StatusNotice } from '../../components/StatusNotice';
import { RUNTIME_SCOPES, SOURCE_SCOPE_LABEL, STATIC_SCOPES } from '../../data/accessibility';
import type { SummaryResult } from '../../data/client';
import { loadingState, type ViewState } from '../../data/status';
import {
  type RunData,
  runsWith,
  useOtherRun,
  useRunData,
  useSummaries,
} from '../../data/useRunData';
import { Page } from '../../ui';

import { AxeSummary } from './AxeSummary';
import { CheckSummary } from './CheckSummary';
import { ManualSummary } from './ManualSummary';
import { SourceFacts } from './SourceFacts';

const PANELS = ['static', 'runtime'] as const;
type Panel = (typeof PANELS)[number];

const SPEC = { keys: ['run', 'panel', 'base', 'target'], panels: PANELS } as const;

const PANEL_LABEL: Record<Panel, string> = {
  static: 'Static/Test Results',
  runtime: 'Runtime Audit',
};

const AUDIT_COMMANDS = ['pnpm quality:lab', 'pnpm quality --base-url=http://localhost:4300'];

const missingRun = (runId: string, alternatives: string[]): ViewState => ({
  kind: 'unsupported',
  title: `${runId} 에는 접근성 결과가 없습니다`,
  cause:
    '접근성 수집(a11y profile)을 하지 않은 실행입니다. 브라우저는 audit 명령을 실행하지 않습니다.' +
    (alternatives.length > 0 ? ` 접근성 결과가 있는 실행: ${alternatives.join(', ')}` : ''),
  commands: AUDIT_COMMANDS,
});

const missingScope = (label: string): ViewState => ({
  kind: 'unsupported',
  title: `이 실행에 ${label} 결과가 없습니다`,
  cause: '이 출처는 수집하지 않았습니다. 없는 출처를 통과로 보지 않습니다.',
  commands: [AUDIT_COMMANDS[1]],
});

const Accessibility = ({
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
        state={missingRun(
          runId,
          runsWith(summaries, (summary) => summary.sections.accessibility > 0).filter(
            (id) => id !== runId,
          ),
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
        <p className="text-text-light text-xsm leading-xsm break-keep">
          axe 검사·token 대비 test·CSS 텍스트 검사·UI test·수동 확인은 서로 다른 근거입니다. 합친
          점수나 접근성 성공률은 없습니다.
        </p>
      </Section>

      {scopes.map((scope) => {
        const summary = byScope(scope);
        const label = SOURCE_SCOPE_LABEL[scope];
        return summary ? (
          <Section key={scope} title={label} anchor={scope}>
            <SourceFacts summary={summary} />
            {summary.checks.length > 0 && <CheckSummary summary={summary} />}
            {(summary.sourceScope === 'storybook' || summary.sourceScope === 'quality-lab') && (
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
          <StatusNotice key={scope} state={missingScope(label)} />
        );
      })}

      <ManualSummary summary={byScope('manual')} />
    </>
  );
};

export const AccessibilityPage = () => {
  const data = useRunData('run', SPEC);
  const summaries = useSummaries(data.runIds);
  return (
    <Page path="/accessibility">
      <RunBar data={data} />
      {data.view && <StatusNotice state={data.view} />}
      {data.loading && !data.view && !data.run && <StatusNotice state={loadingState('실행')} />}
      {data.run && <Accessibility run={data.run} data={data} summaries={summaries} />}
    </Page>
  );
};
