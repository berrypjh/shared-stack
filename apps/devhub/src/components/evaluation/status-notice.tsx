import { type ReactNode, useId } from 'react';

import { List, ListItem } from '@berrypjh/react-ui';

import { VIEW_STATE_LABEL, type ViewState, type ViewStateKind } from '@/lib/evaluation/status';

import { CopyCommand } from './copy-command';

const ICON: Record<ViewStateKind, string> = {
  empty: '○',
  loading: '…',
  error: '✕',
  partial: '◐',
  unsupported: '⊘',
  'not-applicable': '–',
  stale: '⟳',
  'no-match': '∅',
};

/** 비정상 상태 한 벌의 렌더. 상태 이름 · 원인 · 복사할 명령을 글로 준다 — 색은 보조다. */
export const StatusNotice = ({
  state,
  level = 2,
  children,
}: {
  state: ViewState;
  level?: 2 | 3;
  children?: ReactNode;
}) => {
  const id = useId();
  const Heading = level === 2 ? 'h2' : 'h3';
  return (
    <section
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-cause`}
      data-state={state.kind}
      className={[
        'flex flex-col gap-xs rounded-lg border bg-background-surface p-lg',
        state.kind === 'error' ? 'border-stroke-error' : 'border-stroke-light',
      ].join(' ')}
    >
      <p className="flex items-center gap-xs typo-caption-small text-text-light">
        <span aria-hidden>{ICON[state.kind]}</span>
        {VIEW_STATE_LABEL[state.kind]}
      </p>
      <Heading id={`${id}-title`} className="typo-body-small-strong text-text-default">
        {state.title}
      </Heading>
      <p
        id={`${id}-cause`}
        className="typo-body-small break-keep whitespace-pre-wrap text-text-light"
      >
        {state.cause}
      </p>
      {state.commands.length > 0 && (
        <List className="mt-xs flex flex-col gap-xs">
          {state.commands.map((command) => (
            <ListItem key={command}>
              <CopyCommand command={command} />
            </ListItem>
          ))}
        </List>
      )}
      {children}
    </section>
  );
};
