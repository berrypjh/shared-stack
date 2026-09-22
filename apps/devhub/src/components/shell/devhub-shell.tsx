import {
  DevHubShell as Shell,
  Explorer,
  type ExplorerGroup,
  type ExplorerSection,
  TopBar,
  type TopBarView,
} from '@berrypjh/devhub-ui';

import type { ReactNode } from 'react';

import { catalog } from '@/data';
import { type Section, SECTIONS, VIEWS } from '@/lib/catalog/entities';
import { SNAPSHOT } from '@/lib/repository/current-snapshot';

import { SnapshotSummary } from '../overview/snapshot-summary';
import { SECTION_ICON, VIEW_ICON } from '../ui/view-icons';

import { GlobalSearch } from './global-search';

/** 상단 바의 보기. 개요만 그 주소에서만 현재이고, 섹션 보기는 그 섹션의 항목 주소에서도 현재다. */
const TOP_VIEWS: TopBarView[] = VIEWS.map((view) => ({
  id: view.id,
  label: view.label,
  href: view.path,
  icon: VIEW_ICON[view.id],
  exact: view.path === '/',
}));

/** 탐색기의 섹션 없는 보기(개요 · 아키텍처). */
const EXPLORER_VIEWS = VIEWS.filter((view) => !view.section).map((view) => ({
  id: view.id,
  label: view.label,
  href: view.path,
  icon: VIEW_ICON[view.id],
}));

/** 묶음(`group`)이 있는 섹션은 묶음마다 작은 제목을 단다. 순서는 카탈로그에서 온 그대로다. */
const groupsOf = (section: Section): ExplorerGroup[] => {
  const code = section.id === 'documents';
  const items = (entities: Section['entities']) =>
    entities.map((entity) => ({ id: entity.id, label: entity.label, href: entity.href, code }));
  const groups = [...new Set(section.entities.map((entity) => entity.group))];
  if (groups.length === 1 && groups[0] === undefined) return [{ items: items(section.entities) }];
  return groups.map((title) => ({
    title,
    items: items(section.entities.filter((entity) => entity.group === title)),
  }));
};

const EXPLORER_SECTIONS: ExplorerSection[] = SECTIONS.map((section) => ({
  id: section.id,
  title: section.title,
  href: section.path,
  icon: SECTION_ICON[section.id],
  groups: groupsOf(section),
}));

/**
 * 이 저장소의 셸: 카탈로그에서 유도한 보기 · 섹션 · 항목(`lib/catalog/entities.ts`)을 devhub-ui 의 셸에 넘긴다.
 * route 가 바뀌어도 셸은 그대로 남는다(레이아웃 route). `children` 은 page 가 그리는 `<main>` 과 `<aside>` 다.
 */
export const DevHubShell = ({ children }: { children: ReactNode }) => (
  <Shell
    topBar={
      <TopBar
        views={TOP_VIEWS}
        summary={
          <>
            <span className="devhub-code">
              {catalog.repository.owner}/{catalog.repository.name}
            </span>{' '}
            · <SnapshotSummary snapshot={SNAPSHOT} />
          </>
        }
        search={<GlobalSearch />}
      />
    }
    explorer={<Explorer views={EXPLORER_VIEWS} sections={EXPLORER_SECTIONS} />}
  >
    {children}
  </Shell>
);
