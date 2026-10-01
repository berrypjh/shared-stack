import { Inspector, useDocumentTitle, WorkspaceFrame, WorkspaceHeader } from '@berrypjh/devhub-ui';

import { RepositoryOverview } from '@/components/overview/repository-overview';
import { VIEW_ICON } from '@/components/ui/view-icons';
import { catalog } from '@/data';

/** `/`: 저장소 전체를 카탈로그와 스냅샷에서만 요약한다. */
export const OverviewPage = () => {
  const { owner, name } = catalog.repository;
  useDocumentTitle('개요');
  return (
    <>
      <WorkspaceFrame>
        <WorkspaceHeader eyebrow="개요" icon={VIEW_ICON.overview} title={`${owner}/${name}`} />
        <RepositoryOverview />
      </WorkspaceFrame>
      <Inspector />
    </>
  );
};
