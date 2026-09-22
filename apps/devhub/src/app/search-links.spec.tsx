import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { catalog } from '@/data';
import { sourceUsage } from '@/lib/repository/source-usage';
import { searchEntries } from '@/lib/search/entries';

import App from './app';

/** 결과가 도착하면 안 되는 화면의 제목. */
const DEAD_ENDS = ['없는 화면', '카탈로그에 없는 항목', '카탈로그가 인용하지 않는 경로'];

/** 검색 결과와 소스 화면의 "인용하는 곳" 링크 — 카탈로그에서 유도하는 앱 안 주소 전부. */
const hrefs = [
  ...new Set([
    ...searchEntries(catalog).map((entry) => entry.href),
    ...[...sourceUsage(catalog).values()].flatMap((usage) => usage.citations.map((c) => c.href)),
  ]),
];

let scrollTo: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
});
afterEach(() => scrollTo.mockRestore());

describe('every search result', () => {
  it.each(hrefs.map((href) => [href]))('%s opens a real screen and its target', async (href) => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={[href]}>
          <App />
        </MemoryRouter>,
      );
    });
    expect(DEAD_ENDS).not.toContain(screen.getByRole('heading', { level: 1 }).textContent);
    const hash = href.split('#')[1];
    if (hash) expect(document.getElementById(decodeURIComponent(hash))).not.toBeNull();
  });
});
