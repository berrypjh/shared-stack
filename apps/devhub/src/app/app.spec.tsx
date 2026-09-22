import {
  INSPECTOR_ID,
  MAIN_CONTENT_ID,
  THEME_KEY,
  WorkspaceFrame,
  WorkspaceHeader,
} from '@berrypjh/devhub-ui';

import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';

import { DevHubShell } from '@/components/shell/devhub-shell';
import { RouterAdapter } from '@/components/shell/router-adapter';

import App from './app';

const renderApp = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>,
  );

/**
 * banner 랜드마크: `main` · 구획 요소 밖의 `<header>`(HTML-AAM). dom-testing-library 는 aria-query 의
 * "scoped to" 제약을 보지 않아 작업 영역 머리(`main` 안 `<header>`, 실제 역할 generic)도 banner 로 센다.
 */
const banners = () =>
  Array.from(document.querySelectorAll('header')).filter(
    (header) => !header.closest('main, aside, nav, section, article'),
  );

const explorer = () => screen.getByRole('complementary', { name: '탐색기' });
const toggle = () => screen.getByRole('button', { name: /^탐색기$/ });

beforeEach(() => {
  delete document.documentElement.dataset.theme;
  localStorage.clear();
});

describe('shell landmarks', () => {
  it('has one banner and one main, and names every navigation and side pane', () => {
    renderApp();
    expect(banners()).toHaveLength(1);
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getByRole('navigation', { name: '보기' })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: '저장소 항목' })).toBeTruthy();
    expect(explorer()).toBeTruthy();
    expect(screen.getByRole('complementary', { name: '상세 정보' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('berrypjh/shared-stack');
  });

  it('places explorer, workspace, then inspector in reading order', () => {
    renderApp();
    const order = [
      explorer(),
      screen.getByRole('main'),
      screen.getByRole('complementary', { name: '상세 정보' }),
    ];
    for (let i = 1; i < order.length; i += 1) {
      expect(
        order[i - 1].compareDocumentPosition(order[i]) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  });

  it('marks the current view with aria-current in both navigations', () => {
    renderApp();
    for (const name of ['보기', '저장소 항목']) {
      const link = within(screen.getByRole('navigation', { name })).getByRole('link', {
        name: '개요',
      });
      expect(link.getAttribute('aria-current')).toBe('page');
    }
  });
});

describe('skip links', () => {
  it('are the first two links, pointing at a focusable main and inspector', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.tab();
    expect(document.activeElement?.textContent).toBe('본문으로 건너뛰기');
    await user.tab();
    expect(document.activeElement?.textContent).toBe('상세 정보로 건너뛰기');

    for (const [name, id] of [
      ['본문으로 건너뛰기', MAIN_CONTENT_ID],
      ['상세 정보로 건너뛰기', INSPECTOR_ID],
    ]) {
      expect(screen.getByRole('link', { name }).getAttribute('href')).toBe(`#${id}`);
      expect(document.getElementById(id)?.getAttribute('tabindex')).toBe('-1');
    }
  });

  it('are outside the route shell', () => {
    renderApp();
    const shell = banners()[0].parentElement as HTMLElement;
    expect(shell.contains(screen.getByRole('link', { name: '본문으로 건너뛰기' }))).toBe(false);
  });
});

describe('explorer drawer', () => {
  it('opens from the menu button and focuses the current item', async () => {
    const user = userEvent.setup();
    renderApp();
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(toggle().getAttribute('aria-controls')).toBe(explorer().id);
    expect(explorer().dataset.state).toBe('closed');

    await user.click(toggle());
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    expect(explorer().dataset.state).toBe('open');
    expect(document.activeElement).toBe(within(explorer()).getByRole('link', { name: '개요' }));
  });

  it('closes with Escape and returns focus to the menu button', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(toggle());
    await user.keyboard('{Escape}');
    expect(explorer().dataset.state).toBe('closed');
    expect(document.activeElement).toBe(toggle());
  });

  it('closes with its close button and returns focus to the menu button', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(toggle());
    await user.click(within(explorer()).getByRole('button', { name: '탐색기 닫기' }));
    expect(explorer().dataset.state).toBe('closed');
    expect(document.activeElement).toBe(toggle());
  });

  it('closes when the page outside it is pressed', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(toggle());
    fireEvent.pointerDown(screen.getByRole('main'));
    expect(explorer().dataset.state).toBe('closed');
    expect(document.activeElement).toBe(toggle());
  });

  it('closes without taking focus when focus leaves it', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(toggle());
    const main = screen.getByRole('main');
    act(() => main.focus());
    expect(explorer().dataset.state).toBe('closed');
    expect(document.activeElement).toBe(main);
  });

  it('closes when the route changes', async () => {
    const user = userEvent.setup();
    let navigate: (to: string) => void = () => undefined;
    const Navigator = () => {
      navigate = useNavigate();
      return null;
    };
    render(
      <MemoryRouter initialEntries={['/']}>
        <Navigator />
        <Routes>
          <Route
            path="*"
            element={
              <RouterAdapter>
                <DevHubShell>
                  <WorkspaceFrame>
                    <WorkspaceHeader eyebrow="시험" title="이동" />
                  </WorkspaceFrame>
                </DevHubShell>
              </RouterAdapter>
            }
          />
        </Routes>
      </MemoryRouter>,
    );
    await user.click(toggle());
    expect(explorer().dataset.state).toBe('open');
    act(() => navigate('/elsewhere'));
    expect(explorer().dataset.state).toBe('closed');
  });
});

describe('theme switch', () => {
  const option = (name: '라이트' | '다크') =>
    within(screen.getByRole('group', { name: '화면 테마' })).getByRole('button', { name });

  it('is a named group of two pressed-state icon buttons', () => {
    renderApp();
    expect(option('라이트').getAttribute('aria-pressed')).toBe('true');
    expect(option('다크').getAttribute('aria-pressed')).toBe('false');
    expect(option('다크').textContent).toBe('');
  });

  it('switches <html data-theme> and keeps the choice', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(option('다크'));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
    expect(option('다크').getAttribute('aria-pressed')).toBe('true');
  });

  it('still switches when storage is blocked', async () => {
    const user = userEvent.setup();
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    renderApp();
    await user.click(option('다크'));
    expect(document.documentElement.dataset.theme).toBe('dark');
    setItem.mockRestore();
  });
});
