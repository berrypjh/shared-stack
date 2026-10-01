import { Inspector, useDocumentTitle, WorkspaceFrame, WorkspaceHeader } from '@berrypjh/devhub-ui';

import { RecordList } from '@/components/entity/record-list';
import { SectionSummary } from '@/components/entity/section-summary';
import { SECTION_ICON } from '@/components/ui/view-icons';
import { findSection, type SectionId } from '@/lib/catalog/entities';

/** `/<section>`: 섹션 항목 전부. 기록은 최신순 목록이다. */
export const SectionPage = ({ sectionId }: { sectionId: SectionId }) => {
  const section = findSection(sectionId);
  useDocumentTitle(section.title);
  return (
    <>
      <WorkspaceFrame>
        <WorkspaceHeader eyebrow="섹션" icon={SECTION_ICON[section.id]} title={section.title} />
        {sectionId === 'records' ? <RecordList /> : <SectionSummary section={section} />}
      </WorkspaceFrame>
      <Inspector />
    </>
  );
};
