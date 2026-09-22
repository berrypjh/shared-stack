import {
  type IconName,
  Inspector,
  useDocumentTitle,
  WorkspaceFrame,
  WorkspaceHeader,
} from '@berrypjh/devhub-ui';

import { Link } from 'react-router-dom';

import type { Section } from '@/lib/catalog/entities';

import { LINK } from '../ui/entity-link';
import { SECTION_ICON } from '../ui/view-icons';

/** 항목을 고르는 화면(섹션 · 아키텍처). `path` 가 그 화면의 목록 주소다. */
export type Place = { title: string; path: string; icon: IconName };

/** 섹션을 그 목록 화면으로. */
export const placeOf = (section: Section): Place => ({
  title: section.title,
  path: section.path,
  icon: SECTION_ICON[section.id],
});

/** 화면은 있지만 그 ID 의 항목이 카탈로그에 없다. */
export const EntityNotFound = ({ section, id }: { section: Place; id: string }) => {
  useDocumentTitle(`${section.title}에 없는 항목`);
  return (
    <>
      <WorkspaceFrame>
        <WorkspaceHeader eyebrow={section.title} icon={section.icon} title="카탈로그에 없는 항목" />
        <p className="typo-body-small">
          {section.title}에 <span className="devhub-code">{id}</span> 항목이 없습니다. 이름이
          바뀌었거나 카탈로그에 등록되지 않았습니다.
        </p>
        <Link to={section.path} className={`typo-body-small ${LINK}`}>
          {section.title} 목록으로 가기
        </Link>
      </WorkspaceFrame>
      <Inspector />
    </>
  );
};
