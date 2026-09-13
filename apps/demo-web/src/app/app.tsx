import { useState } from 'react';

import type { ThemeName } from '@berrypjh/react-ui';

import { Route, Routes, useLocation } from 'react-router-dom';

import { DesignerUnsupported } from './designer/DesignerUnsupported';
import { DesignerWorkspace } from './designer/DesignerWorkspace';
import { ButtonPage } from './pages/ButtonPage';
import { DividerPage } from './pages/DividerPage';
import { FabPage } from './pages/FabPage';
import { FoundationPage } from './pages/FoundationPage';
import { IconButtonPage } from './pages/IconButtonPage';
import { OverviewPage } from './pages/OverviewPage';
import { PalettePage } from './pages/PalettePage';
import { PopoverPage } from './pages/PopoverPage';
import { SearchFieldPage } from './pages/SearchFieldPage';
import { SelectPage } from './pages/SelectPage';
import { StackPage } from './pages/StackPage';
import { TextFieldPage } from './pages/TextFieldPage';
import { TokensPage } from './pages/TokensPage';
import { VerifyPage } from './pages/VerifyPage';
import { presentationByPath } from './presentation/registry';
import { useViewMode } from './presentation/viewMode';
import { AppShell } from './shell/AppShell';

import '@berrypjh/react-ui/styles.css';

/**
 * 컴포넌트 route 목록. presentation registry 가 이 전부를 덮는지 테스트가 확인한다 —
 * route table 자체를 registry 에서 생성하지는 않는다. 지금 code 보다 복잡해지기만 한다.
 */
export const COMPONENT_ROUTES = [
  '/components/button',
  '/components/text-field',
  '/components/select',
  '/components/search-field',
  '/components/fab',
  '/components/icon-button',
  '/components/stack',
  '/components/divider',
  '/components/popover',
] as const;

/** Developer View. route table 은 view 전환과 무관하게 그대로다. */
const DeveloperRoutes = () => (
  <Routes>
    <Route path="/" element={<OverviewPage />} />
    <Route path="/verify" element={<VerifyPage />} />
    <Route path="/tokens" element={<TokensPage />} />
    <Route path="/palette" element={<PalettePage />} />
    <Route path="/foundation" element={<FoundationPage />} />
    <Route path="/components/button" element={<ButtonPage />} />
    <Route path="/components/text-field" element={<TextFieldPage />} />
    <Route path="/components/select" element={<SelectPage />} />
    <Route path="/components/search-field" element={<SearchFieldPage />} />
    <Route path="/components/fab" element={<FabPage />} />
    <Route path="/components/icon-button" element={<IconButtonPage />} />
    <Route path="/components/stack" element={<StackPage />} />
    <Route path="/components/divider" element={<DividerPage />} />
    <Route path="/components/popover" element={<PopoverPage />} />
  </Routes>
);

/**
 * view mode 분기.
 *
 * Designer route tree 를 따로 만들지 않는다 — pathname 이 component context 의 single source
 * 이고 view mode 는 query 축이라, 같은 URL 을 두 방식으로 그리기만 한다. 그래서 Designer 에
 * 없는 화면도 pathname 을 잃지 않는다.
 */
const ViewBoundary = ({ theme }: { theme: ThemeName }) => {
  const [viewMode] = useViewMode();
  const { pathname } = useLocation();

  if (viewMode === 'developer') return <DeveloperRoutes />;

  const presentation = presentationByPath(pathname);
  return presentation ? (
    <DesignerWorkspace presentation={presentation} theme={theme} />
  ) : (
    <DesignerUnsupported pathname={pathname} />
  );
};

/**
 * theme 의 single source. Developer 와 Designer 가 하나의 state 를 공유하도록 여기서 들고 있고,
 * `AppShell` 의 `ThemeProvider` 가 shell 과 content 를 함께 감싼다.
 *
 * Token Inspector 는 `data-theme` 캐스케이드만으로는 부족하다 — 어떤 theme 의 값을 읽어야
 * 하는지 **이름**이 필요하므로 boundary 로 함께 내린다.
 */
export const App = () => {
  const [theme, setTheme] = useState<ThemeName>('light');

  return (
    <AppShell theme={theme} onThemeChange={setTheme}>
      <ViewBoundary theme={theme} />
    </AppShell>
  );
};

export default App;
