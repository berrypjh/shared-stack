import { INSPECTOR_ID, MAIN_CONTENT_ID } from '@berrypjh/devhub-ui';

import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';

import { catalog } from '@/data';
import { documentGroupOf, linkOf, SECTIONS, VIEWS } from '@/lib/catalog/entities';

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
    ['/packages', '패키지'],
    ['/packages/react-ui', 'react-ui'],
    ['/documents', '문서'],
    ['/documents/root-readme', '@berrypjh/shared-stack'],
    ['/records', '기록'],
    ['/records/bash-guard-hook', 'AI 세션의 Bash 를 PreToolUse hook 으로 가드'],
  ])('opens %s directly', async (path, heading) => {
    // 문서 본문은 원문을 기다린다 — 멈춘 컴포넌트가 다시 그려지도록 `await act`.
    await act(async () => {
      renderAt(path);
    });
    expect(h1()).toBe(heading);
  });

  it('has no applications section: an app opens as its architecture node', () => {
    renderAt('/applications/devhub');
    expect(h1()).toBe('없는 화면');
    expect(linkOf('devhub')?.href).toBe('/architecture/devhub');
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
  it('opens the explorer with the views that have no section', () => {
    renderAt('/');
    const hrefs = within(explorerNav())
      .getAllByRole('link')
      .slice(0, VIEWS.length)
      .map((link) => link.getAttribute('href'));
    expect(hrefs).toEqual(['/', '/architecture']);
  });

  it('orders the explorer sections with evaluation first and the records right after the journeys', () => {
    renderAt('/');
    const headings = within(explorerNav())
      .getAllByRole('heading', { level: 2 })
      .map((heading) => heading.querySelector('a')?.textContent);
    expect(headings).toEqual(['작업 흐름', '평가', '기록', '패키지', '플러그인', '문서']);
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

  it('files every document under a group, so none drops out of the explorer', () => {
    const documents = SECTIONS.find((section) => section.id === 'documents')?.entities ?? [];
    expect(documents.map((entity) => entity.id).sort()).toEqual(
      catalog.documents.map((doc) => doc.id).sort(),
    );
  });

  it('groups documents by topic, in table order, with no empty group', () => {
    const documents = SECTIONS.find((section) => section.id === 'documents')?.entities ?? [];
    const groups = [...new Set(documents.map((entity) => entity.group))];
    expect(groups).toEqual([
      '개발 · 저장소',
      '개발 · 도구',
      '개발 · 품질 관측',
      '개발 · Claude harness',
      '소비자 · 패키지',
      '소비자 · 플러그인',
      '에이전트 · 저장소 지침',
      '에이전트 · 패키지 사용 규칙',
      '에이전트 · 공통 규칙 원본',
    ]);
    expect(documentGroupOf('AGENTS.md')).toBe('에이전트 · 저장소 지침');
    expect(documentGroupOf('README.md')).toBe('개발 · 저장소');
    expect(documentGroupOf('libs/react-ui/AGENTS.consumer.md')).toBe('에이전트 · 패키지 사용 규칙');
    expect(documentGroupOf('libs/react-ui/README.md')).toBe('소비자 · 패키지');
    expect(documentGroupOf('libs/ui-core/README.md')).toBe('개발 · 저장소');
    expect(documentGroupOf('plugins/berry-dev/standards/rules/core.md')).toBe(
      '에이전트 · 공통 규칙 원본',
    );
    expect(documentGroupOf('plugins/berry-dev/README.md')).toBe('소비자 · 플러그인');
  });

  it('starts the document groups folded, except the one holding the current document', async () => {
    const openGroups = () =>
      Array.from(explorerNav().querySelectorAll('details'))
        .filter((group) => group.open)
        .map((group) => group.querySelector('summary span')?.textContent);
    await act(async () => {
      renderAt('/documents/react-ui-agents');
    });
    expect(openGroups()).toEqual(
      expect.arrayContaining(['UI 라이브러리', '에이전트 · 저장소 지침']),
    );
    expect(openGroups()).not.toContain('소비자 · 패키지');

    const user = userEvent.setup();
    await user.click(
      within(explorerNav()).getByText('소비자 · 패키지', { selector: 'summary span' }),
    );
    expect(openGroups()).toContain('소비자 · 패키지');
  });

  it('offers one open-all or close-all toggle in every section with more than one group', () => {
    renderAt('/');
    const nav = within(explorerNav());
    for (const title of ['평가', '기록', '패키지', '문서']) {
      const toggle = new RegExp(`^${title} 묶음 모두 (열기|닫기)$`);
      expect(nav.getAllByRole('button', { name: toggle })).toHaveLength(1);
    }
    expect(nav.getByRole('button', { name: '문서 묶음 모두 열기' })).toBeTruthy();
    expect(nav.getByRole('button', { name: '패키지 묶음 모두 닫기' })).toBeTruthy();
  });

  it('opens and closes every group of a section at once', async () => {
    const user = userEvent.setup();
    renderAt('/');
    const nav = within(explorerNav());
    const documentGroups = () =>
      Array.from(
        explorerNav().querySelectorAll<HTMLDetailsElement>(
          'section[aria-labelledby="explorer-documents"] details',
        ),
      ).map((group) => group.open);

    await user.click(nav.getByRole('button', { name: '문서 묶음 모두 열기' }));
    expect(documentGroups().every(Boolean)).toBe(true);
    expect(nav.queryByRole('button', { name: '문서 묶음 모두 열기' })).toBeNull();
    await user.click(nav.getByRole('button', { name: '문서 묶음 모두 닫기' }));
    expect(documentGroups().some(Boolean)).toBe(false);
    expect(documentGroups().length).toBeGreaterThan(1);
  });

  it('marks the selection from the URL in the explorer', () => {
    renderAt('/packages/react-ui');
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
    await user.click(within(explorerNav()).getByRole('link', { name: '아키텍처' }));

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
