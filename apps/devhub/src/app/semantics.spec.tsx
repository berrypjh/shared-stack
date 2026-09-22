import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import App from './app';

/**
 * 화면마다 보조 기술이 기대는 구조: h1 하나, `aria-controls` 가 가리키는 요소, 페이지 안 `#` 링크의 대상.
 * `#` 대상은 포커스를 받을 수 있어야 한다 — 아니면 스크롤만 되고 포커스는 누른 링크에 남는다.
 * 실제 브라우저의 키보드 경로는 `apps/devhub-e2e` 가 본다.
 */
const PAGES = [
  '/',
  '/journeys/token-pipeline/steps/facade',
  '/architecture/react-ui',
  '/packages/react-ui',
  '/engineering',
  '/documents/design-tokens-agents',
  '/records/react-ui-cascade-layers',
  '/sources/libs/design-tokens/src/lib/pipeline.ts',
];

const focusable = (element: HTMLElement) =>
  element.tabIndex >= 0 || element.hasAttribute('tabindex');

let scrollTo: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
});
afterEach(() => scrollTo.mockRestore());

describe.each(PAGES.map((path) => [path]))('%s', (path) => {
  beforeEach(async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={[path]}>
          <App />
        </MemoryRouter>,
      );
    });
  });

  it('has exactly one h1', () => {
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('points every aria-controls at an element that exists', () => {
    const missing = [...document.querySelectorAll('[aria-controls]')]
      .map((element) => element.getAttribute('aria-controls') ?? '')
      .flatMap((ids) => ids.split(/\s+/))
      .filter((id) => id && !document.getElementById(id));
    expect(missing).toEqual([]);
  });

  it('sends every in-page link to an element that exists and can take focus', () => {
    const problems = [...document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')].flatMap(
      (link) => {
        const id = decodeURIComponent(link.getAttribute('href')?.slice(1) ?? '');
        const target = document.getElementById(id);
        if (!target) return [`${id}: 없음`];
        return focusable(target) ? [] : [`${id}: 포커스를 받지 못함`];
      },
    );
    expect(problems).toEqual([]);
  });
});
