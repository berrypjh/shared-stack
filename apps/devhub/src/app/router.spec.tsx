import { INSPECTOR_ID, MAIN_CONTENT_ID } from '@berrypjh/devhub-ui';

import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';

import { SECTIONS, VIEWS } from '@/lib/catalog/entities';

import App from './app';

let navigate: (to: string) => void = () => undefined;
const Navigator = () => {
  navigate = useNavigate();
  return null;
};

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Navigator />
      <App />
    </MemoryRouter>,
  );

const h1 = () => screen.getByRole('heading', { level: 1 }).textContent;
const views = () => within(screen.getByRole('navigation', { name: '보기' }));
const explorerNav = () => screen.getByRole('navigation', { name: '저장소 항목' });
const start = () => document.querySelector('[data-focus-start]');

let scrollTo: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
});
afterEach(() => scrollTo.mockRestore());

describe('routes', () => {
  it.each([
    ['/', 'berrypjh/shared-stack'],
    ['/architecture', '현재 구조'],
    ['/applications', '애플리케이션'],
    ['/applications/devhub', 'devhub'],
    ['/packages', '패키지'],
    ['/packages/react-ui', 'react-ui'],
    ['/engineering', '엔지니어링'],
    ['/engineering/berry-commit', 'berry-commit'],
    ['/documents', '문서'],
    ['/documents/root-readme', 'README.md'],
    ['/records', '기록'],
    ['/records/bash-guard-hook', 'AI 세션의 Bash 를 PreToolUse hook 으로 가드'],
  ])('opens %s directly', async (path, heading) => {
    // 문서 본문은 원문을 기다린다 — 멈춘 컴포넌트가 다시 그려지도록 `await act`.
    await act(async () => {
      renderAt(path);
    });
    expect(h1()).toBe(heading);
  });

  it('names the document after the screen', () => {
    renderAt('/packages/react-ui');
    expect(document.title).toBe('react-ui · Shared Stack DevHub');
  });

  it('tells an unknown address apart from an unknown catalog entry', () => {
    renderAt('/no-such-screen');
    expect(h1()).toBe('없는 화면');
    expect(screen.getByText('/no-such-screen')).toBeTruthy();

    act(() => navigate('/packages/no-such-package'));
    expect(h1()).toBe('카탈로그에 없는 항목');
    expect(screen.getByText('no-such-package')).toBeTruthy();
    expect(screen.getByRole('link', { name: '패키지 목록으로 가기' }).getAttribute('href')).toBe(
      '/packages',
    );

    act(() => navigate('/packages/react-ui/extra'));
    expect(h1()).toBe('없는 화면');
  });
});

describe('navigation data', () => {
  it('draws the top views and the explorer from one list', () => {
    renderAt('/');
    const top = views()
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'));
    expect(top).toEqual(VIEWS.map((view) => view.path));
    expect(VIEWS.map((view) => view.label)).toEqual([
      '개요',
      '소비 흐름',
      '아키텍처',
      '애플리케이션',
      '패키지',
      '문서',
      '기록',
      '엔지니어링',
    ]);
  });

  it('orders the explorer sections with the records right after the journeys', () => {
    renderAt('/');
    const headings = within(explorerNav())
      .getAllByRole('heading', { level: 2 })
      .map((heading) => heading.querySelector('a')?.textContent);
    expect(headings).toEqual(['소비 흐름', '기록', '애플리케이션', '패키지', '문서', '엔지니어링']);
  });

  it('lists every catalog entry in the explorer, linked to its route', () => {
    renderAt('/');
    const hrefs = within(explorerNav())
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'));
    for (const section of SECTIONS) {
      expect(hrefs).toContain(section.path);
      for (const entity of section.entities) expect(hrefs).toContain(entity.href);
    }
  });

  it('marks the selection from the URL in both navigations', () => {
    renderAt('/packages/react-ui');
    expect(views().getByRole('link', { name: '패키지' }).getAttribute('aria-current')).toBe('page');
    const current = explorerNav().querySelectorAll('[aria-current="page"]');
    expect(Array.from(current).map((link) => link.getAttribute('href'))).toEqual([
      '/packages/react-ui',
    ]);
  });
});

describe('focus and scroll after a navigation', () => {
  it('leaves focus and scroll alone on the first load', () => {
    renderAt('/packages');
    expect(document.activeElement).toBe(document.body);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('returns to the top of the document after a view link, with the skip link next', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await user.click(views().getByRole('link', { name: '아키텍처' }));

    expect(h1()).toBe('현재 구조');
    expect(document.activeElement).toBe(start());
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
    await user.tab();
    expect(document.activeElement?.textContent).toBe('본문으로 건너뛰기');
  });

  it('resets both panes when only the selected entry changes', async () => {
    const user = userEvent.setup();
    renderAt('/packages/react-ui');
    const resets: string[] = [];
    for (const id of [MAIN_CONTENT_ID, INSPECTOR_ID]) {
      Object.defineProperty(document.getElementById(id), 'scrollTop', {
        configurable: true,
        get: () => 0,
        set: (value: number) => resets.push(`${id}=${value}`),
      });
    }
    await user.click(within(explorerNav()).getByRole('link', { name: 'ui-core' }));

    expect(h1()).toBe('ui-core');
    expect(resets).toEqual([`${MAIN_CONTENT_ID}=0`, `${INSPECTOR_ID}=0`]);
    expect(document.activeElement).toBe(start());
    expect(document.activeElement).not.toBe(document.getElementById(INSPECTOR_ID));
  });

  it('lands on the inspector when the address names it', () => {
    renderAt('/packages/react-ui#devhub-inspector');
    expect(document.activeElement).toBe(document.getElementById(INSPECTOR_ID));

    act(() => navigate('/packages/ui-core#devhub-inspector'));
    expect(h1()).toBe('ui-core');
    expect(document.activeElement).toBe(document.getElementById(INSPECTOR_ID));
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
