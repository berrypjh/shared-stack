import { CanvasEdges, INSPECTOR_ID, openModal } from '@berrypjh/devhub-ui';

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { catalog } from '@/data';
import { architectureModel } from '@/lib/catalog/architecture';
import { RELATION_KIND } from '@/lib/catalog/labels';

import App from './app';

const model = architectureModel(catalog);

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );

const map = () => screen.getByRole('group', { name: '아키텍처 그림' });
const mapNodes = () => within(map()).getByRole('list', { name: '구성 요소' });
const hrefs = (links: Element[]) => links.map((link) => link.getAttribute('href'));
/** 그림의 노드 링크. 고른 노드 뒤의 건너뛰기 링크(`#…`)는 빼고 센다. */
const nodeLinks = () => [...mapNodes().querySelectorAll('a[href^="/architecture/"]')];
const showList = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: '목록' }));
const outline = () =>
  within(screen.getByRole('region', { name: '구성 요소와 관계' })).getByRole('list', {
    name: '구성 요소',
  });

let scrollTo: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
});
afterEach(() => scrollTo.mockRestore());

describe('architecture map and list', () => {
  it('link the same nodes, and the list names every drawn edge under both ends', async () => {
    const user = userEvent.setup();
    renderAt('/architecture');
    const drawn = hrefs(nodeLinks());
    expect(drawn).toHaveLength(model.nodes.length);

    await user.click(screen.getByRole('button', { name: '목록' }));
    const articles = within(outline()).getAllByRole('article');
    expect(
      hrefs(articles.map((a) => within(a).getByRole('heading').querySelector('a') as HTMLElement)),
    ).toEqual(drawn);
    articles.forEach((article, index) => {
      const node = model.nodes[index];
      const touching = model.edges.filter((e) => e.source === node.id || e.target === node.id);
      expect({ id: node.id, links: within(article).getAllByRole('link').length }).toEqual({
        id: node.id,
        links: 1 + touching.length,
      });
      if (touching.length === 0) expect(article.textContent).toContain('없음');
    });
  });

  it('labels every edge with its relation kind and draws each kind in its own line pattern', () => {
    const { container } = renderAt('/architecture');
    const labels = [...container.querySelectorAll('svg text')].map((t) => t.textContent);
    expect(labels).toHaveLength(model.edges.length);
    expect(new Set(labels)).toEqual(new Set(Object.values(RELATION_KIND)));
    const dashes = [...container.querySelectorAll('svg path[marker-end]')].map((p) =>
      p.getAttribute('stroke-dasharray'),
    );
    expect(new Set(dashes).size).toBe(4);
  });

  it('marks the public boundary and tools in words and in the box pattern', () => {
    renderAt('/architecture');
    const linkOf = (id: string) =>
      within(mapNodes())
        .getAllByRole('link')
        .find((link) => link.getAttribute('href') === `/architecture/${id}`) as HTMLElement;
    expect(linkOf('react-ui').className).toContain('border-double');
    expect(linkOf('react-ui').textContent).toContain('공개(배포)');
    expect(linkOf('ui-core').className).not.toContain('border-double');
    expect(linkOf('ui-core').textContent).toContain('내부(private)');
    expect(linkOf('berry-commit').className).toContain('border-dashed');
    expect(linkOf('berry-commit').textContent).toContain('도구');
  });
});

describe('selection', () => {
  it('comes from the URL: current node, summary, skip link, and inspector', () => {
    renderAt('/architecture/react-ui');
    const current = mapNodes().querySelectorAll('[aria-current="page"]');
    expect(hrefs([...current] as HTMLElement[])).toEqual(['/architecture/react-ui']);
    expect(current[0].textContent).toContain('· 선택됨');
    expect(screen.getByText(/선택: react-ui$/)).toBeTruthy();
    expect(
      screen.getByRole('link', { name: '이 구성 요소의 상세 정보로 이동' }).getAttribute('href'),
    ).toBe(`#${INSPECTOR_ID}`);
    const inspector = screen.getByRole('complementary', { name: '상세 정보' });
    expect(within(inspector).getByRole('heading', { level: 2 }).textContent).toBe('react-ui');
    expect(document.title).toBe('react-ui · 아키텍처 · Shared Stack DevHub');
  });

  it('keeps focus on the chosen node, the scroll, and the view mode when the node changes', async () => {
    const user = userEvent.setup();
    renderAt('/architecture');
    await showList(user);
    const heading = () =>
      outline().querySelector('h3 a[href="/architecture/ui-core"]') as HTMLElement;
    await user.click(heading());

    expect(heading().getAttribute('aria-current')).toBe('page');
    expect(document.activeElement?.textContent).toBe('ui-core');
    expect(scrollTo).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '목록' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('says a node is missing instead of drawing a stale selection', () => {
    renderAt('/architecture/no-such-node');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('카탈로그에 없는 항목');
    expect(screen.getByRole('link', { name: '아키텍처 목록으로 가기' }).getAttribute('href')).toBe(
      '/architecture',
    );
  });
});

describe('filters', () => {
  it('keep only matching nodes and carry the filter on node and filter links', () => {
    renderAt('/architecture/react-ui?kind=package');
    const drawn = hrefs(nodeLinks());
    expect(drawn).toHaveLength(catalog.packages.length);
    expect(drawn.every((href) => href?.endsWith('?kind=package'))).toBe(true);
    const filter = within(screen.getByRole('navigation', { name: '필터' }));
    const packages = filter.getByRole('link', { name: /패키지/ });
    expect(packages.getAttribute('aria-current')).toBe('true');
    expect(filter.getAllByRole('link', { name: 'Node' })[0].getAttribute('href')).toBe(
      '/architecture/react-ui?kind=package&platform=node',
    );
  });

  it('show a no-match state in both views, with a way out', async () => {
    const user = userEvent.setup();
    renderAt('/architecture?kind=application&platform=platform-neutral');
    expect(within(screen.getByRole('main')).getByRole('status').textContent).toContain(
      '조건에 맞는 구성 요소가 없습니다',
    );
    expect(screen.queryByRole('group', { name: '아키텍처 그림' })).toBeNull();
    await showList(user);
    expect(within(screen.getByRole('main')).getByRole('status').textContent).toContain(
      '조건에 맞는 구성 요소가 없습니다',
    );
    expect(screen.getByRole('link', { name: '필터 모두 해제' }).getAttribute('href')).toBe(
      '/architecture',
    );
  });
});

describe('canvas', () => {
  it('names its controls and keeps the folded help as the description', () => {
    renderAt('/architecture');
    const controls = within(screen.getByRole('group', { name: '보기 조절' }));
    for (const name of ['축소', '확대', '화면에 맞추기', '크게 보기']) {
      expect(controls.getByRole('button', { name })).toBeTruthy();
    }
    const help = screen.getByRole('button', { name: '도움말' });
    expect(help.getAttribute('aria-expanded')).toBe('false');
    const helpId = help.getAttribute('aria-controls') as string;
    expect(document.getElementById(helpId)?.hidden).toBe(true);
    expect(map().getAttribute('aria-describedby')).toContain(helpId);
  });

  it('gives each drawing its own arrow marker', () => {
    const edges = [{ id: 'e', path: 'M 0 0 L 10 10', label: { x: 5, y: 5, text: '검증' } }];
    const { container } = render(
      <>
        <CanvasEdges edges={edges} width={10} height={10} />
        <CanvasEdges edges={edges} width={10} height={10} />
      </>,
    );
    const ids = [...container.querySelectorAll('marker')].map((m) => m.id);
    expect(new Set(ids).size).toBe(2);
  });

  it('opens the enlarged view once even when asked twice', () => {
    const calls: string[] = [];
    const dialog = {
      open: false,
      showModal() {
        this.open = true;
        calls.push('showModal');
      },
    };
    openModal(dialog);
    openModal(dialog);
    expect(calls).toEqual(['showModal']);
  });
});
