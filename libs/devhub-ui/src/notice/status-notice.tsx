'use client';

import { type ReactNode, useId } from 'react';

import { List, ListItem } from '@berrypjh/react-ui';

import { CopyCommand } from '../doc/copy-command';

/**
 * 값 대신 보이는 상태 한 벌 — 상태 이름 · 제목 · 원인 · 로컬에서 실행할 명령. 뜻은 글이 전하고 색과
 * 아이콘은 보조다. 상태의 종류와 이름은 앱이 정한다 (`kind` 는 `data-state` 로 남아 테스트 · 테마가 읽는다).
 */
export const StatusNotice = ({
  kind,
  kindLabel,
  icon,
  title,
  cause,
  commands = [],
  tone = 'default',
  level = 2,
  children,
}: {
  kind: string;
  kindLabel: string;
  /** 상태 이름 앞의 장식 글리프. 보조기술에는 숨긴다. */
  icon?: string;
  title: string;
  cause: string;
  commands?: string[];
  tone?: 'default' | 'error';
  level?: 2 | 3;
  children?: ReactNode;
}) => {
  const id = useId();
  const Heading = level === 2 ? 'h2' : 'h3';
  return (
    <section
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-cause`}
      data-state={kind}
      className={[
        'flex flex-col gap-xs rounded-lg border bg-background-surface p-lg',
        tone === 'error' ? 'border-stroke-error' : 'border-stroke-light',
      ].join(' ')}
    >
      <p className="flex items-center gap-xs typo-caption-small text-text-light">
        {icon && <span aria-hidden>{icon}</span>}
        {kindLabel}
      </p>
      <Heading id={`${id}-title`} className="typo-body-small-strong text-text-default">
        {title}
      </Heading>
      <p
        id={`${id}-cause`}
        className="typo-body-small break-keep whitespace-pre-wrap text-text-light"
      >
        {cause}
      </p>
      {commands.length > 0 && (
        <List className="mt-xs flex flex-col gap-xs">
          {commands.map((command) => (
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
