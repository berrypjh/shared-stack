import { type ReactNode, useId } from 'react';

import { List, ListItem } from '@berrypjh/react-ui';

import { VIEW_STATE_LABEL, type ViewState, type ViewStateKind } from '../data/status';

import { CopyCommand } from './CopyCommand';

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

/** 비정상 상태 한 벌의 렌더. 상태 이름·원인·복사할 명령을 글로 준다 — 색은 보조다. */
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
        'flex flex-col gap-xs rounded-md p-lg bg-background-surface border',
        state.kind === 'error' ? 'border-stroke-error' : 'border-stroke-default',
      ].join(' ')}
    >
      <p className="flex items-center gap-xs text-text-light text-xxsm font-semiBold">
        <span aria-hidden>{ICON[state.kind]}</span>
        {VIEW_STATE_LABEL[state.kind]}
      </p>
      <Heading id={`${id}-title`} className="text-text-default text-sm leading-sm font-semiBold">
        {state.title}
      </Heading>
      <p
        id={`${id}-cause`}
        className="text-text-light text-xsm leading-xsm break-keep whitespace-pre-wrap"
      >
        {state.cause}
      </p>
      {state.commands.length > 0 && (
        <List className="flex flex-col gap-xs mt-xs">
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
