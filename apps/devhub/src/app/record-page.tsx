import { Suspense } from 'react';

import {
  Inspector,
  RecordMeta,
  useDocumentTitle,
  WorkspaceFrame,
  WorkspaceHeader,
} from '@berrypjh/devhub-ui';

import { useParams } from 'react-router-dom';

import { DocumentBody } from '@/components/doc/document-body';
import { EntityNotFound, placeOf } from '@/components/entity/entity-not-found';
import { RecordInspector } from '@/components/entity/record-inspector';
import { SECTION_ICON } from '@/components/ui/view-icons';
import { findEntity, findSection } from '@/lib/catalog/entities';
import { RECORD_KIND } from '@/lib/catalog/labels';

/** `/records/<id>`: 개발 기록 한 편. 본문은 문서와 같은 방식으로 묶인 원문이고, 근거는 옆 칸이다. */
export const RecordPage = () => {
  const { id = '' } = useParams();
  const section = findSection('records');
  const entity = findEntity('records', id);
  useDocumentTitle(entity ? entity.label : `${section.title}에 없는 항목`);
  if (!entity || entity.section !== 'records') {
    return <EntityNotFound section={placeOf(section)} id={id} />;
  }

  const record = entity.record;
  return (
    <>
      <WorkspaceFrame>
        <WorkspaceHeader
          eyebrow={section.title}
          icon={SECTION_ICON[section.id]}
          title={record.title}
        />
        <RecordMeta date={record.date} kind={RECORD_KIND[record.kind]} />
        <Suspense
          key={record.id}
          fallback={
            <p role="status" className="typo-body-small text-text-light">
              기록을 불러오는 중입니다
            </p>
          }
        >
          <DocumentBody doc={record} />
        </Suspense>
      </WorkspaceFrame>
      <Inspector>
        <RecordInspector record={record} />
      </Inspector>
    </>
  );
};
