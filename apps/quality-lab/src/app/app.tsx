import { useState } from 'react';

import { Route, Routes } from 'react-router-dom';

import type { Fetcher } from './data/loadObservability';
import { AppShell, type ThemeMode } from './AppShell';
import { OverviewPage, RunsPage } from './pages';

import '@berrypjh/react-ui/styles.css';

const browserFetch: Fetcher = (url, init) => fetch(url, init);

type AppProps = {
  /** 공개 artifact 를 읽는 fetch. test 는 가짜를 넣는다. */
  fetcher?: Fetcher;
  /** freshness 를 비교할 source SHA. */
  expectedSha?: string;
};

export const App = ({
  fetcher = browserFetch,
  expectedSha = __QUALITY_LAB_SOURCE_SHA__,
}: AppProps) => {
  const [theme, setTheme] = useState<ThemeMode>('light');

  return (
    <AppShell theme={theme} onThemeChange={setTheme}>
      <Routes>
        <Route path="/" element={<OverviewPage fetcher={fetcher} expectedSha={expectedSha} />} />
        <Route path="/runs" element={<RunsPage fetcher={fetcher} expectedSha={expectedSha} />} />
      </Routes>
    </AppShell>
  );
};

export default App;
