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

describe('package inspector', () => {
  it('marks an internal package as Internal, from its manifest', () => {
    renderAt('/packages/ui-core');
    // 머리의 배지와 공개 여부 문장, 두 곳이다.
    expect(inspector().getAllByText('Internal')).toHaveLength(2);
    const visibility = section('공개 여부');
    expect(visibility.getByText(/private: true/)).toBeTruthy();
    expect(visibility.getByText('package.json')).toBeTruthy();
    expect(section('진입점').getByText(/소비자 API 가 아니다/)).toBeTruthy();
  });

  it('lists exactly the manifest entry points, and never links a build output as an import', () => {
    renderAt('/packages/react-ui');
    const pkg = catalog.packages.find((p) => p.id === 'react-ui');
    const exports = section('진입점');
    for (const entry of pkg?.entries ?? []) expect(exports.getByText(entry.specifier)).toBeTruthy();
    expect(exports.getByText(/dist 안의 다른 파일을 직접 import 하지 않는다/)).toBeTruthy();
    const links = exports.getAllByRole('link').map((link) => link.getAttribute('href') ?? '');
    expect(links.some((href) => href.includes('/dist/'))).toBe(false);
    expect(
      links.some((href) => /\/(blob|tree)\/[^/]+\/libs\/react-ui\/src\/index\.ts$/.test(href)),
    ).toBe(true);
  });

  it('shows the reason instead of an empty list', () => {
    renderAt('/packages/eslint-config');
    expect(section('테스트').getByText(/테스트 파일도 test target 도 없다/)).toBeTruthy();
    expect(section('명령').getByText(/명령이 카탈로그에 없다/)).toBeTruthy();
    expect(section('위 · 아래').getAllByText(/카탈로그에 없다/)).toHaveLength(2);
  });

  it('groups source files by the project that owns them', () => {
    renderAt('/packages/react-ui');
    const source = section('소스');
    expect(source.getByRole('heading', { level: 4, name: 'react-ui' })).toBeTruthy();
    expect(source.getByText('index.ts')).toBeTruthy();
  });
});

describe('application and tool inspectors', () => {
  it('say there is no manifest rather than guessing visibility or entry points', () => {
    renderAt('/applications/quality-lab-e2e');
    expect(section('공개 여부').getByText(/package\.json 이 없어/)).toBeTruthy();
    expect(section('진입점').getByText(/package\.json 이 없어 진입점이 없다/)).toBeTruthy();
    expect(inspector().queryByText('Internal')).toBeNull();
  });

  it('read an app manifest for visibility and name its missing entry point', () => {
    renderAt('/applications/quality-lab');
    expect(inspector().getAllByText('Internal')).toHaveLength(2);
    expect(section('진입점').getByText(/exports · main 이 없다/)).toBeTruthy();
  });

  it('show a tool outside Nx and the artifacts it writes', () => {
    renderAt('/engineering/consumer-retrieval');
    expect(section('개요').getByText(/Nx 프로젝트가 아니다/)).toBeTruthy();
    const artifacts = section('생성물');
    expect(artifacts.getByRole('link', { name: 'react-ui' })).toBeTruthy();
    expect(artifacts.getByText('libs/react-ui/dist/cli.mjs')).toBeTruthy();
  });
});

describe('links inside the inspector', () => {
  it('open a related entry and stay in the details', async () => {
    const user = userEvent.setup();
    renderAt('/packages/react-ui');
    await user.click(section('위 · 아래').getByRole('link', { name: 'ui-core' }));

    expect(location).toBe(`/packages/ui-core#${INSPECTOR_ID}`);
    expect(document.activeElement).toBe(document.getElementById(INSPECTOR_ID));
    expect(inspector().getByRole('heading', { level: 2 }).textContent).toBe('ui-core');
  });

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
