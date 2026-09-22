import { use } from 'react';

import { bodyOf, DocContent, DocumentLayout, outlineOf } from '@berrypjh/devhub-ui';

import { useLocation } from 'react-router-dom';

import { loadDocument, type ReadableDoc } from '@/lib/markdown/documents';

import { DocLink } from './doc-link';

/** 불러온 문서 본문과 "이 페이지에서". `Suspense` 안에서 쓴다. 링크가 어디로 갈지는 `DocLink` 가 정한다. */
export const DocumentBody = ({ doc }: { doc: ReadableDoc }) => {
  const { hash } = useLocation();
  const body = bodyOf(use(loadDocument(doc.path)));
  return (
    <DocumentLayout outline={outlineOf(body)}>
      <DocContent
        blocks={body}
        title={doc.title}
        hash={hash}
        renderLink={(href, children) => (
          <DocLink doc={doc} href={href}>
            {children}
          </DocLink>
        )}
      />
    </DocumentLayout>
  );
};
