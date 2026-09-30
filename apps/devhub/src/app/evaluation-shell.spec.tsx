import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { RunInspector } from '@/components/evaluation/run-inspector';
import type { RunData } from '@/components/evaluation/use-run-data';
import { EVALUATION_GROUP, EVALUATION_SCREENS } from '@/lib/evaluation/screens';
import { publicArtifact, SHA } from '@/test/evaluation/fixtures';
import { renderEvaluation } from '@/test/evaluation/render';

/** 화면이 빈 index 를 받아 미수집 상태를 그릴 때까지 기다린다 — 뒤늦은 상태 변경이 테스트 밖으로 새지 않게. */
const settled = () => within(screen.getByRole('main')).findByText('아직 수집한 실행이 없음');

const explorer = () => within(screen.getByRole('navigation', { name: '저장소 항목' }));
const evaluation = () => within(explorer().getByRole('region', { name: /^평가/ }) as HTMLElement);

describe('evaluation in the shell', () => {
  it('lists every screen under the evaluation section in one collapsible group, with the overview as its title', async () => {
    renderEvaluation('/evaluation', {});
    await settled();
    const section = evaluation();
    expect(section.getByRole('link', { name: '평가' }).getAttribute('href')).toBe('/evaluation');
    for (const screen of EVALUATION_SCREENS.filter((s) => s.id !== 'overview')) {
      expect(section.getByRole('link', { name: screen.label }).getAttribute('href')).toBe(
        screen.path,
      );
    }
    const groups = [
      ...explorer().getByRole('region', { name: /^평가/ }).querySelectorAll('details'),
    ];
    expect(groups.map((group) => group.querySelector('summary span')?.textContent)).toEqual([
      EVALUATION_GROUP,
    ]);
  });

  it('carries the chosen run between screens and marks the current one by its path', async () => {
    renderEvaluation('/evaluation/bundles?run=local-static-01&package=x', {});
    await settled();
    const section = evaluation();
    const bundles = section.getByRole('link', { name: '번들' });
    expect(bundles.getAttribute('href')).toBe('/evaluation/bundles?run=local-static-01');
    expect(bundles.getAttribute('aria-current')).toBe('page');
    expect(section.getByRole('link', { name: 'AI 평가' }).getAttribute('href')).toBe(
      '/evaluation/ai?run=local-static-01',
    );
    expect(section.getByRole('link', { name: 'AI 평가' }).getAttribute('aria-current')).toBeNull();
  });

  it('keeps the evaluation view out of the plain views and names each screen', async () => {
    renderEvaluation('/evaluation/bundles', {});
    await settled();
    const views = within(explorer().getAllByRole('list')[0]);
    expect(views.getByRole('link', { name: '아키텍처' })).toBeTruthy();
    expect(views.queryByRole('link', { name: '평가' })).toBeNull();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('번들');
    expect(document.title).toContain('번들 · 평가');
  });
});

describe('run inspector', () => {
  const data = (overrides: Partial<RunData>): RunData => ({
    loading: false,
    view: null,
    runIds: ['run-a'],
    summary: null,
    run: null,
    freshness: null,
    query: {},
    selectedRunId: 'run-a',
    setQuery: () => undefined,
    selectRun: () => undefined,
    reload: () => undefined,
    ...overrides,
  });
  const renderInspector = (runData?: RunData) =>
    render(
      <MemoryRouter>
        <RunInspector data={runData} />
      </MemoryRouter>,
    );

  it('says where and when the chosen run was collected, and how it compares to the snapshot', () => {
    const run = publicArtifact('run-a') as unknown as NonNullable<RunData['run']>;
    renderInspector(
      data({
        run,
        freshness: { status: 'fresh', reason: `run source 가 기준 ${SHA.slice(0, 7)} 과 같음` },
      }),
    );
    expect(screen.getByRole('heading', { level: 2, name: 'run-a' })).toBeTruthy();
    expect(screen.getByText('완료')).toBeTruthy();
    expect(screen.getByText('static')).toBeTruthy();
    expect(screen.getByText(SHA.slice(0, 7))).toBeTruthy();
    expect(screen.getByText('기준과 같음')).toBeTruthy();
  });

  it('gives the reason instead of empty rows', () => {
    renderInspector(data({ loading: true, selectedRunId: null, runIds: [] }));
    expect(screen.getByText('없음 — 실행을 불러오는 중')).toBeTruthy();
  });
});

/** 수집한 실행이 없으면 어떤 평가 화면도 숫자 표를 그리지 않는다. */
describe('evaluation empty state', () => {
  it.each(EVALUATION_SCREENS)(
    '$path 는 미수집 상태와 명령을 말하고 table 을 그리지 않는다',
    async ({ path }) => {
      renderEvaluation(path, {});
      const main = within(screen.getByRole('main'));
      expect(await main.findByRole('heading', { name: '아직 수집한 실행이 없음' })).toBeTruthy();
      expect(main.getByText('pnpm quality:export --run-id=<새-run-id>')).toBeTruthy();
      expect(main.queryByRole('table')).toBeNull();
    },
  );
});
