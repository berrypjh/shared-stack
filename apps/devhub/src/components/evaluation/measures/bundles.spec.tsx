import { screen, waitFor, within } from '@testing-library/react';

import { bundleArtifact, cxOnly, TREESHAKE_ROWS } from '@/test/evaluation/bundles';
import { bundle } from '@/test/evaluation/fixtures';
import { renderEvaluation } from '@/test/evaluation/render';
import { publicFiles, staticArtifact } from '@/test/evaluation/runs';

const files = () =>
  publicFiles([
    bundleArtifact('run-base', [cxOnly(10474), bundle({ compression: 'gzip' })]),
    bundleArtifact('run-core', [cxOnly(10574)]),
    staticArtifact('run-static'),
    bundleArtifact('run-bundle', [cxOnly(10574), bundle()], { treeshakeRows: TREESHAKE_ROWS }),
  ]);

const main = () => within(screen.getByRole('main'));

const BUDGET_TABLE = /^size-limit budget — /;

/** package 마다 나뉜 budget 표의 행을 package 순서대로 잇는다. */
const budgetRows = () =>
  main()
    .getAllByRole('table', { name: BUDGET_TABLE })
    .flatMap((table) => within(table).getAllByRole('row').slice(1));

describe('번들', () => {
  it('budget 은 package 마다 표를 두고 행은 current·limit·headroom·import 를, 측정 조건은 한 줄로 보인다', async () => {
    renderEvaluation('/evaluation/bundle-budget?run=run-bundle', files());
    const tables = await main().findAllByRole('table', { name: BUDGET_TABLE });
    expect(tables).toHaveLength(2);
    const full = budgetRows()[1];
    for (const text of ['* (full)', '15,857 B', '15,100 B (15.10 KB)', '757 B 초과', '실패']) {
      expect(full.textContent).toContain(text);
    }
    expect(full.textContent).not.toContain('@berrypjh/react-native-ui');
    expect(full.id).toBe('bundle-bundle.size-limit.react-native-ui.full');
    expect(
      main().getAllByText(/^size-limit · brotli · size-limit-empty-project-subtracted · /),
    ).toHaveLength(2);
    expect(within(tables[1]).queryByRole('columnheader', { name: 'baseline 비교' })).toBeNull();
  });

  it('budget 차트와 표는 같은 case·값을 쓴다', async () => {
    renderEvaluation('/evaluation/bundle-budget?run=run-bundle', files());
    const figures = await main().findAllByRole('figure', { name: /^한도 사용 — / });
    const bars = figures.flatMap((figure) => within(figure).getAllByRole('listitem'));
    expect(bars.map((bar) => bar.dataset.key)).toEqual(
      budgetRows().map((row) => row.id.replace(/^bundle-/, '')),
    );
    bars.forEach((bar, index) => {
      const formatted = new Intl.NumberFormat('en-US').format(Number(bar.dataset.value));
      expect(budgetRows()[index].textContent).toContain(`${formatted} B`);
    });
  });

  it('baseline 은 조건이 같을 때만 정확한 delta 를, 다르면 이유를 보여준다', async () => {
    const { user, location } = renderEvaluation(
      '/evaluation/bundle-budget?run=run-bundle',
      files(),
    );
    await main().findAllByRole('table', { name: BUDGET_TABLE });
    await user.selectOptions(main().getByLabelText('baseline 실행'), 'run-base');
    expect(location()).toBe('/evaluation/bundle-budget?run=run-bundle&base=run-base');
    await main().findByText('+100 B (+0.95%)');
    const [cx, full] = budgetRows();
    expect(cx.textContent).toContain('10,474 B');
    expect(full.textContent).toContain('비교 불가 — compression differs');
    expect(full.textContent).not.toContain('+757');
  });

  it('baseline 실행에 같은 case 가 없으면 delta 가 아니라 missing 이다', async () => {
    renderEvaluation('/evaluation/bundle-budget?run=run-bundle&base=run-core', files());
    await main().findByText('run-core 에 이 case 가 없음');
    expect(budgetRows()[1].textContent).not.toMatch(/baseline \d/);
    expect(budgetRows()[0].textContent).toContain('0 B (0.00%)');
  });

  it('tree-shake 는 gzip 막대 하나로 그리고 all-exports 는 축이 아닌 기준 값이며 값 없는 막대는 0 이 아니다', async () => {
    renderEvaluation('/evaluation/treeshake?run=run-bundle', files());
    const gzip = await main().findByRole('figure', { name: 'gzip 크기 — @berrypjh/react-ui' });
    const bars = within(gzip).getAllByRole('listitem');
    expect(bars.map((bar) => bar.dataset.key)).toEqual(['single: cx', 'multi: Box+Button']);
    expect(bars[1].dataset.value).toBe('null');
    expect(bars[1].querySelector('[data-fill]')).toBeNull();
    const description = document.getElementById(gzip.getAttribute('aria-describedby') ?? '');
    expect(description?.textContent).toContain('기준 all-exports 41,200 B');
    expect(main().getAllByRole('figure')).toHaveLength(1);
    const row = main().getByRole('row', { name: /multi: Box\+Button/ });
    expect(row.textContent).toContain('38,120 B');
    expect(row.textContent).toContain('N/A — esbuild 번들 실패');
    expect(main().getByText(/^treeshake-esbuild · /)).toBeTruthy();
  });

  it('tree-shake 컬럼 설명은 상세 칸에서 표의 컬럼을 같은 순서로 설명하고 비율 · 반복 컬럼은 없다', async () => {
    renderEvaluation('/evaluation/treeshake?run=run-bundle', files());
    const table = await main().findByRole('table', {
      name: 'tree-shaking 행 — @berrypjh/react-ui',
    });
    const guide = within(screen.getByRole('complementary', { name: '상세 정보' })).getByRole(
      'group',
      { name: '표 컬럼' },
    );
    expect(main().queryByRole('group', { name: '표 컬럼' })).toBeNull();
    const headers = within(table)
      .getAllByRole('columnheader')
      .map((cell) => cell.textContent);
    expect([...guide.querySelectorAll('dt')].map((term) => term.textContent)).toEqual(headers);
    expect(headers).toEqual(['scenario', 'import', 'raw', 'gzip']);
  });

  it('tree-shake 가 실행되지 않았으면 이유·명령을 준다', async () => {
    renderEvaluation('/evaluation/treeshake?run=run-core', files());
    expect(
      await main().findByText('run-core 는 이 영역을 실행하지 않았음 — tree-shaking 측정'),
    ).toBeTruthy();
    expect(
      main().getByText(/--only-imports: import 한 report 가 없어 실행하지 않았다/),
    ).toBeTruthy();
  });

  it('budget 의 floor 주석은 과거 조사로 표시한다', async () => {
    renderEvaluation('/evaluation/bundle-budget?run=run-core', files());
    const note = await main().findByRole('note', { name: '과거 조사 기록' });
    expect(note.textContent).toContain('.size-limit.cjs');
    expect(note.textContent).toContain('현재 HEAD 의 원인을 확정한 측정이 아님');
  });

  it('package 필터는 부분 집합임을 알리고 원본 판정을 다시 계산하지 않는다', async () => {
    const { user, location } = renderEvaluation(
      '/evaluation/bundle-budget?run=run-bundle',
      files(),
    );
    await main().findAllByRole('table', { name: BUDGET_TABLE });
    await user.selectOptions(main().getByLabelText('패키지'), '@berrypjh/react-ui');
    expect(location()).toBe(
      '/evaluation/bundle-budget?run=run-bundle&package=%40berrypjh%2Freact-ui',
    );
    expect(budgetRows()).toHaveLength(1);
    expect(
      main().getByText(
        'size-limit 2행 중 필터와 일치 1행 — 필터 결과는 부분 집합이며 판정을 다시 계산하지 않음',
      ),
    ).toBeTruthy();
  });

  it('size-limit 측정이 없는 실행은 unsupported 다', async () => {
    renderEvaluation('/evaluation/bundle-budget?run=run-static', files());
    expect(
      await main().findByText('run-static 에는 이 영역이 없음 — size-limit budget'),
    ).toBeTruthy();
  });

  it('#bundle-<id> 로 오면 그 budget 행이 포커스를 받는다', async () => {
    renderEvaluation(
      '/evaluation/bundle-budget?run=run-bundle#bundle-bundle.size-limit.react-native-ui.full',
      files(),
    );
    await main().findAllByRole('table', { name: BUDGET_TABLE });
    await waitFor(() =>
      expect(document.activeElement?.id).toBe('bundle-bundle.size-limit.react-native-ui.full'),
    );
  });
});
