import { CopyButton, type RemoteView, SourceActions as Actions } from '@berrypjh/devhub-ui';

import type { ReactNode } from 'react';

import { catalog } from '@/data';
import type { SourceRef } from '@/domain/model';
import { SNAPSHOT } from '@/lib/repository/current-snapshot';
import { latestLink, sourceLink } from '@/lib/repository/source-links';

import { EditorLink } from './editor-link';

const host = new URL(catalog.repository.webUrl).host;

/**
 * 문서 · 기록 머리의 경로 줄: 경로 칩 · 에디터 · 복사, 아래 줄은 스냅샷 커밋 보기와 최신 기본
 * 브랜치 보기. 커밋에 없는 경로는 링크 대신 이유를 쓴다.
 */
export const SourceActions = ({ source, lead }: { source: SourceRef; lead?: ReactNode }) => {
  const pinned = sourceLink(catalog.repository, SNAPSHOT, source);
  const latest = latestLink(catalog.repository, SNAPSHOT, source);
  const branch = catalog.repository.defaultBranch;
  const views: RemoteView[] = [
    ...(pinned.pinned && pinned.href && SNAPSHOT.commit
      ? [
          {
            href: pinned.href,
            label: `${host}에서 보기 @ ${SNAPSHOT.commit.slice(0, 7)}`,
            icon: 'commit' as const,
          },
        ]
      : []),
    ...(latest
      ? [{ href: latest, label: `최신 ${branch}에서 보기`, icon: 'branch' as const }]
      : []),
  ];
  return (
    <Actions
      path={source.path}
      lead={lead}
      views={views}
      warning={
        pinned.gap === 'uncommitted'
          ? '스냅샷 커밋에 없는 경로(커밋되지 않음) — 링크를 만들지 않았음'
          : undefined
      }
      actions={
        <>
          <EditorLink path={source.path} />
          <CopyButton text={source.path} label={`경로 복사: ${source.path}`} />
        </>
      }
    />
  );
};
