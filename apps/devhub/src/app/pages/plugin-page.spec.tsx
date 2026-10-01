import { act, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { catalog } from '@/data';
import { titleText } from '@/lib/markdown/documents';

import App from '../app';

let scrollTo: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
});
afterEach(() => scrollTo.mockRestore());

const renderAt = async (path: string) => {
  await act(async () => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>,
    );
  });
};

const section = (name: string) => screen.getByRole('region', { name });
const maybeSection = (name: string) => screen.queryByRole('region', { name });

/** 플러그인 화면은 카탈로그의 표면을 하나도 빼지 않고 그린다. 주지 않는 표면은 섹션 대신 요약에 없다고 쓴다. */
describe.each(catalog.plugins.map((plugin) => [plugin.id, plugin] as const))(
  '/plugins/%s',
  (id, plugin) => {
    it('names the plugin and its install command', async () => {
      await renderAt(`/plugins/${id}`);
      expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(id);
      expect(screen.getByRole('main').textContent).toContain(
        `claude plugin install ${id}@${plugin.marketplace}`,
      );
    });

    it('shows every skill, MCP tool, hook and rule', async () => {
      await renderAt(`/plugins/${id}`);
      const surfaces = [
        ['Skill', plugin.skills],
        ['MCP 서버', plugin.mcpServers],
        ['Hook', plugin.hooks],
        ['작업 규칙', plugin.rules],
      ] as const;
      const contents = screen.getByRole('navigation', { name: '제공하는 것' });
      for (const [name, items] of surfaces) {
        expect({ name, shown: Boolean(maybeSection(name)) }).toEqual({
          name,
          shown: items.length > 0,
        });
        if (items.length) {
          const link = within(section(name)).getByRole('link', { name: `${name} 절 링크` });
          expect(link.getAttribute('href')).toBe(`#${section(name).id}`);
          expect(
            within(contents).getByRole('link', { name: `${name} ${items.length}` }),
          ).toBeTruthy();
        } else {
          expect(contents.textContent).toMatch(new RegExp(`배포하지 않음 — .*${name}`));
        }
      }
      for (const skill of plugin.skills) {
        if (skill.whenToUseKo) {
          expect(section('Skill').textContent).toContain(skill.whenToUseKo);
        }
        expect(
          within(section('Skill')).getByRole('heading', { level: 3, name: `/${id}:${skill.name}` }),
        ).toBeTruthy();
      }
      for (const tool of plugin.mcpServers.flatMap((server) => server.tools)) {
        expect(
          within(section('MCP 서버')).getByRole('rowheader', { name: tool.name }),
        ).toBeTruthy();
      }
      for (const hook of plugin.hooks) {
        const hooks = section('Hook');
        expect(within(hooks).getByRole('heading', { level: 3, name: hook.event })).toBeTruthy();
        for (const bypass of hook.policy?.bypasses ?? []) {
          expect(within(hooks).getByRole('rowheader', { name: bypass.what })).toBeTruthy();
        }
      }
      for (const rule of plugin.rules) {
        const doc = catalog.documents.find((candidate) => candidate.path === rule.source.path);
        const link = within(section('작업 규칙')).getByRole('link', {
          name: doc && titleText(doc),
        });
        expect(link.getAttribute('href')).toBe(`/documents/${doc?.id}`);
        expect(within(section('작업 규칙')).getByText(rule.id)).toBeTruthy();
      }
    });

    it('has no relations section', async () => {
      await renderAt(`/plugins/${id}`);
      expect(maybeSection('관계')).toBeNull();
    });

    it('lists scripts, examples and keywords in the inspector', async () => {
      await renderAt(`/plugins/${id}`);
      const inspector = screen.getByRole('complementary', { name: '상세 정보' });
      const sections = within(inspector)
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.textContent?.replace(/\d+$/, '').trim());
      expect(sections).toEqual(['개요', '소스', '문서', '테스트']);
      const source = inspector.querySelector('#inspector-source');
      for (const ref of [plugin.manifest, ...plugin.scripts, ...plugin.examples]) {
        expect(source?.textContent).toContain(ref.path.split('/').pop());
      }
      const verified = catalog.relations.some(
        (relation) => relation.kind === 'verification' && relation.to === id,
      );
      expect(
        inspector.querySelector('#inspector-tests')?.textContent?.includes('검증하는 쪽'),
      ).toBe(verified);
      for (const keyword of plugin.keywords) {
        expect(within(inspector).getByText(keyword)).toBeTruthy();
      }
    });
  },
);

it('lists every plugin in the section, with its version', async () => {
  await renderAt('/plugins');
  const list = section('2개');
  for (const plugin of catalog.plugins) {
    expect(within(list).getByRole('link', { name: plugin.id }).getAttribute('href')).toBe(
      `/plugins/${plugin.id}`,
    );
    expect(list.textContent).toContain(`v${plugin.version}`);
  }
});
