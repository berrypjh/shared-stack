import { INSPECTOR_ID } from '@berrypjh/devhub-ui';

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';

import { catalog } from '@/data';

import App from './app';

let location = '';
const Probe = () => {
  const { pathname, hash } = useLocation();
  location = `${pathname}${hash}`;
  return null;
};

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Probe />
      <App />
    </MemoryRouter>,
  );

const inspector = () => within(screen.getByRole('complementary', { name: '상세 정보' }));
const section = (title: string) =>
  within(inspector().getByRole('region', { name: new RegExp(`^${title}`) }));

let scrollTo: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
});
afterEach(() => scrollTo.mockRestore());

const main = () => within(screen.getByRole('main'));
const mainSection = (title: string) => within(main().getByRole('region', { name: title }));

describe('package inspector', () => {
  it('uses the same four sections as the other inspectors', () => {
    renderAt('/packages/react-ui');
    for (const title of ['개요', '소스', '문서', '테스트']) expect(section(title)).toBeTruthy();
    expect(inspector().queryByRole('region', { name: /^진입점/ })).toBeNull();
  });

  it('marks an internal package as 내부(private), from its manifest', () => {
    renderAt('/packages/ui-core');
    expect(
      section('개요').getByText(/내부\(private\) — package.json 의 private: true/),
    ).toBeTruthy();
    expect(mainSection('진입점').getByText(/소비자 API 가 아님/)).toBeTruthy();
  });

  it('shows the reason instead of an empty list', () => {
    renderAt('/packages/eslint-config');
    expect(
      section('테스트').getByText(/이 패키지를 직접 대상으로 하는 테스트 묶음이 없음/),
    ).toBeTruthy();
  });

  it('groups source files by the project that owns them', () => {
    renderAt('/packages/react-ui');
    const source = section('소스');
    expect(source.getByRole('heading', { level: 4, name: 'react-ui' })).toBeTruthy();
    expect(source.getByText('index.ts')).toBeTruthy();
  });
});

describe('package page', () => {
  it('lists exactly the manifest entry points, and never links a build output as an import', () => {
    renderAt('/packages/react-ui');
    const pkg = catalog.packages.find((p) => p.id === 'react-ui');
    const entries = mainSection('진입점');
    for (const entry of pkg?.entries ?? []) expect(entries.getByText(entry.specifier)).toBeTruthy();
    expect(entries.getByText(/dist 안의 다른 파일을 직접 import 하지 않음/)).toBeTruthy();
    const links = entries.getAllByRole('link').map((link) => link.getAttribute('href') ?? '');
    expect(links.some((href) => href.includes('/dist/'))).toBe(false);
    expect(
      links.some((href) => /\/(blob|tree)\/[^/]+\/libs\/react-ui\/src\/index\.ts$/.test(href)),
    ).toBe(true);
  });

  it('draws only the relation groups that have entries, and no section without any', () => {
    renderAt('/packages/eslint-config');
    expect(main().queryByRole('region', { name: '관계' })).toBeNull();
    renderAt('/packages/observability-contracts');
    const headings = within(screen.getAllByRole('region', { name: '관계' })[0])
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent);
    expect(headings.length).toBeGreaterThan(0);
    expect(headings.length).toBeLessThan(4);
  });

  it('links a related entry to its own page', async () => {
    const user = userEvent.setup();
    renderAt('/packages/react-ui');
    await user.click(mainSection('관계').getAllByRole('link', { name: 'ui-core' })[0]);
    expect(location).toBe('/packages/ui-core');
    expect(main().getByRole('heading', { level: 1 }).textContent).toBe('ui-core');
  });
});

describe('links inside the inspector', () => {
  it('page to the neighbours in the section order, with the missing side disabled', async () => {
    const user = userEvent.setup();
    const [first, second] = catalog.packages.filter((p) => p.kind === 'ui').map((p) => p.id);
    renderAt(`/packages/${first}`);
    const pager = within(inspector().getByRole('navigation', { name: '패키지 이동' }));
    expect(pager.getByRole('button', { name: '이전 패키지 없음' }).hasAttribute('disabled')).toBe(
      true,
    );
    await user.click(pager.getByRole('link', { name: `다음 패키지: ${second}` }));

    expect(location).toBe(`/packages/${second}#${INSPECTOR_ID}`);
    expect(document.activeElement).toBe(document.getElementById(INSPECTOR_ID));
    expect(inspector().getByRole('heading', { level: 2 }).textContent).toBe(second);
  });

  it('keeps every file link inside the repository host and opens it in a new window', () => {
    renderAt('/packages/design-tokens');
    const external = inspector()
      .getAllByRole('link')
      .filter((link) => link.getAttribute('target') === '_blank');
    expect(external.length).toBeGreaterThan(0);
    for (const link of external) {
      expect(link.getAttribute('href')?.startsWith(`${catalog.repository.webUrl}/`)).toBe(true);
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    }
  });
});
