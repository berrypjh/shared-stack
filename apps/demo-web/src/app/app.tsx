import { useState } from 'react';

import type { ThemeName } from '@berrypjh/react-ui';

import { Route, Routes } from 'react-router-dom';

import { ButtonPage } from './pages/ButtonPage';
import { DividerPage } from './pages/DividerPage';
import { FabPage } from './pages/FabPage';
import { IconButtonPage } from './pages/IconButtonPage';
import { OverviewPage } from './pages/OverviewPage';
import { PalettePage } from './pages/PalettePage';
import { PopoverPage } from './pages/PopoverPage';
import { ScalesPage } from './pages/ScalesPage';
import { SearchFieldPage } from './pages/SearchFieldPage';
import { SelectPage } from './pages/SelectPage';
import { StackPage } from './pages/StackPage';
import { TextFieldPage } from './pages/TextFieldPage';
import { TokensPage } from './pages/TokensPage';
import { VerifyPage } from './pages/VerifyPage';
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

/**
 * theme 의 single source. `AppShell` 의 `ThemeProvider` 가 shell 과 content 를 함께 감싼다.
 * 페이지는 이름이 필요하면 `useCurrentTheme` 으로 적용된 `data-theme` 을 읽는다.
 */
export const App = () => {
  const [theme, setTheme] = useState<ThemeName>('light');

  return (
    <AppShell theme={theme} onThemeChange={setTheme}>
      <Routes>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/tokens" element={<TokensPage />} />
        <Route path="/palette" element={<PalettePage />} />
        <Route path="/scales" element={<ScalesPage />} />
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
    </AppShell>
  );
};

export default App;
