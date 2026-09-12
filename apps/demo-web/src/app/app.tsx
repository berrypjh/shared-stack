import { Route, Routes } from 'react-router-dom';

import { ButtonPage } from './pages/ButtonPage';
import { FabPage } from './pages/FabPage';
import { FoundationPage } from './pages/FoundationPage';
import { IconButtonPage } from './pages/IconButtonPage';
import { OverviewPage } from './pages/OverviewPage';
import { PopoverPage } from './pages/PopoverPage';
import { SearchFieldPage } from './pages/SearchFieldPage';
import { SelectPage } from './pages/SelectPage';
import { StackPage } from './pages/StackPage';
import { TextFieldPage } from './pages/TextFieldPage';
import { TokensPage } from './pages/TokensPage';
import { VerifyPage } from './pages/VerifyPage';
import { AppShell } from './shell/AppShell';

import '@berrypjh/react-ui/styles.css';

export const App = () => (
  <AppShell>
    <Routes>
      <Route path="/" element={<OverviewPage />} />
      <Route path="/verify" element={<VerifyPage />} />
      <Route path="/tokens" element={<TokensPage />} />
      <Route path="/foundation" element={<FoundationPage />} />
      <Route path="/components/button" element={<ButtonPage />} />
      <Route path="/components/text-field" element={<TextFieldPage />} />
      <Route path="/components/select" element={<SelectPage />} />
      <Route path="/components/search-field" element={<SearchFieldPage />} />
      <Route path="/components/fab" element={<FabPage />} />
      <Route path="/components/icon-button" element={<IconButtonPage />} />
      <Route path="/components/stack" element={<StackPage />} />
      <Route path="/components/popover" element={<PopoverPage />} />
    </Routes>
  </AppShell>
);

export default App;
