import {
  DevHubShell as Shell,
  Explorer,
  type ExplorerGroup,
  type ExplorerSection,
  TopBar,
} from '@berrypjh/devhub-ui';

import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

import { catalog } from '@/data';
import { type Section, SECTIONS, VIEWS } from '@/lib/catalog/entities';
import { queryString } from '@/lib/evaluation/query';
import { SNAPSHOT } from '@/lib/repository/current-snapshot';

import { SnapshotSummary } from '../overview/snapshot-summary';
import { SECTION_ICON, VIEW_ICON } from '../ui/view-icons';

import { GlobalSearch } from './global-search';

/** 탐색기 맨 위의 섹션 없는 보기(개요 · 아키텍처). */
const EXPLORER_VIEWS = VIEWS.map((view) => ({
  id: view.id,
  label: view.label,
  href: view.path,
  icon: VIEW_ICON[view.id],
}));

/**
 * 묶음(`group`)이 있는 섹션은 묶음마다 접고 펴는 제목을 단다. 순서는 카탈로그에서 온 그대로다.
 * 문서는 항목이 많아 접힌 채로 시작하고, 현재 문서가 든 묶음만 펼친다.
 */
const groupsOf = (section: Section): ExplorerGroup[] => {
  const code = section.id === 'documents';
  const collapsed = section.id === 'documents';
  const items = (entities: Section['entities']) =>
    entities.map((entity) => ({
      id: entity.id,
      label: entity.navLabel ?? entity.label,
      href: entity.href,
      code,
    }));
  const groups = [...new Set(section.entities.map((entity) => entity.group))];
  if (groups.length === 1 && groups[0] === undefined) return [{ items: items(section.entities) }];
  return groups.map((title) => ({
    title,
    collapsed,
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
 * 평가 항목에서 고른 실행(`?run=`)은 같은 묶음의 항목으로만 이어 간다 — 묶음마다 담은 실행이 달라서다.
 * 필터는 항목마다 뜻이 달라 가져가지 않는다. 그 밖에서는 카탈로그에서 만든 섹션을 그대로 쓴다.
 */
const useExplorerSections = (): ExplorerSection[] => {
  const { pathname, search } = useLocation();
  const evaluation = SECTIONS.find((section) => section.id === 'evaluation');
  const run =
    evaluation && pathname.startsWith(evaluation.path)
      ? (new URLSearchParams(search).get('run') ?? undefined)
      : undefined;
  if (!run) return EXPLORER_SECTIONS;
  const suffix = queryString({ run });
  return EXPLORER_SECTIONS.map((section) =>
    section.id !== 'evaluation'
      ? section
      : {
          ...section,
          groups: section.groups.map((group) =>
            group.items.some((item) => item.href === pathname)
              ? {
                  ...group,
                  items: group.items.map((item) => ({ ...item, href: `${item.href}${suffix}` })),
                }
              : group,
          ),
        },
  );
};

/**
 * 이 저장소의 셸: 카탈로그에서 유도한 보기 · 섹션 · 항목(`lib/catalog/entities.ts`)을 devhub-ui 의 셸에 넘긴다.
 * route 가 바뀌어도 셸은 그대로 남는다(레이아웃 route). `children` 은 page 가 그리는 `<main>` 과 `<aside>` 다.
 */
export const DevHubShell = ({ children }: { children: ReactNode }) => {
  const sections = useExplorerSections();
  return (
    <Shell
      topBar={
        <TopBar
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
      explorer={<Explorer views={EXPLORER_VIEWS} sections={sections} />}
    >
      {children}
    </Shell>
  );
};
