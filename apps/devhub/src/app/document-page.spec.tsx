import { bodyOf, INSPECTOR_ID, outlineOf } from '@berrypjh/devhub-ui';

import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { catalog } from '@/data';
import { loadDocument } from '@/lib/markdown/documents';
import { SNAPSHOT } from '@/lib/repository/current-snapshot';

import App from './app';

/**
 * 문서 본문은 `use()` 로 불러온 원문을 기다린다. React 19 는 동기 `act` 안에서 멈춘 컴포넌트를
 * 다시 그리지 않으므로(경고: "suspended inside an `act` scope") `await act` 로 렌더한다.
 */
const renderAt = (path: string) =>
  act(async () => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>,
    );
  });

const main = () => screen.getByRole('main');
const inspector = () => screen.getByRole('complementary', { name: '상세 정보' });
/** 본문이 불러와질 때까지 — 불러온 뒤에만 `article` 이 있다. */
const article = async () => within(main()).findByRole('article');

let scrollTo: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
});
afterEach(() => scrollTo.mockRestore());

describe('document body', () => {
  it('renders the repository text below the title, without its opening heading', async () => {
    await renderAt('/documents/react-ui-readme');
    const body = await article();
    expect(within(body).queryByRole('heading', { name: '@berrypjh/react-ui' })).toBeNull();
    expect(within(body).getAllByRole('heading', { level: 2 }).length).toBeGreaterThan(0);
    expect(document.title).toBe('libs/react-ui/README.md · Shared Stack DevHub');
  });

  it('lists every section in "이 페이지에서", pointing at real headings', async () => {
    await renderAt('/documents/design-tokens-agents');
    const body = await article();
    const doc = catalog.documents.find((d) => d.id === 'design-tokens-agents');
    const outline = outlineOf(bodyOf(await loadDocument(doc?.path ?? '')));
    const [folded, side] = within(main()).getAllByRole('navigation', { name: '이 페이지에서' });
    for (const nav of [folded, side]) {
      expect(
        within(nav)
          .getAllByRole('link')
          .map((a) => a.getAttribute('href')),
      ).toEqual(outline.map((item) => `#${item.id}`));
    }
    for (const item of outline) expect(body.querySelector(`[id="${item.id}"]`)).not.toBeNull();
    // 한 번에 하나만 보인다: 좁으면 접힌 목차, 넓으면(작업 영역 container query) 옆 목차.
    expect(folded.closest('details')?.classList.contains('@4xl:hidden')).toBe(true);
    expect(['hidden', '@4xl:block'].every((c) => side.classList.contains(c))).toBe(true);
  });

  it('draws tables as named, scrollable tables', async () => {
    await renderAt('/documents/root-readme');
    const body = await article();
    const tables = within(body).getAllByRole('table');
    expect(tables.length).toBeGreaterThan(0);
    expect(within(body).getAllByRole('region', { name: /^표: / }).length).toBe(tables.length);
  });

  it('goes to the section named in the address once the text is loaded', async () => {
    await renderAt('/documents/design-tokens-agents#테마-추가');
    await article();
    expect(document.activeElement?.id).toBe('테마-추가');
    expect(document.activeElement?.tagName).toBe('H2');
  });
});

describe('document links', () => {
  it('keep cataloged documents in the app', async () => {
    await renderAt('/documents/root-readme');
    const link = within(await article()).getAllByRole('link', { name: '@berrypjh/react-ui' })[0];
    expect(link.getAttribute('href')).toBe('/documents/react-ui-readme');
    expect(link.getAttribute('target')).toBeNull();
  });

  it('send repository files to the snapshot, in a new window, marked as such', async () => {
    await renderAt('/documents/design-tokens-readme');
    const link = within(await article()).getByRole('link', { name: /^MIT/ });
    expect(link.getAttribute('href')).toBe(
      SNAPSHOT.commit
        ? `${catalog.repository.webUrl}/blob/${SNAPSHOT.commit}/LICENSE`
        : `${catalog.repository.webUrl}/blob/${catalog.repository.defaultBranch}/LICENSE`,
    );
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.textContent).toContain('저장소 파일 LICENSE, 새 창');
  });

  it('keep in-page anchors on the page', async () => {
    await renderAt('/documents/design-tokens-agents');
    const link = within(await article()).getByRole('link', { name: '테마 추가' });
    expect(link.getAttribute('href')).toBe('#테마-추가');
  });

  it('show a broken link as text with its reason, never as a link', async () => {
    await renderAt('/documents/treeshake-readme');
    const body = await article();
    expect(within(body).queryByRole('link', { name: /verification-guide/ })).toBeNull();
    expect(body.textContent).toContain('깨진 링크: docs/verification-guide.md');
    expect(inspector().textContent).toContain('../../../docs/verification-guide.md');
  });
});

describe('document inspector', () => {
  it('names who cites the document: entities and journey steps', async () => {
    await renderAt('/documents/changelog');
    const panel = within(inspector());
    const entities = within(panel.getByRole('region', { name: /^이 문서를 드는 항목/ }));
    expect(entities.getByRole('link', { name: '릴리스 스크립트' }).getAttribute('href')).toBe(
      `/engineering/release-scripts#${INSPECTOR_ID}`,
    );
    const steps = within(panel.getByRole('region', { name: /^이 문서를 드는 흐름 단계/ }));
    expect(steps.getByRole('link', { name: '3. 변경 기록을 남긴다' }).getAttribute('href')).toBe(
      `/journeys/release/steps/changelog#${INSPECTOR_ID}`,
    );
  });

  it('says why a document has no citations instead of leaving the section out', async () => {
    await renderAt('/documents/root-agents');
    expect(inspector().textContent).toContain(
      '없음 — 앱 · 패키지 · 도구 중 이 문서를 근거로 드는 것이 없다',
    );
  });

  it('copies the repository path', async () => {
    const user = userEvent.setup();
    await renderAt('/documents/changelog');
    await user.click(within(inspector()).getByRole('button', { name: '경로 복사: CHANGELOG.md' }));
    expect(await navigator.clipboard.readText()).toBe('CHANGELOG.md');
    expect(within(inspector()).getByRole('status').textContent).toBe('복사했습니다');
  });
});
