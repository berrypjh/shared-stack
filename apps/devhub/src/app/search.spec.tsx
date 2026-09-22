import { INSPECTOR_ID } from '@berrypjh/devhub-ui';

import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';

import App from './app';

let location = '';
const LocationProbe = () => {
  const { pathname, hash } = useLocation();
  location = `${pathname}${hash}`;
  return null;
};

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <LocationProbe />
      <App />
    </MemoryRouter>,
  );

const field = () => screen.getByRole('combobox', { name: '저장소 검색' });
const liveStatus = () =>
  screen
    .getAllByRole('status')
    .find((node) => node.classList.contains('ui-visually-hidden')) as HTMLElement;
const options = () => screen.queryAllByRole('option');

/** 질의를 치고 첫 결과를 키보드로 고른다. */
const choose = async (user: ReturnType<typeof userEvent.setup>, query: string) => {
  await user.click(field());
  await user.keyboard(query);
  await user.keyboard('{ArrowDown}{Enter}');
};

let scrollTo: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
});
afterEach(() => scrollTo.mockRestore());

describe('shortcut', () => {
  it('focuses the field with Ctrl+K off macOS, and leaves ⌘K and Ctrl+Shift+K alone', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await user.keyboard('{Meta>}k{/Meta}');
    expect(document.activeElement).not.toBe(field());
    await user.keyboard('{Control>}{Shift>}k{/Shift}{/Control}');
    expect(document.activeElement).not.toBe(field());
    await user.keyboard('{Control>}k{/Control}');
    expect(document.activeElement).toBe(field());
    expect(field().getAttribute('aria-keyshortcuts')).toBe('Control+K');
  });
});

describe('results', () => {
  it('lists options that name their kind in text', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await user.click(field());
    await user.keyboard('react-ui');
    const [first] = options();
    expect(first.textContent).toContain('react-ui');
    expect(first.textContent).toContain('패키지 · ');
    expect(liveStatus().textContent).toMatch(/^결과 \d+개/);
  });

  it('moves with the arrows, keeps focus in the field, and closes with Escape', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await user.click(field());
    await user.keyboard('size');
    await user.keyboard('{ArrowDown}{ArrowDown}');
    const active = field().getAttribute('aria-activedescendant');
    expect(active).toBe(options()[1].id);
    expect(document.activeElement).toBe(field());
    await user.keyboard('{Escape}');
    expect(options()).toEqual([]);
    expect((field() as HTMLInputElement).value).toBe('size');
  });

  it('announces no match in a live region that is always present', async () => {
    const user = userEvent.setup();
    renderAt('/');
    const status = liveStatus();
    expect(status.textContent).toBe('');
    await user.click(field());
    await user.keyboard('zzqx');
    expect(liveStatus()).toBe(status);
    expect(status.textContent).toBe('일치하는 항목이 없습니다');
    expect(options()).toEqual([]);
  });
});

describe('navigation from a result', () => {
  it('opens an entity page and returns focus to the start of the document', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await choose(user, 'react-ui');
    expect(location).toBe('/packages/react-ui');
    expect(document.activeElement).toBe(document.querySelector('[data-focus-start]'));
    expect((field() as HTMLInputElement).value).toBe('');
  });

  it('lands on the chosen command card in the main area', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await choose(user, 'size');
    expect(location).toBe('/engineering#command-script:size');
    expect(document.activeElement?.id).toBe('command-script:size');
    expect(screen.getByRole('main').contains(document.activeElement)).toBe(true);
  });

  it('lands on the exports section of the inspector for a public export', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await choose(user, 'styles.css');
    expect(location).toBe('/packages/react-ui#inspector-exports');
    expect(document.activeElement?.id).toBe('inspector-exports');
    expect(document.getElementById(INSPECTOR_ID)?.contains(document.activeElement)).toBe(true);
  });

  it('lands on a symbol of a source file, and selects a journey step by URL', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await choose(user, 'buildTokenOutputs');
    expect(location).toBe(
      '/sources/libs/design-tokens/src/lib/pipeline.ts#symbol-buildTokenOutputs',
    );
    expect(document.activeElement?.id).toBe('symbol-buildTokenOutputs');

    await choose(user, '토큰 값을 바꾼다');
    expect(location).toBe('/journeys/token-pipeline/steps/edit');
    const inspector = screen.getByRole('complementary', { name: '상세 정보' });
    expect(within(inspector).getByRole('heading', { level: 2 }).textContent).toBe(
      '토큰 값을 바꾼다',
    );
  });
});

describe('deep links', () => {
  it('focus a symbol when the page opens with its hash', () => {
    renderAt('/sources/libs/design-tokens/src/lib/pipeline.ts#symbol-buildTokenOutputs');
    expect(document.activeElement?.id).toBe('symbol-buildTokenOutputs');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'libs/design-tokens/src/lib/pipeline.ts',
    );
  });

  it('list who cites a source file, and say when the catalog cites nothing there', () => {
    const { unmount } = renderAt('/sources/libs/design-tokens/src/lib/pipeline.ts');
    const citing = screen.getByRole('region', { name: /^인용하는 곳/ });
    expect(
      within(citing)
        .getByRole('link', { name: /토큰 산출물을 만든다/ })
        .getAttribute('href'),
    ).toBe('/journeys/token-pipeline/steps/generate');
    unmount();
    renderAt('/sources/no/such/file.ts');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      '카탈로그가 인용하지 않는 경로',
    );
  });

  it('focus an inspector section when the page opens with its hash', async () => {
    await act(async () => {
      renderAt('/packages/react-ui#inspector-exports');
    });
    expect(document.activeElement?.id).toBe('inspector-exports');
  });
});

describe('narrow screens', () => {
  it('reveal the field from the top bar button and fold it again with Escape', async () => {
    const user = userEvent.setup();
    renderAt('/');
    const button = screen.getByRole('button', { name: '검색' });
    const container = document.getElementById(button.getAttribute('aria-controls') ?? '');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(container?.className).toContain('max-lg:hidden');

    await user.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(container?.className).not.toContain('max-lg:hidden');
    expect(document.activeElement).toBe(field());

    await user.keyboard('{Escape}');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(button);
  });
});
