/** test 전용. 실제 App · route 로 평가 화면을 렌더하고 fetch 와 기준 SHA 만 가짜로 바꾼다. */
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';

import App from '@/app/app';
import { EvaluationSourceContext } from '@/components/evaluation/evaluation-provider';

import { fakeFetch, SHA } from './fixtures';

type Options = {
  expectedSha?: string;
  /** router 안에서 앱을 감싼다. 테스트가 router hook(예: `useNavigate`)을 꺼낼 때 쓴다. */
  wrap?: (app: ReactNode) => ReactNode;
};

/**
 * `path` 로 앱을 열고 `files`(URL → 본문)만 응답한다. 없는 URL 은 404 다.
 * `location()` 은 지금 주소(경로 · query · hash), `calls` 는 요청한 URL 이다.
 */
export const renderEvaluation = (
  path: string,
  files: Record<string, unknown>,
  { expectedSha = SHA, wrap = (app) => app }: Options = {},
) => {
  if (!vi.isMockFunction(window.scrollTo)) {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  }
  const { fetcher, calls } = fakeFetch(files);
  let current = '';
  const Probe = () => {
    const { pathname, search, hash } = useLocation();
    current = `${pathname}${search}${hash}`;
    return null;
  };
  const user = userEvent.setup();
  const view = render(
    <MemoryRouter initialEntries={[path]}>
      <EvaluationSourceContext value={{ fetcher, expectedSha }}>
        <Probe />
        {wrap(<App />)}
      </EvaluationSourceContext>
    </MemoryRouter>,
  );
  return { ...view, user, calls, location: () => current };
};
