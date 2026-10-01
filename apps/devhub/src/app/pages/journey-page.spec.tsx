import { INSPECTOR_ID } from '@berrypjh/devhub-ui';

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { catalog } from '@/data';
import { flowModel } from '@/lib/catalog/flow';
import { JOURNEY_KIND } from '@/lib/catalog/labels';

import App from '../app';

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );

const journeyOf = (id: string) =>
  catalog.journeys.find((j) => j.id === id) as (typeof catalog.journeys)[number];
const hrefs = (links: Element[]) => links.map((link) => link.getAttribute('href'));
const flow = () => screen.getByRole('region', { name: '흐름' });
/** 그림의 단계 링크. 고른 단계 뒤의 건너뛰기 링크(`#…`)는 빼고 센다. */
const nodeLinks = () => [
  ...within(flow()).getByRole('list', { name: '단계' }).querySelectorAll('a[href^="/journeys/"]'),
];
const outline = (title: string) => within(flow()).getByRole('list', { name: `${title} 단계` });
const showList = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: '목록' }));
const inspector = () => screen.getByRole('complementary', { name: '상세 정보' });

let scrollTo: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
});
afterEach(() => scrollTo.mockRestore());

describe('journey list', () => {
  it('lists every journey under its kind, in label order', () => {
    renderAt('/journeys');
    const main = screen.getByRole('main');
    expect(hrefs(within(main).getAllByRole('link'))).toEqual(
      expect.arrayContaining(catalog.journeys.map((j) => `/journeys/${j.id}`)),
    );
    expect(
      within(main)
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.textContent),
    ).toEqual(Object.values(JOURNEY_KIND));
  });
});

describe('graph and text', () => {
  it.each(catalog.journeys.map((j) => [j.id]))(
    '%s: the list links the same steps and names every drawn connection',
    async (id) => {
      const user = userEvent.setup();
      const journey = journeyOf(id);
      const model = flowModel(journey, catalog.contexts);
      const { container } = renderAt(`/journeys/${id}`);
      const drawn = hrefs(nodeLinks());
      expect(drawn).toEqual(journey.steps.map((step) => `/journeys/${id}/steps/${step.id}`));
      expect(container.querySelectorAll('svg path[marker-end]')).toHaveLength(model.edges.length);

      await showList(user);
      const articles = within(outline(journey.title)).getAllByRole('article');
      expect(
        hrefs(
          articles.map((a) => within(a).getByRole('heading').querySelector('a') as HTMLElement),
        ),
      ).toEqual(drawn);
      const nextLinks = articles.flatMap((a) =>
        within(within(a).getByRole('list', { name: '다음 단계' })).queryAllByRole('link'),
      );
      expect(nextLinks).toHaveLength(model.edges.length);
    },
  );
});

describe('step selection', () => {
  it('comes from the URL: current step, summary, skip link, and inspector', () => {
    const journey = journeyOf('release');
    const step = journey.steps[2];
    renderAt(`/journeys/release/steps/${step.id}`);
    const current = within(flow()).getAllByRole('link', { current: 'page' });
    expect(hrefs(current)).toEqual([`/journeys/release/steps/${step.id}`]);
    expect(current[0].textContent).toContain('· 선택됨');
    expect(
      screen.getByText(`단계 ${journey.steps.length}개`, { exact: false }).textContent,
    ).toMatch(new RegExp(`선택: 3\\. ${step.intent}$`));
    expect(
      screen.getByRole('link', { name: '이 단계의 상세 정보로 이동' }).getAttribute('href'),
    ).toBe(`#${INSPECTOR_ID}`);
    expect(within(inspector()).getByRole('heading', { level: 2 }).textContent).toBe(step.intent);
    expect(document.title).toBe(`${step.intent} · ${journey.title} · Shared Stack DevHub`);
  });

  it('keeps focus, scroll, and the view mode when the step changes in one flow', async () => {
    const user = userEvent.setup();
    const journey = journeyOf('release');
    renderAt('/journeys/release');
    await showList(user);
    const heading = () =>
      outline(journey.title).querySelector(
        'h3 a[href="/journeys/release/steps/version"]',
      ) as HTMLElement;
    await user.click(heading());

    expect(heading().getAttribute('aria-current')).toBe('page');
    expect(document.activeElement).toBe(heading());
    expect(scrollTo).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '목록' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('tells an unknown journey apart from an unknown step', () => {
    const { unmount } = renderAt('/journeys/no-such-journey');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('카탈로그에 없는 항목');
    expect(screen.getByRole('link', { name: '작업 흐름 목록으로 가기' }).getAttribute('href')).toBe(
      '/journeys',
    );
    unmount();

    const journey = journeyOf('release');
    renderAt('/journeys/release/steps/no-such-step');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('카탈로그에 없는 항목');
    expect(
      screen.getByRole('link', { name: `${journey.title} 목록으로 가기` }).getAttribute('href'),
    ).toBe('/journeys/release');
  });
});

describe('step inspector', () => {
  it('shows every section in order, with reasons where empty', () => {
    renderAt('/journeys/release/steps/push');
    const headings = within(inspector())
      .getAllByRole('heading', { level: 3 })
      .map((h) => [...h.childNodes].find((n) => n.nodeType === Node.TEXT_NODE)?.textContent);
    expect(headings).toEqual(['개요', '다음 단계', '소스', '문서', '테스트', '근거 공백']);
  });

  it('links next steps, the owner, and the pager into the inspector', () => {
    const journey = journeyOf('release');
    renderAt('/journeys/release/steps/version');
    const panel = within(inspector());
    const next = within(panel.getByRole('region', { name: /^다음 단계/ })).getAllByRole('link');
    expect(hrefs(next)).toEqual([`/journeys/release/steps/changelog#${INSPECTOR_ID}`]);
    expect(panel.getByRole('link', { name: '릴리스 스크립트' }).getAttribute('href')).toBe(
      `/architecture/release-scripts#${INSPECTOR_ID}`,
    );
    const pager = panel.getByRole('navigation', { name: '단계 이동' });
    expect(
      within(pager).getByRole('link', { name: `이전 단계: 1. ${journey.steps[0].intent}` }),
    ).toBeTruthy();
    expect(
      within(pager).getByRole('link', { name: `다음 단계: 3. ${journey.steps[2].intent}` }),
    ).toBeTruthy();
  });

  it('shows who uses a step and its example commands to copy', () => {
    const step = journeyOf('lookup').steps.find((s) => s.id === 'repo-cli');
    renderAt('/journeys/lookup/steps/repo-cli');
    const overview = within(inspector()).getByRole('region', { name: /^개요/ });
    expect(overview.textContent).toContain(`사용 주체${step?.actor}`);
    expect(
      within(within(overview).getByRole('list', { name: '예시 명령' }))
        .getAllByRole('button', { name: /^명령 복사: / })
        .map((button) => button.getAttribute('aria-label')),
    ).toEqual(step?.commands?.map((command) => `명령 복사: ${command}`));
  });

  it('continues the last eval step into its evaluation item', () => {
    renderAt('/journeys/eval-run/steps/collect');
    const next = within(inspector()).getByRole('region', { name: /^다음 단계/ });
    expect(hrefs(within(next).getAllByRole('link'))).toEqual(['/evaluation/eval-scorecard']);
    expect(next.textContent).toContain('평가 · 성적표');
  });

  it('lists the recorded gap of a step', () => {
    const step = journeyOf('release').steps.find(
      (s) => s.gaps?.length,
    ) as (typeof catalog.journeys)[number]['steps'][number];
    renderAt(`/journeys/release/steps/${step.id}`);
    expect(inspector().textContent).toContain(step.gaps?.[0].note as string);
  });

  it('summarises the flow when no step is chosen, in the same four sections as every other item', () => {
    renderAt('/journeys/release');
    const panel = within(inspector());
    expect(panel.getByRole('heading', { level: 2 }).textContent).toBe(journeyOf('release').title);
    const headings = panel
      .getAllByRole('heading', { level: 3 })
      .map((h) => [...h.childNodes].find((n) => n.nodeType === Node.TEXT_NODE)?.textContent);
    expect(headings).toEqual(['개요', '소스', '문서', '테스트']);
    expect(panel.getByRole('link', { name: '릴리스 스크립트' })).toBeTruthy();
  });
});
