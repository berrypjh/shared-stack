import { lazy, Suspense, useMemo, useState } from 'react';

import { Route, Routes } from 'react-router-dom';

import { type BrowserEnv, realBrowserEnv } from '../probes/env';

import { createClient, type Fetcher } from './data/client';
import { QualityLabProvider } from './data/context';
import { AppShell, type ThemeMode } from './AppShell';
import { type NavPath } from './nav';

import '@berrypjh/react-ui/styles.css';

/** 화면마다 chunk 를 나눈다. run JSON 은 bundle 이 아니라 fetch 로만 온다. */
const PAGES: Record<NavPath, ReturnType<typeof lazy>> = {
  '/': lazy(() =>
    import('./pages/overview/OverviewPage').then((m) => ({ default: m.OverviewPage })),
  ),
  '/quality/tests': lazy(() =>
    import('./pages/quality/TestsPage').then((m) => ({ default: m.TestsPage })),
  ),
  '/quality/checks': lazy(() =>
    import('./pages/quality/ChecksPage').then((m) => ({ default: m.ChecksPage })),
  ),
  '/quality/packages': lazy(() =>
    import('./pages/quality/PackagesPage').then((m) => ({ default: m.PackagesPage })),
  ),
  '/bundles': lazy(() =>
    import('./pages/bundles/BundlesPage').then((m) => ({ default: m.BundlesPage })),
  ),
  '/ai': lazy(() => import('./pages/ai/AiPage').then((m) => ({ default: m.AiPage }))),
  '/design-system': lazy(() =>
    import('./pages/design-system/DesignSystemPage').then((m) => ({
      default: m.DesignSystemPage,
    })),
  ),
  '/accessibility': lazy(() =>
    import('./pages/accessibility/AccessibilityPage').then((m) => ({
      default: m.AccessibilityPage,
    })),
  ),
  '/browser': lazy(() =>
    import('./pages/browser/BrowserPage').then((m) => ({ default: m.BrowserPage })),
  ),
  '/runs': lazy(() => import('./pages/runs/RunsPage').then((m) => ({ default: m.RunsPage }))),
};

const browserFetch: Fetcher = (url, init) => fetch(url, init);

type AppProps = {
  /** 공개 artifact 를 읽는 fetch. test 는 가짜를 넣는다. */
  fetcher?: Fetcher;
  /** freshness 를 비교할 source SHA. */
  expectedSha?: string;
  /** 브라우저 세션 화면이 읽는 API 표면. test 는 가짜를 넣는다. */
  browserEnv?: BrowserEnv;
};

export const App = ({
  fetcher = browserFetch,
  expectedSha = __QUALITY_LAB_SOURCE_SHA__,
  browserEnv,
}: AppProps) => {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const env = useMemo(() => browserEnv ?? realBrowserEnv(), [browserEnv]);
  const value = useMemo(
    () => ({ client: createClient(fetcher, expectedSha), fetcher, expectedSha, browserEnv: env }),
    [fetcher, expectedSha, env],
  );

  return (
    <QualityLabProvider value={value}>
      <AppShell theme={theme} onThemeChange={setTheme}>
        <Suspense
          fallback={
            <p role="status" aria-live="polite" className="text-text-light text-xsm">
              화면을 불러오는 중입니다
            </p>
          }
        >
          <Routes>
            {Object.entries(PAGES).map(([path, Component]) => (
              <Route key={path} path={path} element={<Component />} />
            ))}
            <Route
              path="*"
              element={
                <h1 className="text-text-default text-xxl leading-xxl font-bold">
                  페이지를 찾을 수 없습니다
                </h1>
              }
            />
          </Routes>
        </Suspense>
      </AppShell>
    </QualityLabProvider>
  );
};

export default App;
