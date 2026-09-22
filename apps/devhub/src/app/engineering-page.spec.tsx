import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { catalog } from '@/data';
import { commandLine } from '@/domain/commands';
import { commandAnchor } from '@/lib/catalog/routes';

import App from './app';

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );

const card = (id: string) => document.getElementById(commandAnchor(id)) as HTMLElement;
const region = (name: RegExp) => screen.getByRole('region', { name });

let scrollTo: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  renderAt('/engineering');
});
afterEach(() => scrollTo.mockRestore());

describe('engineering commands', () => {
  it('draw every cataloged command once, headed by its exact invocation', () => {
    const cards = screen.getAllByRole('article').filter((a) => a.id.startsWith('command-'));
    expect(cards.map((a) => a.id)).toEqual(
      catalog.commandGroups.flatMap((g) =>
        catalog.commands.filter((c) => c.group === g.id).map((c) => commandAnchor(c.id)),
      ),
    );
    expect(within(card('script:size')).getByRole('heading').textContent).toContain('pnpm size');
    expect(within(card('react-ui:test')).getByRole('heading').textContent).toContain(
      'pnpm nx test @berrypjh/react-ui',
    );
  });

  it('keep constraints in view, with their evidence, outside the folded definition', () => {
    const dev = card('script:eval:consumer:dev');
    const condition = within(dev).getByText('외부 executor 필요 — 없으면 실행을 거부한다');
    expect(condition.closest('details')).toBeNull();
    expect(dev.textContent).toContain('근거 tools/evals/consumer/runner/executor.ts');
    expect(
      within(card('script:release:npm')).getByText('커밋 · 태그 · GitHub release 를 만든다'),
    ).toBeTruthy();
  });

  it('show what CI runs a command, and say so when none does', () => {
    expect(card('script:size').textContent).toContain(
      'PR Quality Check › Bundle Size (size-limit)',
    );
    expect(card('react-ui:test').textContent).toContain('바뀐 프로젝트일 때만');
    expect(card('script:release:npm:beta').textContent).toContain(
      "조건 github.ref == 'refs/heads/pre-release'",
    );
    expect(card('script:eval:consumer:dev').textContent).toContain('CI 가 부르지 않는다');
  });

  it('fold the definition read from its file', () => {
    const details = card('react-ui:bundle-js').querySelector('details') as HTMLElement;
    expect(details.textContent).toContain('libs/react-ui/project.json › targets.bundle-js');
    expect(details.textContent).toContain('@nx/rollup:rollup');
  });

  it('separate deterministic evals from those needing an external executor', () => {
    const evals = region(/^소비자 평가/);
    const [deterministic, external] = within(evals).getAllByRole('definition').slice(0, 2);
    expect(deterministic.textContent).toContain('pnpm eval:consumer:smoke');
    expect(deterministic.textContent).not.toContain('eval:consumer:dev');
    expect(external.textContent).toBe('pnpm eval:consumer:devpnpm eval:consumer:test');
  });

  it('point quality results to quality-lab without drawing any', () => {
    const observability = region(/^품질 관측/);
    expect(
      within(observability).getAllByRole('link', { name: 'quality-lab' })[0].getAttribute('href'),
    ).toBe('/applications/quality-lab');
    expect(within(observability).getByRole('link', { name: '품질 관측 흐름' })).toBeTruthy();
    expect(within(observability).queryAllByRole('table')).toEqual([]);
    expect(observability.querySelector('svg:not([aria-hidden="true"])')).toBeNull();
  });

  it('never shows a success state', () => {
    expect(screen.getByRole('main').textContent).not.toMatch(/통과|성공|passed|succeeded/i);
  });
});

describe('engineering CI', () => {
  it('lists every workflow and links script steps to their command cards', () => {
    const ci = region(/^CI workflow/);
    for (const workflow of catalog.workflows) {
      expect(within(ci).getByRole('heading', { name: workflow.name })).toBeTruthy();
    }
    const size = catalog.commands.find((c) => c.id === 'script:size');
    const link = within(ci).getAllByRole('link', { name: size ? commandLine(size) : '' })[0];
    expect(link.getAttribute('href')).toBe(`#${commandAnchor('script:size')}`);
    expect(ci.textContent).toContain('replay trace 를 주지 않으면 harness 가 실행을 거부한다');
  });

  it('names the targets it leaves out, with the reason', () => {
    expect(screen.getByRole('main').textContent).toContain(
      'nx-release-publish(7개 프로젝트) — nx release 가 배포 단계에서 부르는 target 이다',
    );
  });

  it('has an outline whose every entry lands on a section', () => {
    const [nav] = screen.getAllByRole('navigation', { name: '이 페이지에서' });
    for (const link of within(nav).getAllByRole('link')) {
      const id = link.getAttribute('href')?.slice(1) ?? '';
      expect({ id, found: document.getElementById(id) !== null }).toEqual({ id, found: true });
    }
  });
});
