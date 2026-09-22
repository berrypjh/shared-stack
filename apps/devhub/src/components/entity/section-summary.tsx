import { WorkspaceSection } from '@berrypjh/devhub-ui';
import { List, ListItem } from '@berrypjh/react-ui';

import { Link } from 'react-router-dom';

import type { Entity, Section } from '@/lib/catalog/entities';
import { APP_ROLE, PLATFORM, VISIBILITY } from '@/lib/catalog/labels';

import { LINK } from '../ui/entity-link';

/** 항목 한 줄의 보조 글. 카탈로그 필드를 그대로 글자로 옮긴다. */
const captionOf = (entity: Entity) => {
  switch (entity.section) {
    case 'journeys':
      return [
        entity.record.platform && PLATFORM[entity.record.platform],
        `단계 ${entity.record.steps.length}개`,
        entity.record.goal,
      ]
        .filter(Boolean)
        .join(' · ');
    case 'applications':
      return `${APP_ROLE[entity.record.role]} · ${PLATFORM[entity.record.platform]}`;
    case 'packages':
      return `${entity.record.packageName} · ${VISIBILITY[entity.record.visibility]} · ${PLATFORM[entity.record.platform]}`;
    case 'engineering':
      return entity.record.root;
    case 'documents':
      return entity.record.title;
    case 'records':
      return entity.record.summary;
  }
};

/** 탐색기 섹션 하나의 가운데 화면. 항목 전부를 링크로, 묶음이 있으면 묶음 제목을 단다. */
export const SectionSummary = ({ section }: { section: Section }) => {
  const groups = [...new Set(section.entities.map((entity) => entity.group))];
  return (
    <WorkspaceSection id="section-list" title={`${section.entities.length}개`}>
      {groups.map((group) => (
        <div key={group ?? 'all'} className="flex flex-col gap-xs">
          {group && <h3 className="typo-caption-small text-text-light">{group}</h3>}
          <List className="flex flex-col divide-y divide-stroke-light">
            {section.entities
              .filter((entity) => entity.group === group)
              .map((entity) => (
                <ListItem key={entity.id} className="flex flex-col gap-2xs py-sm">
                  <Link
                    to={entity.href}
                    className={`typo-body-small ${LINK} ${section.id === 'documents' ? 'font-mono' : ''}`}
                  >
                    {entity.label}
                  </Link>
                  <span className="typo-caption-small text-text-light">{captionOf(entity)}</span>
                </ListItem>
              ))}
          </List>
        </div>
      ))}
    </WorkspaceSection>
  );
};
