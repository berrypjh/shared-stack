import { act, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { catalog } from '@/data';
import { RECORDS_NEWEST_FIRST } from '@/lib/catalog/entities';
import { RECORD_KIND } from '@/lib/catalog/labels';

import App from './app';

/** 기록 본문은 문서처럼 `use()` 로 원문을 기다린다 — `await act` 로 렌더한다. */
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
const article = async () => within(main()).findByRole('article');

let scrollTo: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
});
afterEach(() => scrollTo.mockRestore());

describe('record list', () => {
  it('lists every record newest first, each with its date, kind, and summary', async () => {
    await renderAt('/records');
    const list = within(screen.getByRole('region', { name: `${catalog.records.length}개` }));
    const links = list.getAllByRole('link').map((link) => link.getAttribute('href'));
    expect(links).toEqual(RECORDS_NEWEST_FIRST.map((record) => `/records/${record.id}`));
    for (const record of catalog.records) {
      expect(list.getByText(record.summary)).toBeTruthy();
      expect(list.getAllByText(RECORD_KIND[record.kind]).length).toBeGreaterThan(0);
    }
    const dates = RECORDS_NEWEST_FIRST.map((record) => record.date);
    expect([...dates].sort().reverse()).toEqual(dates);
  });
});

describe('record page', () => {
  const record = catalog.records.find((r) => r.id === 'react-ui-cascade-layers');
  if (!record) throw new Error('fixture record missing');

  it('renders the record text below its title, with the four sections in "이 페이지에서"', async () => {
    await renderAt(`/records/${record.id}`);
    const body = await article();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(record.title);
    expect(document.title).toBe(`${record.title} · Shared Stack DevHub`);
    const [folded] = within(main()).getAllByRole('navigation', { name: '이 페이지에서' });
    expect(
      within(folded)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['상황', '판단', '반영', '검증']);
    expect(within(body).getByRole('heading', { level: 2, name: '판단' })).toBeTruthy();
  });

  it('keeps a link to another record inside the app', async () => {
    await renderAt(`/records/${record.id}`);
    const link = within(await article()).getByRole('link', { name: '별도 스크립트로 분리' });
    expect(link.getAttribute('href')).toBe('/records/react-ui-css-build-script');
    expect(link.getAttribute('target')).toBeNull();
  });

  it('shows the evidence in the inspector: sources, documents, tests, always in order', async () => {
    await renderAt(`/records/${record.id}`);
    const panel = within(inspector());
    expect(panel.getByRole('heading', { level: 2 }).textContent).toBe(record.title);
    const headings = panel
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.firstChild?.textContent);
    expect(headings).toEqual(['개요', '소스', '문서', '테스트']);
    for (const source of record.sources) {
      expect(panel.getByText(source.path.split('/').pop() as string)).toBeTruthy();
    }
    expect(panel.getByText('AGENTS.consumer.md')).toBeTruthy();
    expect(panel.getByText(/이 기록을 지키는 테스트 묶음이 카탈로그에 없다/)).toBeTruthy();
  });

  it('pages between records in newest-first order', async () => {
    await renderAt(`/records/${RECORDS_NEWEST_FIRST[0].id}`);
    const pager = within(inspector().querySelector('nav[aria-label="기록 이동"]') as HTMLElement);
    expect(pager.getByRole('button', { name: '이전 기록 없음' }).hasAttribute('disabled')).toBe(
      true,
    );
    expect(
      pager
        .getByRole('link', { name: `다음 기록: ${RECORDS_NEWEST_FIRST[1].title}` })
        .getAttribute('href'),
    ).toBe(`/records/${RECORDS_NEWEST_FIRST[1].id}#devhub-inspector`);
  });

  it('tells an unknown record apart from a real one', async () => {
    await renderAt('/records/no-such-record');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('카탈로그에 없는 항목');
    expect(screen.getByRole('link', { name: '기록 목록으로 가기' }).getAttribute('href')).toBe(
      '/records',
    );
  });
});
