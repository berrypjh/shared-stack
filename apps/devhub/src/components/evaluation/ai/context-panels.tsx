import { BarChart, DataTable, Mono } from '@berrypjh/devhub-ui';
import type { ContextMeasurement, RunArtifact } from '@berrypjh/observability-contracts';
import { Chip } from '@berrypjh/react-ui';

import { contextEmptyState, type ContextScope } from '@/lib/evaluation/ai';
import { byPackage } from '@/lib/evaluation/bundles';
import { availabilityLabel, formatInteger } from '@/lib/evaluation/format';
import { noMatchState } from '@/lib/evaluation/status';

import { Section } from '../section';
import { StatusNotice } from '../status-notice';
import { TARGET_ROW } from '../use-hash-focus';
import type { RunData } from '../use-run-data';

export const CONTEXT_PANELS = ['initial', 'routed', 'scenario', 'agent-input'] as const;
type Panel = (typeof CONTEXT_PANELS)[number];

const PANEL: Record<Panel, { scope: ContextScope; label: string; lead: string }> = {
  initial: {
    scope: 'variant-initial',
    label: '처음 받는 컨텍스트',
    lead: '평가 variant 가 시작할 때 받는 자료를 이어 붙여 센 token 수 (variant-initial). trial 의 medianInputTokens 와 다른 측정.',
  },
  routed: {
    scope: 'variant-routed',
    label: '플랫폼별 컨텍스트',
    lead: '플랫폼을 고른 뒤 그 플랫폼 자료만 받을 때의 token 수 (variant-routed). 처음 받는 컨텍스트와의 차이는 계산하지 않음.',
  },
  scenario: {
    scope: 'package-scenario',
    label: '패키지 시나리오',
    lead: '패키지마다 정해 둔 파일 묶음을 읽어 센 token 수 (package-scenario). 평가 variant 와 다른 입력.',
  },
  'agent-input': {
    scope: 'agent-input',
    label: '실제 입력',
    lead: 'live executor 가 보고한 실제 입력 token (agent-input). variant 마다 묶고 과제 · 시도마다 한 행이다.',
  },
};

const PLATFORM_LABEL: Record<string, string> = { web: '웹', 'react-native': 'React Native' };

type Place = {
  /** 화면에서 묶는 단위. 없으면 묶지 않는다. */
  group: string | null;
  /** 묶음 안에서 보이는 이름. */
  title: string;
  /** 사람이 읽는 이름 아래에 두는 코드 이름. */
  code: string | null;
};

/**
 * 행의 자리와 이름. 시나리오는 패키지로, routed 는 플랫폼으로, 실제 입력은 variant 로 묶는다.
 * variant 는 측정 당시 정의의 이름이 있으면 그 이름을 보이고 코드 이름을 아래에 둔다.
 */
const placeOf = (context: ContextMeasurement): Place => {
  const label = context.definition?.label ?? null;
  if (context.scope === 'package-scenario') {
    const [pkg, ...rest] = context.subject.split('/');
    return { group: pkg, title: rest.join('/') || context.subject, code: null };
  }
  if (context.scope === 'variant-routed') {
    const [variant, platform = ''] = context.subject.split('@');
    return {
      group: PLATFORM_LABEL[platform] ?? platform,
      title: label ?? variant,
      code: label && variant,
    };
  }
  if (context.scope === 'agent-input') {
    const [variant, task, trial] = context.subject.split('::');
    return {
      group: label ?? variant,
      title: task ? `${task} · trial ${trial}` : '실행하지 않음',
      code: null,
    };
  }
  return { group: null, title: label ?? context.subject, code: label && context.subject };
};

/** 패키지 안 경로. 이름만 남기면 테마별 `tokens.d.ts` 처럼 같은 이름이 구분되지 않는다. */
const inPackage = (file: string) => file.replace(/^libs\/[^/]+\//, '');

/** 무엇을 읽었는가. variant 는 측정 당시 정의의 설명, 시나리오는 이어 붙인 파일이다. */
const readText = (context: ContextMeasurement) => {
  if (context.scope === 'agent-input')
    return '과제를 푸는 동안 모델에 보낸 입력 — 턴마다 API 사용량을 더함';
  return (
    context.definition?.description ??
    (context.scope === 'package-scenario'
      ? context.files.map(inPackage).join(' · ')
      : `파일 ${context.files.length}개`)
  );
};

const tokenText = (context: ContextMeasurement) =>
  context.tokens === null
    ? `${availabilityLabel(context.availability)} — ${context.reason}`
    : `${formatInteger(context.tokens)} tokens`;

/** 측정 조건(provider · 모델 · tokenizer · 내용 구성). 모든 행이 같으면 하나다. */
const conditionsOf = (rows: ContextMeasurement[]) => [
  ...new Set(
    rows.map(
      (row) =>
        `${row.provider} · ${row.tokenModel} · ${row.tokenizerVersion ?? '버전 모름'} · ${row.contentConstruction}`,
    ),
  ),
];

/**
 * 표의 컬럼과 뜻. 뜻은 상세 칸이 보인다(`measures/index.ts`).
 */
export const CONTEXT_COLUMNS = [
  { term: '이름', meaning: 'variant 는 사람이 읽는 이름 아래 코드 이름, 시나리오는 시나리오 이름' },
  { term: '읽은 것', meaning: 'variant 는 측정 당시 정의의 설명, 시나리오는 이어 붙인 파일' },
  {
    term: 'tokens',
    meaning: '이어 붙인 내용을 tokenizer 로 센 수. 입력이 하나라도 없으면 값 없음',
  },
  { term: 'chars', meaning: '이어 붙인 내용의 글자 수' },
];

const ContextRow = ({ context }: { context: ContextMeasurement }) => {
  const { title, code } = placeOf(context);
  return (
    <tr id={`context-${context.id}`} tabIndex={-1} className={TARGET_ROW}>
      <th scope="row" className="whitespace-nowrap">
        {title}
        {code && (
          <span className="block typo-caption-small text-text-light">
            <Mono>{code}</Mono>
          </span>
        )}
      </th>
      <td className="break-keep">
        {readText(context)}
        {context.missingPaths.length > 0 && (
          <span className="block">{`없는 경로: ${context.missingPaths.join(', ')}`}</span>
        )}
      </td>
      <td className={context.tokens === null ? undefined : 'whitespace-nowrap'}>
        {tokenText(context)}
      </td>
      <td className="whitespace-nowrap">
        {context.chars === null ? '없음' : formatInteger(context.chars)}
      </td>
    </tr>
  );
};

/** 묶음 하나의 차트와 표. 축은 묶음 안의 최댓값이다. */
const ContextGroup = ({ title, rows }: { title: string; rows: ContextMeasurement[] }) => (
  <>
    <BarChart
      title={`token 수 — ${title}`}
      description="축은 이 묶음 안의 최댓값. 측정되지 않은 행은 막대 대신 이유"
      unit="token 수"
      groups={[
        {
          label: title,
          bars: rows.map((context) => ({
            key: context.id,
            label: placeOf(context).title,
            value: context.tokens,
            scale: Math.max(...rows.map((row) => row.tokens ?? 0), 1),
            text:
              context.tokens === null
                ? availabilityLabel(context.availability)
                : `${formatInteger(context.tokens)} tokens`,
          })),
        },
      ]}
    />
    <DataTable
      caption={`Context — ${title}`}
      headers={CONTEXT_COLUMNS.map((column) => column.term)}
    >
      {rows.map((context) => (
        <ContextRow key={context.id} context={context} />
      ))}
    </DataTable>
  </>
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
  const groups = byPackage(rows, (row) => placeOf(row).group ?? scope);

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
      <div className="flex flex-col gap-2xs">
        <p className="typo-body-small break-keep text-text-light">{lead}</p>
        {rows.length > 0 && (
          <>
            <p role="status" aria-live="polite" className="typo-caption-small text-text-light">
              {`${scope} ${inScope.length}행 중 필터와 일치 ${rows.length}행`}
            </p>
            <p className="typo-caption-small text-text-light">
              측정 조건 <Mono>{conditionsOf(rows).join(' / ')}</Mono>
            </p>
          </>
        )}
      </div>
      {inScope.length === 0 ? (
        <StatusNotice
          level={3}
          state={contextEmptyState({ scope, runId, profile, evals: run.evals })}
        />
      ) : rows.length === 0 ? (
        <StatusNotice level={3} state={noMatchState(`variant ${query.variant}`)} />
      ) : groups.length === 1 ? (
        <ContextGroup title={scope} rows={rows} />
      ) : (
        groups.map(([title, items]) => (
          <Section key={title} title={title} level={3}>
            <ContextGroup title={title} rows={items} />
          </Section>
        ))
      )}
    </Section>
  );
};
