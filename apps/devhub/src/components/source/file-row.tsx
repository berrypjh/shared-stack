import { CopyButton, FileLine } from '@berrypjh/devhub-ui';

import type { ReactNode } from 'react';

import { catalog } from '@/data';
import type { SourceRef } from '@/domain/model';
import { SNAPSHOT } from '@/lib/repository/current-snapshot';
import { type LinkGap, sourceLink } from '@/lib/repository/source-links';

import { EditorLink } from './editor-link';

const GAP: Record<LinkGap, string> = {
  uncommitted: '스냅샷 커밋에 없는 경로(커밋되지 않음) — 링크를 만들지 않았다',
  'unknown-commit': `스냅샷 커밋을 몰라 최신 ${catalog.repository.defaultBranch} 로 연결했다`,
  unverified: '이 경로가 스냅샷 커밋에 있는지 확인하지 못했다',
};

/**
 * 저장소 경로 한 줄의 링크 정책: 이름이 링크(스냅샷 커밋 고정), 폴더는 `base`(묶음의 루트) 아래만,
 * 오른쪽은 에디터 · 경로 복사. 모양은 devhub-ui `FileLine` 이다.
 * 링크를 만들 수 없거나 브랜치로 대신 이었으면 그 이유를 쓴다 — 추측한 주소를 만들지 않는다.
 */
export const FileRow = ({
  source,
  label,
  base,
  symbols = source.symbol ? [source.symbol] : [],
  children,
}: {
  source: SourceRef;
  /** 파일의 역할. 이름 앞에 보인다(`위치`, `설정`). */
  label?: string;
  base?: string;
  /** 이 파일에서 인용한 symbol. 같은 파일을 여러 symbol 로 인용하면 한 줄에 모은다. */
  symbols?: readonly string[];
  children?: ReactNode;
}) => {
  const link = sourceLink(catalog.repository, SNAPSHOT, source);
  const inside =
    base && source.path.startsWith(`${base}/`) ? source.path.slice(base.length + 1) : source.path;
  const cut = inside.lastIndexOf('/');
  const target =
    link.pinned && SNAPSHOT.commit ? `스냅샷 ${SNAPSHOT.commit.slice(0, 7)}` : '저장소';
  return (
    <FileLine
      name={inside.slice(cut + 1) + (source.directory ? '/' : '')}
      folder={cut === -1 ? undefined : inside.slice(0, cut + 1)}
      href={link.href ?? undefined}
      linkDescription={`— ${source.path}, ${target}에서 보기, 새 창`}
      label={label}
      symbols={symbols}
      warning={link.gap && GAP[link.gap]}
      actions={
        <>
          <EditorLink path={source.path} />
          <CopyButton text={source.path} label={`경로 복사: ${source.path}`} />
        </>
      }
    >
      {children}
    </FileLine>
  );
};
