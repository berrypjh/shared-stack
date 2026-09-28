import { createElement } from 'react';

import { Outlet, Route, Routes } from 'react-router-dom';

import { EvaluationProvider } from '@/components/evaluation/evaluation-provider';
import { DevHubShell } from '@/components/shell/devhub-shell';
import { type SectionId, SECTIONS } from '@/lib/catalog/entities';
import { EVALUATION_SCREENS, type ScreenId } from '@/lib/evaluation/screens';

import { ArchitecturePage } from './architecture-page';
import { DocumentPage } from './document-page';
import { EvaluationAccessibilityPage } from './evaluation-accessibility-page';
import { EvaluationAiPage } from './evaluation-ai-page';
import { EvaluationBundlesPage } from './evaluation-bundles-page';
import { EvaluationDesignSystemPage } from './evaluation-design-system-page';
import { EvaluationOverviewPage } from './evaluation-overview-page';
import { JourneyPage } from './journey-page';
import { RouteNotFound } from './not-found-page';
import { OverviewPage } from './overview-page';
import { PackagePage } from './package-page';
import { RecordPage } from './record-page';
import { SectionPage } from './section-page';
import { SourcePage } from './source-page';

/** 섹션마다의 항목 화면. */
const DETAIL: Record<Exclude<SectionId, 'journeys'>, () => React.JSX.Element> = {
  packages: PackagePage,
  documents: DocumentPage,
  records: RecordPage,
};

/** 평가의 화면. 주소 · 이름은 `lib/evaluation/screens.ts` 가 정하고 여기는 화면만 잇는다. */
const EVALUATION: Record<ScreenId, () => React.JSX.Element> = {
  overview: EvaluationOverviewPage,
  bundles: EvaluationBundlesPage,
  ai: EvaluationAiPage,
  'design-system': EvaluationDesignSystemPage,
  accessibility: EvaluationAccessibilityPage,
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
 * /evaluation[/<화면>]       평가 — export 한 공개 JSON 을 계약으로 검증해 보인다(화면은 screens.ts)
 * /architecture[/<id>]      구조 그림 · 목록 — 노드 선택이 바뀌어도 화면은 남는다. 앱 · 도구는 여기가 자기 화면이다
 * /<section>                섹션 항목 (packages · documents · records)
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
      <Route
        path="evaluation"
        element={
          <EvaluationProvider>
            <Outlet />
          </EvaluationProvider>
        }
      >
        {EVALUATION_SCREENS.map(({ id, path }) =>
          id === 'overview' ? (
            <Route key={id} index element={createElement(EVALUATION[id])} />
          ) : (
            <Route
              key={id}
              path={path.slice('/evaluation/'.length)}
              element={createElement(EVALUATION[id])}
            />
          ),
        )}
      </Route>
      <Route path="sources/*" element={<SourcePage />} />
      <Route path="*" element={<RouteNotFound />} />
    </Route>
  </Routes>
);
