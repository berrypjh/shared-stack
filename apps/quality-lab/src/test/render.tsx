/** test 전용. 실제 App·router·loader 로 렌더하고 fetch·브라우저 API 만 가짜로 바꾼다. */
import { StrictMode } from 'react';

import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { App } from '../app/app';
import type { BrowserEnv } from '../probes/env';

import { fakeEnv } from './browser';
import { fakeFetch, SHA } from './fixtures';

type Options = { browserEnv?: BrowserEnv; strict?: boolean };

export const renderApp = (
  path: string,
  files: Record<string, unknown>,
  expectedSha = SHA,
  { browserEnv = fakeEnv(), strict = false }: Options = {},
) => {
  const { fetcher, calls } = fakeFetch(files);
  const router = createMemoryRouter(
    [
      {
        path: '*',
        element: <App fetcher={fetcher} expectedSha={expectedSha} browserEnv={browserEnv} />,
      },
    ],
    { initialEntries: [path] },
  );
  const user = userEvent.setup();
  const tree = <RouterProvider router={router} />;
  const view = render(strict ? <StrictMode>{tree}</StrictMode> : tree);
  return { ...view, router, user, calls };
};

export const locationOf = (router: ReturnType<typeof createMemoryRouter>) =>
  `${router.state.location.pathname}${router.state.location.search}`;
