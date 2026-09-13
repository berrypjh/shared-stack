import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { bundleArtifact, cxOnly, TREESHAKE_ROWS } from '../../../test/bundles';
import { bundle } from '../../../test/fixtures';
import { locationOf, renderApp } from '../../../test/render';
import { designArtifact, publicFiles } from '../../../test/runs';

const files = () =>
  publicFiles([
    bundleArtifact('run-base', [cxOnly(10474), bundle({ compression: 'gzip' })]),
    bundleArtifact('run-core', [cxOnly(10574)]),
    designArtifact('run-design'),
    bundleArtifact('run-bundle', [cxOnly(10574), bundle()], { treeshakeRows: TREESHAKE_ROWS }),
  ]);

const budgetRows = () =>
  within(screen.getByRole('table', { name: 'size-limit budget' }))
    .getAllByRole('row')
    .slice(1);

describe('번들', () => {
  it('budget 행은 current·limit·headroom·method·압축·조정·import 를 보이고 음수 여유는 초과다', async () => {
    renderApp('/bundles?run=run-bundle', files());
    await screen.findByRole('table', { name: 'size-limit budget' });
    const full = budgetRows()[1];
    for (const text of [
      '@berrypjh/react-native-ui — * (full)',
      '15,857 B',
      '15,100 B (15.1 KB)',
      '757 B 초과',
      '실패',
      'size-limit',
      'brotli',
      'size-limit-empty-project-subtracted',
      'baseline 으로 비교할 실행을 고르지 않았습니다',
    ]) {
      expect(full.textContent).toContain(text);
    }
    expect(full.id).toBe('bundle-bundle.size-limit.react-native-ui.full');
  });

  it('budget 차트와 표는 같은 case·값을 쓴다', async () => {
    renderApp('/bundles?run=run-bundle', files());
    const figure = await screen.findByRole('figure', { name: 'Budget 사용 — size-limit 조정값' });
    const bars = within(figure).getAllByRole('listitem');
    expect(bars.map((bar) => bar.dataset.key)).toEqual(
      budgetRows().map((row) => row.id.replace(/^bundle-/, '')),
    );
    bars.forEach((bar, index) => {
      const formatted = new Intl.NumberFormat('en-US').format(Number(bar.dataset.value));
      expect(budgetRows()[index].textContent).toContain(`${formatted} B`);
    });
  });

  it('baseline 은 조건이 같을 때만 정확한 delta 를, 다르면 이유를 보여준다', async () => {
    const { user, router } = renderApp('/bundles?run=run-bundle', files());
    await screen.findByRole('table', { name: 'size-limit budget' });
    await user.selectOptions(screen.getByLabelText('baseline 실행'), 'run-base');
    expect(locationOf(router)).toBe('/bundles?run=run-bundle&base=run-base');
    await screen.findByText('+100 B (+0.95%)');
    const [cx, full] = budgetRows();
    expect(cx.textContent).toContain('10,474 B');
    expect(full.textContent).toContain('비교 불가 — compression differs');
    expect(full.textContent).not.toContain('+757');
  });

  it('baseline 실행에 같은 case 가 없으면 delta 가 아니라 missing 이다', async () => {
    renderApp('/bundles?run=run-bundle&base=run-core', files());
    await screen.findByText('run-core 에 이 case 가 없습니다');
    expect(budgetRows()[1].textContent).not.toMatch(/baseline \d/);
    expect(budgetRows()[0].textContent).toContain('0 B (0.00%)');
  });

  it('tree-shake 는 single·multi·all-exports 를 raw·gzip 따로 그리고 값 없는 막대는 0 이 아니다', async () => {
    renderApp('/bundles?run=run-bundle', files());
    const gzip = await screen.findByRole('figure', {
      name: 'Tree-shaking — @berrypjh/react-ui · gzip',
    });
    expect(
      within(gzip)
        .getAllByRole('group')
        .map((group) => group.getAttribute('aria-label')),
    ).toEqual(['single', 'multi', 'all-exports']);
    const multi = within(within(gzip).getByRole('group', { name: 'multi' })).getByRole('listitem');
    expect(multi.dataset.value).toBe('null');
    expect(multi.querySelector('[data-fill]')).toBeNull();
    expect(
      screen.getByRole('figure', { name: 'Tree-shaking — @berrypjh/react-ui · raw (압축 없음)' }),
    ).toBeTruthy();
    const row = screen.getByRole('row', { name: /multi: Box\+Button/ });
    expect(row.textContent).toContain('38,120 B');
    expect(row.textContent).toContain('N/A — esbuild 번들 실패');
  });

  it('tree-shake 가 실행되지 않았으면 이유·명령을 주고, floor 주석은 과거 조사로 표시한다', async () => {
    renderApp('/bundles?run=run-core', files());
    expect(
      await screen.findByText('run-core 는 tree-shaking 측정 을 실행하지 않았습니다'),
    ).toBeTruthy();
    expect(
      screen.getByText(/--only-imports: import 한 report 가 없어 실행하지 않았다/),
    ).toBeTruthy();
    const note = screen.getByRole('note', { name: '과거 조사 기록' });
    expect(note.textContent).toContain('.size-limit.cjs');
    expect(note.textContent).toContain('현재 HEAD 의 원인을 확정한 측정이 아닙니다');
  });

  it('package 필터는 부분 집합임을 알리고 원본 판정을 다시 계산하지 않는다', async () => {
    const { user, router } = renderApp('/bundles?run=run-bundle', files());
    await screen.findByRole('table', { name: 'size-limit budget' });
    await user.selectOptions(screen.getByLabelText('패키지'), '@berrypjh/react-ui');
    expect(locationOf(router)).toBe('/bundles?run=run-bundle&package=%40berrypjh%2Freact-ui');
    expect(budgetRows()).toHaveLength(1);
    expect(
      screen.getByText(
        'size-limit 2행 중 필터와 일치 1행 — 필터 결과는 부분 집합이며 판정을 다시 계산하지 않습니다',
      ),
    ).toBeTruthy();
  });

  it('bundle 측정이 없는 실행은 unsupported 다', async () => {
    renderApp('/bundles?run=run-design', files());
    expect(await screen.findByText('run-design 에는 bundle 측정 이 없습니다')).toBeTruthy();
  });
});
