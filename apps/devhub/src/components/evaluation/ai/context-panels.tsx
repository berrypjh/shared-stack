import { DataTable } from '@berrypjh/devhub-ui';
import type { ContextMeasurement, RunArtifact } from '@berrypjh/observability-contracts';
import { Chip } from '@berrypjh/react-ui';

import { contextEmptyState, type ContextScope } from '@/lib/evaluation/ai';
import { availabilityLabel, formatInteger } from '@/lib/evaluation/format';
import { noMatchState } from '@/lib/evaluation/status';

import { Mono } from '../mono';
import { Section } from '../section';
import { StatusNotice } from '../status-notice';
import { TARGET_ROW } from '../use-hash-focus';
import type { RunData } from '../use-run-data';

export const CONTEXT_PANELS = ['initial', 'routed', 'scenario', 'agent-input'] as const;
type Panel = (typeof CONTEXT_PANELS)[number];

const PANEL: Record<Panel, { scope: ContextScope; label: string; lead: string }> = {
  initial: {
    scope: 'variant-initial',
    label: 'variant-initial',
    lead: 'variant 가 처음 받는 context 를 이어 붙여 센 token 수. trial 의 medianInputTokens 와 다른 측정.',
  },
  routed: {
    scope: 'variant-routed',
    label: 'variant-routed',
    lead: 'routing 뒤 platform 별로 받는 context 다. initial 과 감소량은 수집기가 계산하지 않아 두 panel 의 값을 따로 둠.',
  },
  scenario: {
    scope: 'package-scenario',
    label: 'package-scenario',
    lead: 'package 시나리오마다 파일을 읽어 센 token 수. 평가 variant 와 다른 입력.',
  },
  'agent-input': {
    scope: 'agent-input',
    label: 'agent-input (실제 입력)',
    lead: 'live executor 가 보고한 실제 입력 token.',
  },
};

const ContextRow = ({ context }: { context: ContextMeasurement }) => (
  <tr id={`context-${context.id}`} tabIndex={-1} className={TARGET_ROW}>
    <th scope="row">{context.subject}</th>
    <td>
      {context.tokens === null
        ? `${availabilityLabel(context.availability)} — ${context.reason}`
        : `${formatInteger(context.tokens)} tokens`}
    </td>
    <td>{context.chars === null ? '없음' : formatInteger(context.chars)}</td>
    <td>
      {`${context.files.length}개`}
      {context.missingPaths.length > 0 && (
        <span className="block">{`없는 경로: ${context.missingPaths.join(', ')}`}</span>
      )}
    </td>
    <td>
      {`${context.provider} · ${context.tokenModel} · ${
        context.tokenizerVersion ?? `버전 모름 — ${context.tokenizerVersionReason}`
      }`}
    </td>
    <td>
      <Mono>{context.contentConstruction}</Mono>
    </td>
  </tr>
);

/** 측정 범위마다 다른 panel. 서로 다른 scope 의 token 수를 한 표에 섞지 않는다. */
export const ContextPanels = ({ run, data }: { run: RunArtifact; data: RunData }) => {
  const { query, setQuery } = data;
  const { runId, profile } = run.metadata;
  const panel = (query.panel ?? 'initial') as Panel;
  const { scope, lead } = PANEL[panel];
  const inScope = run.contexts.filter((context) => context.scope === scope);
  const rows = inScope.filter(
    (context) =>
      !query.variant ||
      scope === 'package-scenario' ||
      context.subject === query.variant ||
      context.subject.startsWith(`${query.variant}@`),
  );

  return (
    <Section title="Context" anchor="contexts">
      <div role="group" aria-label="context 측정 범위" className="flex flex-wrap gap-xs">
        {CONTEXT_PANELS.map((value) => (
          <Chip
            key={value}
            selected={panel === value}
            onClick={() => setQuery({ ...query, panel: value === 'initial' ? undefined : value })}
          >
            {PANEL[value].label}
          </Chip>
        ))}
      </div>
      <p className="typo-body-small break-keep text-text-light">{lead}</p>
      {inScope.length === 0 ? (
        <StatusNotice
          level={3}
          state={contextEmptyState({ scope, runId, profile, evals: run.evals })}
        />
      ) : rows.length === 0 ? (
        <StatusNotice level={3} state={noMatchState(`variant ${query.variant}`)} />
      ) : (
        <>
          <p role="status" aria-live="polite" className="typo-body-small text-text-default">
            {`${scope} ${inScope.length}행 중 필터와 일치 ${rows.length}행`}
          </p>
          <DataTable
            caption={`Context — ${scope}`}
            headers={['subject', 'tokens', 'chars', '파일', 'tokenizer', 'content construction']}
          >
            {rows.map((context) => (
              <ContextRow key={context.id} context={context} />
            ))}
          </DataTable>
        </>
      )}
    </Section>
  );
};
