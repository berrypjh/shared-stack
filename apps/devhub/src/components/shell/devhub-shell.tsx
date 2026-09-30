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
import { EVALUATION_GROUP, EVALUATION_SCREENS, screenPath } from '@/lib/evaluation/screens';
import { SNAPSHOT } from '@/lib/repository/current-snapshot';

import { SnapshotSummary } from '../overview/snapshot-summary';
import { SECTION_ICON, VIEW_ICON } from '../ui/view-icons';

import { GlobalSearch } from './global-search';

/** 탐색기 맨 위의 섹션 없는 보기(개요 · 아키텍처). 평가는 하위 화면이 있어 아래 섹션으로 둔다. */
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

/** 평가는 작업 흐름 바로 뒤에 선다. */
const [JOURNEYS_SECTION, ...REST_SECTIONS] = EXPLORER_SECTIONS;

/**
 * 평가의 하위 화면. 개요는 섹션 제목이 가리키고, 나머지는 접히는 묶음 하나에 `screens.ts` 순서대로 선다.
 * 평가 안에서는 고른 실행(`?run=`)을 화면을 옮겨도 이어 간다 — 필터는 화면마다 뜻이 달라 가져가지 않는다.
 */
const useEvaluationSection = (): ExplorerSection => {
  const { pathname, search } = useLocation();
  const run = pathname.startsWith(screenPath('overview'))
    ? (new URLSearchParams(search).get('run') ?? undefined)
    : undefined;
  const suffix = queryString({ run });
  const screens = EVALUATION_SCREENS.filter((screen) => screen.id !== 'overview');
  return {
    id: 'evaluation',
    title: '평가',
    href: `${screenPath('overview')}${suffix}`,
    icon: VIEW_ICON.evaluation,
    groups: [
      {
        title: EVALUATION_GROUP,
        items: screens.map((screen) => ({
          id: screen.id,
          label: screen.label,
          href: `${screen.path}${suffix}`,
        })),
      },
    ],
  };
};

/**
 * 이 저장소의 셸: 카탈로그에서 유도한 보기 · 섹션 · 항목(`lib/catalog/entities.ts`)을 devhub-ui 의 셸에 넘긴다.
 * route 가 바뀌어도 셸은 그대로 남는다(레이아웃 route). `children` 은 page 가 그리는 `<main>` 과 `<aside>` 다.
 */
export const DevHubShell = ({ children }: { children: ReactNode }) => {
  const evaluation = useEvaluationSection();
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
      explorer={
        <Explorer
          views={EXPLORER_VIEWS}
          sections={[JOURNEYS_SECTION, evaluation, ...REST_SECTIONS]}
        />
      }
    >
      {children}
    </Shell>
  );
};
