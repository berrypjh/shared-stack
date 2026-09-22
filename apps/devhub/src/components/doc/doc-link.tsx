import { Icon } from '@berrypjh/devhub-ui';
import { VisuallyHidden } from '@berrypjh/react-ui';

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { catalog } from '@/data';
import { documentHref, recordHref } from '@/lib/catalog/routes';
import { type LinkSource, resolveDocLink } from '@/lib/markdown/doc-links';
import { SNAPSHOT } from '@/lib/repository/current-snapshot';
import { sourceLink } from '@/lib/repository/source-links';

const LINK = 'text-text-link underline-offset-2 hover:underline';
const hashOf = (anchor?: string) => (anchor ? `#${anchor}` : '');

const External = ({
  href,
  hint,
  children,
}: {
  href: string;
  hint: string;
  children: ReactNode;
}) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className={LINK}>
    {children}
    <Icon name="external" className="ml-2xs inline align-text-top" />
    <VisuallyHidden> ({hint}, 새 창)</VisuallyHidden>
  </a>
);

const Note = ({ children }: { children: ReactNode }) => (
  <span className="typo-caption-small text-text-warning"> [{children}]</span>
);

/**
 * 문서에 적힌 링크. 카탈로그 문서는 앱 안(`/documents/<id>`)으로, 저장소 파일은 스냅샷 커밋의 원격 저장소로 간다.
 * 둘은 모양이 다르다: 소스는 새 창 표시가 붙는다. 깨진 링크는 숨기지 않고 글과 이유를 그대로 보인다.
 */
export const DocLink = ({
  doc,
  href,
  children,
}: {
  doc: LinkSource;
  href: string;
  children: ReactNode;
}) => {
  const link = resolveDocLink(catalog, doc, href);
  switch (link.kind) {
    case 'external':
      return (
        <External href={link.href} hint="외부 주소">
          {children}
        </External>
      );
    case 'anchor':
      return (
        <a href={`#${link.anchor}`} className={LINK}>
          {children}
        </a>
      );
    case 'document':
      return (
        <Link to={`${documentHref(link.id)}${hashOf(link.anchor)}`} className={LINK}>
          {children}
        </Link>
      );
    case 'record':
      return (
        <Link to={`${recordHref(link.id)}${hashOf(link.anchor)}`} className={LINK}>
          {children}
        </Link>
      );
    case 'source': {
      const target = sourceLink(catalog.repository, SNAPSHOT, link.ref);
      if (!target.href) {
        return (
          <span>
            {children}
            <Note>커밋되지 않은 경로 — 링크 없음</Note>
          </span>
        );
      }
      return (
        <>
          <External
            href={`${target.href}${hashOf(link.anchor)}`}
            hint={`저장소 파일 ${link.ref.path}`}
          >
            {children}
          </External>
          {target.gap === 'unknown-commit' && (
            <Note>커밋을 몰라 {catalog.repository.defaultBranch} 브랜치로 연결</Note>
          )}
        </>
      );
    }
    case 'broken':
      return (
        <span>
          {children}
          <Note>
            깨진 링크: <span className="font-mono">{link.path}</span> — {link.note}
          </Note>
        </span>
      );
  }
};
