import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { fakeFetch } from '../test/fixtures';

import { App } from './app';
import { NAV } from './nav';

/** 공개 index 가 없는 상태 (clean clone). 화면은 fetch 결과로만 수집 여부를 안다. */
const renderAt = (path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App fetcher={fakeFetch({}).fetcher} expectedSha="unknown" />
    </MemoryRouter>,
  );

const nav = () => within(screen.getByRole('navigation', { name: '주요 메뉴' }));

const currentLabels = () =>
  nav()
    .getAllByRole('link')
    .filter((link) => link.getAttribute('aria-current') === 'page')
    .map((link) => link.textContent);

describe('shell landmarks', () => {
  it('SkipLink 는 focus 를 받을 수 있고 sticky header 만큼 물러나는 main 을 가리킨다', () => {
    renderAt();
    const skip = screen.getByRole('link', { name: '본문으로 건너뛰기' });
    const main = screen.getByRole('main');
    expect(skip.getAttribute('href')).toBe(`#${main.id}`);
    expect(main.tabIndex).toBe(-1);
    expect(main.className).toContain('scroll-mt-');
  });

  it.each(NAV)('$path 에는 NAV 라벨과 같은 h1 이 하나다', async ({ path, label }) => {
    renderAt(path);
    expect(await screen.findByRole('heading', { level: 1, name: label })).toBeTruthy();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('첫 진입에서는 포커스를 옮기지 않는다', async () => {
    renderAt('/');
    await screen.findByRole('heading', { level: 1 });
    expect(document.activeElement).toBe(document.body);
  });
});

/** 목적지는 NAV 에서 읽는다. 사이드바 라벨과 h1 은 같은 문장이다. */
describe('navigation', () => {
  it('항목을 누르면 같은 이름의 h1 에 도착해 포커스가 옮겨가고 current 표시가 따라온다', async () => {
    expect(NAV.length).toBeGreaterThanOrEqual(2);
    const user = userEvent.setup();
    renderAt();
    for (const item of [...NAV].reverse()) {
      await user.click(nav().getByRole('link', { name: item.label }));
      const heading = await screen.findByRole('heading', { level: 1, name: item.label });
      await waitFor(() => expect(document.activeElement).toBe(heading));
      expect(currentLabels()).toEqual([item.label]);
    }
  });

  it('보고 있는 실행을 다른 화면으로 가져가고, 그 화면의 필터는 가져가지 않는다', () => {
    renderAt('/quality/tests?run=run-a&status=failed');
    for (const item of NAV) {
      const link = nav().getByRole('link', { name: item.label });
      expect(link.getAttribute('href')).toBe(`${item.path}?run=run-a`);
    }
    expect(currentLabels()).toEqual(['테스트']);
  });
});

describe('narrow navigation', () => {
  it('icon-only 메뉴 버튼은 이름·펼침 상태를 갖고 Escape 로 닫히며 focus 를 돌려준다', async () => {
    const user = userEvent.setup();
    renderAt();
    const toggle = screen.getByRole('button', { name: '메뉴' });
    expect(toggle.getAttribute('aria-controls')).toBe(
      screen.getByRole('navigation', { name: '주요 메뉴' }).id,
    );
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    await user.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    await user.keyboard('{Escape}');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(toggle);
  });

  it('항목으로 이동하면 메뉴가 닫힌다', async () => {
    const user = userEvent.setup();
    renderAt();
    const toggle = screen.getByRole('button', { name: '메뉴' });
    await user.click(toggle);
    await user.click(nav().getByRole('link', { name: NAV[NAV.length - 1].label }));
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });
});

/** 수집기가 없으므로 어떤 화면도 숫자 표를 그리지 않는다. */
describe('empty state', () => {
  it.each(NAV)('$path 는 미수집 상태와 명령을 말하고 table 을 그리지 않는다', async ({ path }) => {
    renderAt(path);
    const main = within(screen.getByRole('main'));
    expect(await main.findByRole('heading', { name: '아직 수집한 실행이 없습니다' })).toBeTruthy();
    expect(main.getByText('pnpm quality:export --run-id=<새-run-id>')).toBeTruthy();
    expect(main.queryByRole('table')).toBeNull();
  });
});

describe('theme', () => {
  it('다크 모드 스위치가 theme scope 를 light 와 dark 사이에서 바꾼다', async () => {
    const user = userEvent.setup();
    const { container } = renderAt();
    const scope = () => container.querySelector('[data-theme]')?.getAttribute('data-theme');
    expect(scope()).toBe('light');

    const toggle = screen.getByRole('switch', { name: '다크 모드' });
    await user.click(toggle);
    expect(scope()).toBe('dark');

    await user.click(toggle);
    expect(scope()).toBe('light');
  });
});
