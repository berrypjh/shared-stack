import { CopyButton, Icon } from '@berrypjh/devhub-ui';
import { VisuallyHidden } from '@berrypjh/react-ui';

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
 * 저장소 경로 한 줄: 이름이 링크(스냅샷 커밋 고정), 경로 복사, 폴더는 흐리게, symbol 은 글자로,
 * 고정한 커밋. 링크를 만들 수 없거나 브랜치로 대신 이었으면 그 이유를 쓴다 — 추측한 주소를 만들지 않는다.
 */
export const FileRow = ({ source, label }: { source: SourceRef; label?: string }) => {
  const link = sourceLink(catalog.repository, SNAPSHOT, source);
  const cut = source.path.lastIndexOf('/');
  const name = source.path.slice(cut + 1) + (source.directory ? '/' : '');
  const folder = cut === -1 ? '' : source.path.slice(0, cut + 1);
  return (
    <li className="flex min-w-0 flex-col gap-2xs">
      <span className="flex flex-wrap items-center gap-x-xs">
        {label && <span className="typo-caption-small text-text-light">{label}</span>}
        {link.href ? (
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2xs text-text-link underline-offset-2 hover:underline"
          >
            <span className="typo-body-small-strong break-all">{name}</span>
            <Icon name="external" />
            <VisuallyHidden> — {source.path}, 저장소에서 보기, 새 창</VisuallyHidden>
          </a>
        ) : (
          <span className="typo-body-small-strong break-all">{name}</span>
        )}
        {/* 파일마다의 동작. 에디터로 열기(dev 전용) · 경로 복사. */}
        <EditorLink path={source.path} />
        <CopyButton text={source.path} label={`경로 복사: ${source.path}`} />
      </span>
      {folder && <span className="devhub-code text-text-light">{folder}</span>}
      {source.symbol && (
        <span className="font-mono typo-caption-small text-text-light">symbol {source.symbol}</span>
      )}
      {link.pinned && SNAPSHOT.commit && (
        <span className="typo-caption-small text-text-light">
          스냅샷 <span className="font-mono">{SNAPSHOT.commit.slice(0, 7)}</span> 에 고정
        </span>
      )}
      {link.gap && <span className="typo-caption-small text-text-warning">{GAP[link.gap]}</span>}
    </li>
  );
};
