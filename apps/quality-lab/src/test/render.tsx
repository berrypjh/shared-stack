/** test 전용. 실제 App·router·loader 로 렌더하고 fetch 만 파일 map 으로 바꾼다. */
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { App } from '../app/app';

import { fakeFetch, SHA } from './fixtures';

export const renderApp = (path: string, files: Record<string, unknown>, expectedSha = SHA) => {
  const { fetcher, calls } = fakeFetch(files);
  const router = createMemoryRouter(
    [{ path: '*', element: <App fetcher={fetcher} expectedSha={expectedSha} /> }],
    { initialEntries: [path] },
  );
  const user = userEvent.setup();
  const view = render(<RouterProvider router={router} />);
  return { ...view, router, user, calls };
};

export const locationOf = (router: ReturnType<typeof createMemoryRouter>) =>
  `${router.state.location.pathname}${router.state.location.search}`;
