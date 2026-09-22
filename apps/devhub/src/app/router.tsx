import { createElement } from 'react';

import { Outlet, Route, Routes } from 'react-router-dom';

import { DevHubShell } from '@/components/shell/devhub-shell';
import { type SectionId, SECTIONS } from '@/lib/catalog/entities';

import { ApplicationPage } from './application-page';
import { ArchitecturePage } from './architecture-page';
import { DocumentPage } from './document-page';
import { JourneyPage } from './journey-page';
import { RouteNotFound } from './not-found-page';
import { OverviewPage } from './overview-page';
import { PackagePage } from './package-page';
import { RecordPage } from './record-page';
import { SectionPage } from './section-page';
import { SourcePage } from './source-page';
import { ToolPage } from './tool-page';

/** 섹션마다의 항목 화면. 앱 · 패키지 · 도구는 같은 문법(`EntityDetail`)을 쓴다. */
const DETAIL: Record<Exclude<SectionId, 'journeys'>, () => React.JSX.Element> = {
  applications: ApplicationPage,
  packages: PackagePage,
  engineering: ToolPage,
  documents: DocumentPage,
  records: RecordPage,
};

/** 셸은 레이아웃 route 라 이동해도 남는다. page 는 `<main>` 과 `<aside>` 를 그린다. */
const ShellLayout = () => (
  <DevHubShell>
    <Outlet />
  </DevHubShell>
);

/**
 * URL 이 선택의 정본이다.
 *
 * ```
 * /                         개요
 * /journeys                 소비 흐름 목록
 * /journeys/<id>[/steps/<stepId>]  흐름 그림 · 목록 — 단계 선택이 바뀌어도 화면은 남는다
 * /sources/<경로>[#symbol-이름]  저장소 경로 하나 — 인용하는 곳 · symbol
 * /architecture[/<id>]      구조 그림 · 목록 — 노드 선택이 바뀌어도 화면은 남는다
 * /<section>                섹션 항목 (applications · packages · documents · records · engineering)
 * /<section>/<id>           항목 하나 — 카탈로그에 없는 ID 는 "카탈로그에 없는 항목"
 * 그 밖                      "없는 화면"
 * ```
 */
export const AppRoutes = () => (
  <Routes>
    <Route element={<ShellLayout />}>
      <Route index element={<OverviewPage />} />
      <Route path="architecture" element={<ArchitecturePage />}>
        <Route index element={null} />
        <Route path=":nodeId" element={null} />
      </Route>
      <Route path="journeys">
        <Route index element={<SectionPage sectionId="journeys" />} />
        <Route path=":id" element={<JourneyPage />}>
          <Route index element={null} />
          <Route path="steps/:stepId" element={null} />
        </Route>
      </Route>
      {SECTIONS.map(
        ({ id }) =>
          id !== 'journeys' && (
            <Route key={id} path={id}>
              <Route index element={<SectionPage sectionId={id} />} />
              <Route path=":id" element={createElement(DETAIL[id])} />
            </Route>
          ),
      )}
      <Route path="sources/*" element={<SourcePage />} />
      <Route path="*" element={<RouteNotFound />} />
    </Route>
  </Routes>
);
