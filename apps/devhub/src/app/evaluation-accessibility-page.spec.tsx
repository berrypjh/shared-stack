import { screen, waitFor, within } from '@testing-library/react';

import { accessibilityArtifact, devhubSummary } from '@/test/evaluation/accessibility';
import { renderEvaluation } from '@/test/evaluation/render';
import { publicFiles, qualityArtifact } from '@/test/evaluation/runs';

const PATH = '/evaluation/accessibility';
const files = () =>
  publicFiles([
    qualityArtifact('run-quality'),
    accessibilityArtifact('run-old', [devhubSummary({ version: '4.10.0' })]),
    accessibilityArtifact('run-base', [devhubSummary({ contrastNodes: 5 })]),
    accessibilityArtifact('run-a11y'),
  ]);

const LABEL = '/evaluation/bundles · light · desktop 1280×800';

const main = () => within(screen.getByRole('main'));
const rowOf = (table: HTMLElement, header: RegExp) =>
  within(table).getByRole('rowheader', { name: header }).closest('tr') as HTMLTableRowElement;

describe('접근성 — DevHub 평가 화면 audit', () => {
  it('DevHub 평가 화면 (axe · document) 검사 대상을 바로 보인다', async () => {
    renderEvaluation(`${PATH}?run=run-a11y`, files());
    expect(
      await main().findByRole('region', { name: 'DevHub 평가 화면 (axe · document)' }),
    ).toBeTruthy();
    const table = await main().findByRole('table', {
      name: 'DevHub 평가 화면 (axe · document) 검사 대상',
    });
    expect(rowOf(table, /evaluation\/ai/).textContent).toContain('검사 실패');
  });

  it('severity 막대는 rule 표의 node 수와 같다', async () => {
    renderEvaluation(`${PATH}?run=run-a11y`, files());
    const figure = await main().findByRole('figure', { name: `impact 별 위반 node — ${LABEL}` });
    const bars = within(figure).getAllByRole('listitem');
    const table = await main().findByRole('table', { name: `위반 rule — ${LABEL}` });
    const totals: Record<string, number> = {};
    for (const row of within(table).getAllByRole('row').slice(1)) {
      const cells = row.querySelectorAll('td');
      const impact = (cells[0].textContent ?? '').split(' ')[0];
      totals[impact] = (totals[impact] ?? 0) + Number(cells[1].textContent);
    }
    for (const bar of bars) {
      const impact = bar.dataset.key as string;
      expect(Number(bar.dataset.value)).toBe(totals[impact] ?? 0);
    }
    expect(bars.map((bar) => bar.dataset.key)).toEqual([
      'critical',
      'serious',
      'moderate',
      'minor',
      'unknown',
    ]);
  });

  it('incomplete 는 통과가 아닌 별도 표다', async () => {
    renderEvaluation(`${PATH}?run=run-a11y`, files());
    const incomplete = await main().findByRole('table', {
      name: `incomplete (확인 필요, 통과 아님) — ${LABEL}`,
    });
    expect(rowOf(incomplete, /aria-valid-attr-value/).textContent).toContain('unknown');
  });

  it('노드 펼침 버튼은 expanded 와 이름을 갖고, 접으면 포커스를 버튼으로 돌려준다', async () => {
    const { user } = renderEvaluation(`${PATH}?run=run-a11y`, files());
    const table = await main().findByRole('table', { name: `위반 rule — ${LABEL}` });
    const toggle = within(table).getByRole('button', { name: 'color-contrast 영향받은 노드 2개' });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    await user.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    const panel = document.getElementById(toggle.getAttribute('aria-controls') ?? '');
    expect(panel?.textContent).toContain('#color-contrast-0');
    await user.click(
      within(panel as HTMLElement).getByRole('button', { name: 'color-contrast 노드 목록 접기' }),
    );
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(toggle);
  });

  it('검사하지 못한 target 을 고르면 이유를 보인다', async () => {
    const { user } = renderEvaluation(`${PATH}?run=run-a11y`, files());
    await main().findByRole('table', { name: `위반 rule — ${LABEL}` });
    await user.selectOptions(
      main().getByLabelText('검사 대상'),
      'devhub:/evaluation/ai:dark:mobile',
    );
    expect(await main().findByText('검사 실패 — page.goto: Timeout 20000ms exceeded')).toBeTruthy();
    expect(main().queryByRole('table', { name: /위반 rule —/ })).toBeNull();
  });

  it('baseline 비교는 같은 engine 일 때만 rule 별 차이를 보인다', async () => {
    const { user } = renderEvaluation(`${PATH}?run=run-a11y`, files());
    await main().findByRole('table', { name: `위반 rule — ${LABEL}` });
    await user.selectOptions(main().getByLabelText('baseline 실행'), 'run-old');
    expect(await main().findByText('비교 불가 — engine differs')).toBeTruthy();
    await user.selectOptions(main().getByLabelText('baseline 실행'), 'run-base');
    const compare = await main().findByRole('table', { name: `같은 조건 비교 — ${LABEL}` });
    await waitFor(() => expect(rowOf(compare, /color-contrast/).textContent).toContain('-3'));
  });
});

describe('접근성 — 결과가 없는 실행', () => {
  it('unsupported 이고 localhost audit 명령을 준다', async () => {
    renderEvaluation(`${PATH}?run=run-quality`, files());
    expect(await main().findByText('run-quality 에는 접근성 결과가 없다')).toBeTruthy();
    expect(main().getByText('pnpm quality --base-url=http://localhost:4400')).toBeTruthy();
  });
});
