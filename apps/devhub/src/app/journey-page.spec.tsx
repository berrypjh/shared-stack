import { INSPECTOR_ID } from '@berrypjh/devhub-ui';

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { catalog } from '@/data';
import { flowModel } from '@/lib/catalog/flow';

import App from './app';

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
  it('lists every journey, web and React Native consumers first-class', () => {
    renderAt('/journeys');
    const main = screen.getByRole('main');
    expect(hrefs(within(main).getAllByRole('link'))).toEqual(
      expect.arrayContaining(catalog.journeys.map((j) => `/journeys/${j.id}`)),
    );
    expect(within(main).getByRole('heading', { name: '소비자 흐름' })).toBeTruthy();
    expect(within(main).getByRole('heading', { name: '유지보수 흐름' })).toBeTruthy();
    expect(main.textContent).toContain('웹 · 단계');
    expect(main.textContent).toContain('React Native · 단계');
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

  it('marks a documented-only step in words and with a dashed box', () => {
    renderAt('/journeys/web-consumer');
    const install = nodeLinks().find((a) =>
      a.getAttribute('href')?.endsWith('/steps/install'),
    ) as HTMLElement;
    expect(install.textContent).toContain('○ 문서에만 있음');
    expect(install.className).toContain('border-dashed');
  });
});

describe('step selection', () => {
  it('comes from the URL: current step, summary, skip link, and inspector', () => {
    const journey = journeyOf('token-pipeline');
    const step = journey.steps[2];
    renderAt(`/journeys/token-pipeline/steps/${step.id}`);
    const current = within(flow()).getAllByRole('link', { current: 'page' });
    expect(hrefs(current)).toEqual([`/journeys/token-pipeline/steps/${step.id}`]);
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
    const journey = journeyOf('web-consumer');
    renderAt('/journeys/web-consumer');
    await showList(user);
    const heading = () =>
      outline(journey.title).querySelector(
        'h3 a[href="/journeys/web-consumer/steps/render"]',
      ) as HTMLElement;
    await user.click(heading());

    expect(heading().getAttribute('aria-current')).toBe('page');
    expect(document.activeElement).toBe(heading());
    expect(scrollTo).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '목록' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('treats another flow as a new screen: back to the top of the document', async () => {
    const user = userEvent.setup();
    renderAt('/journeys/web-consumer/steps/render');
    const explorer = screen.getByRole('navigation', { name: '저장소 항목' });
    await user.click(within(explorer).getByRole('link', { name: journeyOf('rn-consumer').title }));

    expect(scrollTo).toHaveBeenCalled();
    expect(document.activeElement).toBe(document.querySelector('[data-focus-start]'));
    expect(within(flow()).queryAllByRole('link', { current: 'page' })).toHaveLength(0);
  });

  it('tells an unknown journey apart from an unknown step', () => {
    const { unmount } = renderAt('/journeys/no-such-journey');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('카탈로그에 없는 항목');
    expect(screen.getByRole('link', { name: '소비 흐름 목록으로 가기' }).getAttribute('href')).toBe(
      '/journeys',
    );
    unmount();

    const journey = journeyOf('rn-consumer');
    renderAt('/journeys/rn-consumer/steps/no-such-step');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('카탈로그에 없는 항목');
    expect(
      screen.getByRole('link', { name: `${journey.title} 목록으로 가기` }).getAttribute('href'),
    ).toBe('/journeys/rn-consumer');
  });
});

describe('step inspector', () => {
  it('shows every section in order, with reasons where empty', () => {
    renderAt('/journeys/web-consumer/steps/install');
    const headings = within(inspector())
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.firstChild?.textContent);
    expect(headings).toEqual(['개요', '다음 단계', '소스', '명령', '테스트', '문서', '근거 공백']);
    expect(inspector().textContent).toContain(
      '없음 — 저장소 밖에서 일어나는 단계라 저장소 소스가 없다',
    );
  });

  it('links next steps, the owner, and the pager into the inspector', () => {
    const journey = journeyOf('token-pipeline');
    renderAt('/journeys/token-pipeline/steps/facade');
    const panel = within(inspector());
    const next = within(panel.getByRole('region', { name: /^다음 단계/ })).getAllByRole('link');
    expect(hrefs(next)).toEqual([
      `/journeys/token-pipeline/steps/web#${INSPECTOR_ID}`,
      `/journeys/token-pipeline/steps/rn#${INSPECTOR_ID}`,
    ]);
    expect(panel.getByRole('link', { name: 'ui-core' }).getAttribute('href')).toBe(
      `/packages/ui-core#${INSPECTOR_ID}`,
    );
    const pager = panel.getByRole('navigation', { name: '단계 이동' });
    expect(
      within(pager).getByRole('link', { name: `이전 단계: 2. ${journey.steps[1].intent}` }),
    ).toBeTruthy();
    expect(
      within(pager).getByRole('link', { name: `다음 단계: 4. ${journey.steps[3].intent}` }),
    ).toBeTruthy();
  });

  it('lists the recorded gap of a partial step', () => {
    const step = journeyOf('eval-verification').steps.find(
      (s) => s.status === 'partial',
    ) as (typeof catalog.journeys)[number]['steps'][number];
    renderAt(`/journeys/eval-verification/steps/${step.id}`);
    expect(inspector().textContent).toContain('◐ 일부 구현');
    expect(inspector().textContent).toContain(step.gaps?.[0].note as string);
  });

  it('summarises the flow when no step is chosen', () => {
    renderAt('/journeys/plugin-distribution');
    const panel = within(inspector());
    expect(panel.getByRole('heading', { level: 2 }).textContent).toBe(
      journeyOf('plugin-distribution').title,
    );
    expect(panel.getByRole('link', { name: 'berry-commit' })).toBeTruthy();
  });
});
