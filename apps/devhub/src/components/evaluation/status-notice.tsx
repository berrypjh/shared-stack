import { StatusNotice as Notice } from '@berrypjh/devhub-ui';

import type { ReactNode } from 'react';

import { VIEW_STATE_LABEL, type ViewState, type ViewStateKind } from '@/lib/evaluation/status';

const ICON: Record<ViewStateKind, string> = {
  empty: '○',
  loading: '…',
  error: '✕',
  partial: '◐',
  unsupported: '⊘',
  stale: '⟳',
  'no-match': '∅',
};

/** 평가 화면의 비정상 상태 한 벌을 devhub-ui 의 `StatusNotice` 로 — 상태 이름 · 아이콘은 여기서 정한다. */
export const StatusNotice = ({
  state,
  level = 2,
  children,
}: {
  state: ViewState;
  level?: 2 | 3;
  children?: ReactNode;
}) => (
  <Notice
    kind={state.kind}
    kindLabel={VIEW_STATE_LABEL[state.kind]}
    icon={ICON[state.kind]}
    title={state.title}
    cause={state.cause}
    commands={state.commands}
    tone={state.kind === 'error' ? 'error' : 'default'}
    level={level}
  >
    {children}
  </Notice>
);
