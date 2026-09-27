import { screen, waitFor, within } from '@testing-library/react';

import {
  accessibilityArtifact,
  devhubSummary,
  manualSummary,
  storybookSummary,
  tokenContrastSummary,
} from '@/test/evaluation/accessibility';
import { renderEvaluation } from '@/test/evaluation/render';
import { publicFiles, qualityArtifact } from '@/test/evaluation/runs';

const PATH = '/evaluation/accessibility';
const files = () =>
  publicFiles([
    qualityArtifact('run-quality'),
    accessibilityArtifact('run-old', [devhubSummary({ version: '4.10.0' })]),
    accessibilityArtifact('run-base', [devhubSummary({ contrastNodes: 5 })]),
    accessibilityArtifact('run-a11y'),
    accessibilityArtifact('run-devhub', [devhubSummary()]),
    accessibilityArtifact('run-static', [storybookSummary()]),
  ]);

const LABEL = '/evaluation/bundles · light · desktop 1280×800';

const main = () => within(screen.getByRole('main'));
const rowOf = (table: HTMLElement, header: RegExp) =>
  within(table).getByRole('rowheader', { name: header }).closest('tr') as HTMLTableRowElement;

describe('접근성 — Static/Test Results', () => {
  it('token 대비는 WCAG 기준과 프로젝트 가드를 나눠 쓰고 token pair 결과라고 말한다', async () => {
    renderEvaluation(`${PATH}?run=run-a11y`, files());
    const table = await main().findByRole('table', { name: 'token 색 쌍 test 결과' });
    expect(rowOf(table, /divider-visibility/).textContent).toContain(
      '1.2:1 · 프로젝트 가시성 가드 (WCAG 기준 아님)',
    );
    expect(rowOf(table, /wcag-aa-text/).textContent).toContain('4.5:1 · WCAG 2.1 AA 텍스트');
    expect(rowOf(table, /wcag-aa-non-text/).textContent).toContain('판정 불가');
    expect(main().getByText(/실제 DOM 대비가 아닙니다/)).toBeTruthy();
  });

  it('Storybook skip 은 story context 기록이고 scan 실패·기록 없음은 통과가 아니다', async () => {
    renderEvaluation(`${PATH}?run=run-a11y`, files());
    const table = await main().findByRole('table', {
      name: 'Storybook story (axe · #storybook-root) 검사 대상',
    });
    expect(rowOf(table, /buttons-button--two/).textContent).toContain('건너뜀 (story context)');
    expect(rowOf(table, /buttons-button--three/).textContent).toContain('검사 실패');
    expect(rowOf(table, /buttons-button--four/).textContent).toContain('실행 안 함');
    expect(
      main().getByText(/storybook-static\/index\.json · story 5개 · test story 4개/),
    ).toBeTruthy();
  });

  it('수동 확인은 측정 결과와 떨어진 section 이고 not-run 은 통과가 아니다', async () => {
    renderEvaluation(`${PATH}?run=run-a11y`, files());
    const manual = await main().findByRole('region', { name: '수동 확인 — 측정값 아님' });
    const rows = within(within(manual).getByRole('table', { name: '수동 확인 기록' }))
      .getAllByRole('row')
      .slice(1);
    for (const row of rows) expect(row.textContent).toContain('확인 안 함 (통과 아님)');
    const measured = main().getByRole('region', { name: 'token 색 쌍 test' });
    expect(measured.textContent).not.toContain('확인 안 함 (통과 아님)');
  });
});

describe('접근성 — Runtime Audit', () => {
  const openRuntime = async () => {
    const view = renderEvaluation(`${PATH}?run=run-a11y`, files());
    await main().findByRole('table', { name: 'token 색 쌍 test 결과' });
    main().getByRole('button', { name: 'Runtime Audit' }).focus();
    await view.user.keyboard('{Enter}');
    await main().findByRole('table', { name: `위반 rule — ${LABEL}` });
    return view;
  };

  it('키보드로 보기를 바꾸고, severity 막대는 rule 표의 node 수와 같다', async () => {
    const { location } = await openRuntime();
    expect(location()).toBe(`${PATH}?run=run-a11y&panel=runtime`);
    const figure = main().getByRole('figure', { name: `impact 별 위반 node — ${LABEL}` });
    const bars = within(figure).getAllByRole('listitem');
    const table = main().getByRole('table', { name: `위반 rule — ${LABEL}` });
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
    await openRuntime();
    const incomplete = main().getByRole('table', {
      name: `incomplete (확인 필요, 통과 아님) — ${LABEL}`,
    });
    expect(rowOf(incomplete, /aria-valid-attr-value/).textContent).toContain('unknown');
  });

  it('노드 펼침 버튼은 expanded 와 이름을 갖고, 접으면 포커스를 버튼으로 돌려준다', async () => {
    const { user } = await openRuntime();
    const table = main().getByRole('table', { name: `위반 rule — ${LABEL}` });
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
    const { user } = await openRuntime();
    await user.selectOptions(
      main().getByLabelText('검사 대상'),
      'devhub:/evaluation/ai:dark:mobile',
    );
    expect(await main().findByText('검사 실패 — page.goto: Timeout 20000ms exceeded')).toBeTruthy();
    expect(main().queryByRole('table', { name: /위반 rule —/ })).toBeNull();
  });

  it('baseline 비교는 같은 engine 일 때만 rule 별 차이를 보인다', async () => {
    const { user } = await openRuntime();
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

  it('출처 하나만 있어도 나머지 출처를 통과로 채우지 않는다', async () => {
    renderEvaluation(
      `${PATH}?run=run-partial`,
      publicFiles([
        accessibilityArtifact('run-partial', [manualSummary(), tokenContrastSummary()]),
      ]),
    );
    expect(
      await main().findByText('이 실행에 Storybook story (axe · #storybook-root) 결과가 없다'),
    ).toBeTruthy();
    expect(storybookSummary().id).toBe('a11y:storybook');
  });
});

describe('접근성 — Runtime Audit 출처', () => {
  const runtime = (run: string) => renderEvaluation(`${PATH}?run=${run}&panel=runtime`, files());

  it('Runtime Audit 는 DevHub 평가 화면 audit 을 보인다', async () => {
    runtime('run-devhub');
    expect(
      await main().findByRole('region', { name: 'DevHub 평가 화면 (axe · document)' }),
    ).toBeTruthy();
  });

  it('audit 이 없는 실행은 DevHub 평가 화면 audit 결과가 없다고 말한다', async () => {
    runtime('run-static');
    expect(
      await main().findByText('이 실행에 DevHub 평가 화면 (axe · document) 결과가 없다'),
    ).toBeTruthy();
  });
});
