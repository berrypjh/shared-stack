import {
  DocumentColumn,
  Inspector,
  useDocumentTitle,
  WorkspaceFrame,
  WorkspaceHeader,
} from '@berrypjh/devhub-ui';

import { useParams } from 'react-router-dom';

import { EntityNotFound, placeOf } from '@/components/entity/entity-not-found';
import { PackageInspector } from '@/components/package/package-inspector';
import { Entries, PackageMeta, Relations, Settings } from '@/components/package/package-sections';
import { SECTION_ICON } from '@/components/ui/view-icons';
import { catalog } from '@/data';
import { findEntity, findSection } from '@/lib/catalog/entities';
import { inspect } from '@/lib/catalog/inspection';

/**
 * `/packages/<id>` — 플러그인 화면과 같은 칸과 글자로, 머리(목적 · 이름 · 분류) 뒤에
 * 진입점 · 설정 · 관계를 절로 잇는다. 오른쪽은 근거.
 */
export const PackagePage = () => {
  const { id = '' } = useParams();
  const section = findSection('packages');
  const entity = findEntity('packages', id);
  const inspection = inspect(catalog, id);
  useDocumentTitle(entity ? entity.label : `${section.title}에 없는 항목`);
  if (entity?.section !== 'packages' || !inspection) {
    return <EntityNotFound section={placeOf(section)} id={id} />;
  }
  const pkg = entity.record;
  return (
    <>
      <WorkspaceFrame>
        <DocumentColumn>
          <WorkspaceHeader eyebrow={section.title} icon={SECTION_ICON.packages} title={pkg.id} />
          <div className="flex flex-col gap-lg">
            <p className="typo-paragraph-default">{pkg.purpose}</p>
            <PackageMeta pkg={pkg} />
          </div>
          <Entries inspection={inspection} />
          {pkg.settings && <Settings pkg={pkg} />}
          <Relations inspection={inspection} />
        </DocumentColumn>
      </WorkspaceFrame>
      <Inspector>
        <PackageInspector inspection={inspection} siblings={section.entities} />
      </Inspector>
    </>
  );
};
