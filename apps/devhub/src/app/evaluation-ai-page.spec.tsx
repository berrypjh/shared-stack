import { screen, waitFor, within } from '@testing-library/react';

import { evalArtifact, offlineEvalRun, RN_UNSUPPORTED } from '@/test/evaluation/evals';
import { renderEvaluation } from '@/test/evaluation/render';
import { publicFiles, qualityArtifact } from '@/test/evaluation/runs';

const files = () => publicFiles([qualityArtifact('run-quality'), evalArtifact('run-eval')]);

const SCORECARD = 'Primary metrics — smoke-scripted';
const main = () => within(screen.getByRole('main'));
const table = (name: string) => main().getByRole('table', { name });
const bodyRows = (name: string) => within(table(name)).getAllByRole('row').slice(1);
const rowIn = (tableName: string, name: RegExp) =>
  within(table(tableName)).getByRole('row', { name });
const cellsOf = (tableName: string, header: string) =>
  Array.from(
    within(table(tableName))
      .getByRole('rowheader', { name: header })
      .closest('tr')
      ?.querySelectorAll('td') ?? [],
    (cell) => cell.textContent,
  );

describe('AI 평가', () => {
  it('smoke-scripted 출처를 필터와 관계없이 항상 보인다', async () => {
    const { user } = renderEvaluation('/evaluation/ai?run=run-eval', files());
    const provenance = await main().findByRole('region', { name: '평가 출처' });
    for (const text of [
      'smoke-scripted',
      'harness smoke — 모델 성능이 아님',
      'live executor 없음',
      'baseline 없음',
    ]) {
      expect(provenance.textContent).toContain(text);
    }
    await user.click(main().getByRole('button', { name: 'consumer-docs' }));
    expect(main().getByRole('region', { name: '평가 출처' }).textContent).toContain(
      'smoke-scripted',
    );
    expect(table(SCORECARD)).toBeTruthy();
  });

  it('primary metric 은 원본 이름과 분자/분모·n 그대로다', async () => {
    renderEvaluation('/evaluation/ai?run=run-eval', files());
    await main().findByRole('table', { name: SCORECARD });
    expect(
      within(table(SCORECARD))
        .getAllByRole('columnheader')
        .map((header) => header.textContent),
    ).toEqual([
      'variant',
      'verifiedTaskSuccessRate',
      'routingAccuracy',
      'requiredEvidenceRecallAtK',
      'medianInputTokens',
      'falseSuccessRate',
    ]);
    const executed = rowIn(SCORECARD, /^progressive-with-repair/);
    expect(executed.textContent).toContain('50.0% (2/4)');
    expect(executed.textContent).toContain('0.83 (n=3)');
    expect(executed.textContent).toContain('1,000 tokens (n=4)');
    expect(executed.textContent).toContain('33.3% (1/3)');
  });

  it('secondary · diagnostic · failureBreakdown 표도 같은 executor 이름을 붙인다', async () => {
    renderEvaluation('/evaluation/ai?run=run-eval', files());
    await main().findByRole('table', { name: SCORECARD });
    expect(table('Secondary · diagnostic metrics — smoke-scripted')).toBeTruthy();
    expect(table('failureBreakdown — smoke-scripted')).toBeTruthy();
  });

  it('false success 차트는 주장한 trial 분모를 표와 같은 값으로 그린다', async () => {
    renderEvaluation('/evaluation/ai?run=run-eval', files());
    const figure = await main().findByRole('figure', {
      name: 'falseSuccessRate — smoke-scripted',
    });
    const description = document.getElementById(figure.getAttribute('aria-describedby') ?? '');
    expect(description?.textContent).toContain('분모는 성공을 명시적으로 주장한 trial 수');
    const bars = within(figure).getAllByRole('listitem');
    expect(bars.map((bar) => [bar.dataset.key, bar.lastElementChild?.textContent])).toEqual([
      ['consumer-docs', '100.0% (3/3)'],
      ['progressive-with-repair', '33.3% (1/3)'],
    ]);
    for (const bar of bars) {
      const row = rowIn(SCORECARD, new RegExp(`^${bar.dataset.key}`));
      expect(row.textContent).toContain(bar.lastElementChild?.textContent);
    }
    expect(bars[1].dataset.value).toBe(String(1 / 3));
  });

  it('context 는 initial·routed·scenario·실제 입력을 panel 로 나눈다', async () => {
    const { user, location } = renderEvaluation('/evaluation/ai?run=run-eval', files());
    await main().findByRole('table', { name: 'Context — variant-initial' });
    expect(bodyRows('Context — variant-initial')).toHaveLength(2);

    await user.click(main().getByRole('button', { name: 'variant-routed' }));
    expect(location()).toBe('/evaluation/ai?run=run-eval&panel=routed');
    expect(
      bodyRows('Context — variant-routed').map(
        (row) => within(row).getByRole('rowheader').textContent,
      ),
    ).toEqual(['progressive-with-repair@web', 'progressive-with-repair@react-native']);

    await user.click(main().getByRole('button', { name: 'package-scenario' }));
    const missing = rowIn('Context — package-scenario', /design-tokens\/agents\+catalog/);
    expect(missing.textContent).toContain('값 없음 — 없는 입력: libs/design-tokens/dist/AGENTS.md');
  });

  it('agent-input 은 측정하는 수집기가 없다고 쓰고 수집 명령을 주지 않는다', async () => {
    const { user } = renderEvaluation('/evaluation/ai?run=run-eval', files());
    await main().findByRole('table', { name: 'Context — variant-initial' });
    await user.click(main().getByRole('button', { name: 'agent-input (실제 입력)' }));
    const notice = main().getByRole('region', {
      name: '이 영역을 측정하는 수집기가 아직 없다 — agent-input context 측정',
    });
    expect(notice.dataset.state).toBe('not-applicable');
    expect(notice.textContent).toContain('아직 어느 수집기도 측정하지 않는다');
    expect(notice.textContent).not.toContain('profile');
    expect(within(notice).queryByRole('button')).toBeNull();
    expect(notice.textContent).not.toContain('pnpm quality:collect');
  });

  it('context report 를 import 하지 못한 평가 실행은 그 이유를 쓰고 다른 실행을 추측하지 않는다', async () => {
    renderEvaluation(
      '/evaluation/ai?run=run-no-context&panel=routed',
      publicFiles([
        qualityArtifact('run-quality'),
        evalArtifact('run-no-context', { contexts: [] }),
      ]),
    );
    const notice = await main().findByText(
      'run-no-context 는 이 영역을 실행하지 않았다 — variant-routed context 측정',
    );
    const section = notice.closest('section');
    expect(section?.textContent).toContain('context report import missing — context.json 이 없다');
    expect(section?.textContent).not.toContain('run-quality');
  });

  it('주소의 #context 대상 행으로 포커스를 옮긴다', async () => {
    renderEvaluation(
      '/evaluation/ai?run=run-eval#context-context.variant-initial.consumer-docs.openai',
      files(),
    );
    await main().findByRole('table', { name: 'Context — variant-initial' });
    const row = rowIn('Context — variant-initial', /^consumer-docs/);
    await waitFor(() => expect(document.activeElement).toBe(row));
  });

  it('routing 은 expected 4행 × predicted 5열 방향이고 both·unreported 를 숨기지 않는다', async () => {
    renderEvaluation('/evaluation/ai?run=run-eval', files());
    const resolver = await main().findByRole('table', {
      name: 'Routing — deterministic-resolver',
    });
    expect(
      within(resolver)
        .getAllByRole('columnheader')
        .map((header) => header.textContent),
    ).toEqual(['expected \\ predicted', 'web', 'react-native', 'none', 'both', 'unreported']);
    const rows = within(resolver).getAllByRole('row').slice(1);
    expect(rows.map((row) => within(row).getByRole('rowheader').textContent)).toEqual([
      'web',
      'react-native',
      'both',
      'none',
    ]);
    expect(
      within(rows[2])
        .getAllByRole('cell')
        .map((cell) => cell.dataset.count),
    ).toEqual(['0', '0', '0', '1', '1']);
    expect(main().getByText('total 37 · correct 36 · unreported 1 · accuracy 97.3%')).toBeTruthy();
    expect(table('Routing — trace-grades · consumer-docs')).toBeTruthy();
    expect(
      rowIn('Routing 실패·미보고 trace', /consumer-docs::web-textfield-helper::1/).textContent,
    ).toContain('routing-unreported');
  });

  it('retrieval 은 K·required·hits·RR·중복을 보이고 required evidence 가 없으면 N/A 다', async () => {
    const name = 'Retrieval — trace 별 · consumer-docs';
    renderEvaluation('/evaluation/ai?run=run-eval&variant=consumer-docs', files());
    await main().findByRole('table', { name });
    expect(rowIn(name, /consumer-docs::no-ui-date-format::1/).textContent).toContain(
      'N/A — required evidence 없음',
    );
    expect(cellsOf(name, 'consumer-docs::web-textfield-helper::1').slice(0, 8)).toEqual([
      '5',
      '4',
      '2',
      '0.50',
      '0.50',
      '2',
      '2',
      '1',
    ]);
  });

  it('verification 은 kind × status 로 세고 unsupported 를 통과로 바꾸지 않는다', async () => {
    renderEvaluation('/evaluation/ai?run=run-eval&variant=progressive-with-repair', files());
    const counts = 'Verification run — kind × status · progressive-with-repair';
    await main().findByRole('table', { name: counts });
    expect(cellsOf(counts, 'test')).toEqual(['3', '0', '0', '1', '0']);
    const region = main().getByRole('region', { name: 'Verification' });
    expect(region.textContent).toContain('harness-executed');
    expect(region.textContent).toContain('no-repair-hook');
    const rn = rowIn(
      'Verification — trace 별 · progressive-with-repair',
      /progressive-with-repair::rn-use-theme-getcolor::1/,
    );
    expect(rn.textContent).toContain('test 지원 안 함');
    expect(rn.textContent).toContain(RN_UNSUPPORTED);
  });

  it('검증을 보고만 한 variant 는 run 이 없다고 쓴다', async () => {
    renderEvaluation('/evaluation/ai?run=run-eval&variant=consumer-docs', files());
    expect(
      await main().findByText('verification run 없음 — executor-reported, 검증을 실행하지 않았다'),
    ).toBeTruthy();
  });

  it('variant 필터는 키보드로 바꾸고 원본 값을 다시 계산하지 않는다고 알린다', async () => {
    const { user, location } = renderEvaluation('/evaluation/ai?run=run-eval', files());
    await main().findByRole('table', { name: SCORECARD });
    main().getByRole('button', { name: 'consumer-docs' }).focus();
    await user.keyboard('{Enter}');
    expect(location()).toBe('/evaluation/ai?run=run-eval&variant=consumer-docs');
    expect(bodyRows(SCORECARD)).toHaveLength(1);
    expect(
      main().getByText(
        'variant 2개 중 필터와 일치 1개 — metric 은 variant 별 원본 값이고 다시 계산하지 않는다',
      ),
    ).toBeTruthy();
  });

  it('variant 가 없는 offline 평가도 resolver routing 을 보이고 필터 불일치로 오해하지 않는다', async () => {
    const offline = { ...evalArtifact('run-offline'), evals: [offlineEvalRun()] };
    renderEvaluation('/evaluation/ai?run=run-offline', publicFiles([offline]));
    expect(
      await main().findByRole('table', { name: 'Routing — deterministic-resolver' }),
    ).toBeTruthy();
    expect(main().queryByText('필터와 일치하는 항목이 없다')).toBeNull();
    expect(
      main().getByText('eval:offline 는 이 영역을 실행하지 않았다 — variant metric'),
    ).toBeTruthy();
    expect(main().getByRole('region', { name: '평가 출처' }).textContent).toContain(
      'summary 를 읽지 못해 실행 조건을 모른다',
    );
  });

  it('variant 가 없는 verification 은 variant 를 준 summary 의 import 상태를 이유로 쓴다', async () => {
    const base = offlineEvalRun();
    const evalRun = {
      ...base,
      import: { ...base.import, traces: { status: 'missing', reason: 'traces.jsonl 이 없다' } },
    };
    const offline = { ...evalArtifact('run-offline'), evals: [evalRun] };
    renderEvaluation('/evaluation/ai?run=run-offline', publicFiles([offline]));
    const region = await main().findByRole('region', { name: 'Verification' });
    expect(region.textContent).toContain(
      'summary report import not-run — executor 를 돌리지 않은 offline 산출물이다',
    );
    expect(region.textContent).not.toContain('traces report import');
    expect(main().getByRole('region', { name: 'Retrieval' }).textContent).toContain(
      'traces report import missing — traces.jsonl 이 없다',
    );
  });

  it('평가 결과가 없는 실행은 unsupported 다', async () => {
    renderEvaluation('/evaluation/ai?run=run-quality', files());
    expect(await main().findByText('run-quality 에는 이 영역이 없다 — 평가 결과')).toBeTruthy();
  });
});
