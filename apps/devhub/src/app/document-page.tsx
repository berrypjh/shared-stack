import { Suspense } from 'react';

import { Inspector, useDocumentTitle, WorkspaceFrame, WorkspaceHeader } from '@berrypjh/devhub-ui';

import { useParams } from 'react-router-dom';

import { DocumentBody } from '@/components/doc/document-body';
import { DocumentInspector } from '@/components/doc/document-inspector';
import { EntityNotFound, placeOf } from '@/components/entity/entity-not-found';
import { SECTION_ICON } from '@/components/ui/view-icons';
import { findEntity, findSection } from '@/lib/catalog/entities';

/** `/documents/<id>`: 저장소 문서 본문(build 시점에 묶인 원문)과 그 근거 · 역참조. */
export const DocumentPage = () => {
  const { id = '' } = useParams();
  const section = findSection('documents');
  const entity = findEntity('documents', id);
  useDocumentTitle(entity ? entity.label : `${section.title}에 없는 항목`);
  if (!entity || entity.section !== 'documents')
    return <EntityNotFound section={placeOf(section)} id={id} />;

  const doc = entity.record;
  return (
    <>
      <WorkspaceFrame>
        <WorkspaceHeader
          eyebrow={section.title}
          icon={SECTION_ICON[section.id]}
          title={entity.label}
        />
        <p className="typo-body-small text-text-light">{doc.title}</p>
        <Suspense
          key={doc.id}
          fallback={
            <p role="status" className="typo-body-small text-text-light">
              문서를 불러오는 중입니다
            </p>
          }
        >
          <DocumentBody doc={doc} />
        </Suspense>
      </WorkspaceFrame>
      <Inspector>
        <DocumentInspector doc={doc} />
      </Inspector>
    </>
  );
};
