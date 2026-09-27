import { screen, waitFor, within } from '@testing-library/react';

import { bundleArtifact, cxOnly } from '@/test/evaluation/bundles';
import { HASH, OTHER_SHA, publicArtifact, SHA } from '@/test/evaluation/fixtures';
import { renderEvaluation } from '@/test/evaluation/render';
import { designArtifact, publicFiles, qualityArtifact } from '@/test/evaluation/runs';

const main = () => within(screen.getByRole('main'));

describe('실행 기록', () => {
  const files = () => publicFiles([designArtifact('run-design'), qualityArtifact('run-quality')]);

  it('실행을 요약과 함께 나열하고 run 전체는 고른 것만 받는다', async () => {
    const { calls } = renderEvaluation('/evaluation/runs', files());
    const table = await main().findByRole('table', { name: '공개된 실행' });
    const quality = await within(table).findByRole('row', { name: /run-quality/ });
    expect(quality.textContent).toContain('core');
    expect(quality.textContent).toContain('완료');
    expect(await main().findByRole('table', { name: '관측 항목' })).toBeTruthy();
    const urls = calls.map((call) => call.url);
    expect(urls).toContain('/observability/runs/run-quality.json');
    expect(urls).not.toContain('/observability/runs/run-design.json');
  });

  it('실행을 누르면 주소와 detail 이 그 실행으로 바뀐다', async () => {
    const { user, location } = renderEvaluation('/evaluation/runs', files());
    const table = await main().findByRole('table', { name: '공개된 실행' });
    await user.click(await within(table).findByRole('link', { name: 'run-design' }));
    expect(location()).toBe('/evaluation/runs?run=run-design');
    const summary = await main().findByRole('region', { name: '실행 요약' });
    expect(await within(summary).findByText('run-design')).toBeTruthy();
  });

  it('요약 없이 export 된 run 은 요약 없음과 export 명령을 준다', async () => {
    renderEvaluation(
      '/evaluation/runs',
      publicFiles([qualityArtifact('run-quality')], { summaries: false }),
    );
    const table = await main().findByRole('table', { name: '공개된 실행' });
    const row = await within(table).findByRole('row', { name: /run-quality/ });
    expect(await within(row).findByText(/요약 없음/)).toBeTruthy();
    expect(row.textContent).toContain('pnpm quality:export --run-id=run-quality');
  });

  it('개요의 번들 링크는 실행 기록의 번들 표로 와서 그 section 에 포커스를 둔다', async () => {
    renderEvaluation('/evaluation/runs?run=run-quality#bundles', files());
    expect(await main().findByRole('table', { name: 'bundle 측정' })).toBeTruthy();
    const target = document.getElementById('bundles');
    expect(target).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(target));
  });

  it('오른쪽 상세 칸은 고른 실행의 요약을 보인다', async () => {
    renderEvaluation('/evaluation/runs?run=run-design', files());
    const inspector = within(screen.getByRole('complementary', { name: '상세 정보' }));
    expect(await inspector.findByText('static')).toBeTruthy();
    expect(inspector.getByRole('heading', { name: 'run-design' })).toBeTruthy();
  });
});

const CX = 'bundle.size-limit.react-ui.cx-only';

type Timing = { startedAt: string; sha?: string };

const coreRun = (runId: string, bundles: unknown[], { startedAt, sha = SHA }: Timing) => {
  const base = publicArtifact(runId, { profile: 'core' });
  return {
    ...bundleArtifact(runId, bundles),
    metadata: {
      ...base.metadata,
      source: { ...base.metadata.source, sha },
      collection: { sha, startedAt, finishedAt: startedAt },
    },
  };
};

const RUNS = [
  coreRun('run-base', [cxOnly(10574)], { startedAt: '2026-09-13T08:00:00.000Z' }),
  coreRun('run-gzip', [{ ...cxOnly(9000), compression: 'gzip' }], {
    startedAt: '2026-09-13T08:30:00.000Z',
  }),
  coreRun('run-current', [cxOnly(10474)], {
    startedAt: '2026-09-13T09:00:00.000Z',
    sha: OTHER_SHA,
  }),
];

const POINTER = {
  version: 1,
  pointers: [{ profile: 'core', runId: 'run-base', setAt: '2026-09-13T10:00:00.000Z' }],
  history: [
    { profile: 'core', runId: 'run-base', setAt: '2026-09-13T10:00:00.000Z', replaced: null },
  ],
};

const compareFiles = (pointer: unknown = POINTER, runs: unknown[] = RUNS) => ({
  ...publicFiles(runs as { metadata: { runId: string } }[]),
  ...(pointer === null ? {} : { '/observability/baseline.json': pointer }),
});

const compareRegion = () => main().findByRole('region', { name: '실행 비교' });

describe('실행 비교 — Level 1 · 2', () => {
  it('기준을 고르지 않으면 no-baseline 이고 최신 실행을 자동으로 기준 삼지 않는다', async () => {
    renderEvaluation('/evaluation/runs?run=run-current', compareFiles());
    const region = await compareRegion();
    expect(await within(region).findByText(/기준 실행을 고르지 않았다/)).toBeTruthy();
    expect(region.textContent).toContain('기준 없음 (no-baseline)');
    expect(main().queryByRole('table', { name: /^변화 —/ })).toBeNull();
  });

  it('baseline 포인터는 보이기만 하고, 링크로 고르면 주소에 남는다', async () => {
    const { user, location } = renderEvaluation('/evaluation/runs?run=run-current', compareFiles());
    const region = await compareRegion();
    expect(await within(region).findByText(/지정된 baseline 포인터: run-base/)).toBeTruthy();
    expect(region.textContent).toContain('기준 없음 (no-baseline)');
    await user.click(within(region).getByRole('link', { name: '포인터 baseline 으로 비교' }));
    expect(location()).toBe('/evaluation/runs?run=run-current&base=run-base');
  });

  it('명시한 기준과 비교해 부호 있는 차이와 두 실행의 출처 · 수집 시각을 보인다', async () => {
    const { user, location } = renderEvaluation('/evaluation/runs?run=run-current', compareFiles());
    await compareRegion();
    await user.selectOptions(await main().findByLabelText('기준 실행 (baseline)'), 'run-base');
    expect(location()).toBe('/evaluation/runs?run=run-current&base=run-base');
    const table = await main().findByRole('table', { name: '변화 — run-current 대 run-base' });
    const row = within(table).getByRole('rowheader', { name: CX }).closest('tr') as HTMLElement;
    expect(row.textContent).toContain('-100 B (-0.95%)');
    const region = await compareRegion();
    expect(region.textContent).toContain('비교 가능 (comparable)');
    expect(region.textContent).toContain('source.sha');
    expect(region.textContent).toContain('참고 (비교는 계속)');
    const lineage = main().getByRole('table', { name: '비교하는 두 실행' });
    expect(lineage.textContent).toContain('2026-09-13T09:00:00.000Z');
    expect(lineage.textContent).toContain('2026-09-13T08:00:00.000Z');
    expect(lineage.textContent).toContain(OTHER_SHA.slice(0, 7));
  });

  it('비교 중에 기준이나 현재 실행을 바꾸면 이전 비교를 새 id 로 읽지 않고 새 비교를 보인다', async () => {
    const { user, location } = renderEvaluation(
      '/evaluation/runs?run=run-current&base=run-base',
      compareFiles(),
    );
    await main().findByRole('table', { name: '변화 — run-current 대 run-base' });
    await user.selectOptions(main().getByLabelText('기준 실행 (baseline)'), 'run-gzip');
    expect(location()).toBe('/evaluation/runs?run=run-current&base=run-gzip');
    expect(
      await main().findByRole('table', { name: '변화 — run-current 대 run-gzip' }),
    ).toBeTruthy();
    await user.selectOptions(main().getByLabelText('현재 실행 (current)'), 'run-base');
    expect(await main().findByRole('table', { name: '변화 — run-base 대 run-gzip' })).toBeTruthy();
  });

  it('압축이 다른 행은 비교 불가이고 차이를 만들지 않는다', async () => {
    renderEvaluation('/evaluation/runs?run=run-gzip&base=run-base', compareFiles());
    const table = await main().findByRole('table', { name: '변화 — run-gzip 대 run-base' });
    const row = within(table).getByRole('rowheader', { name: CX }).closest('tr') as HTMLElement;
    expect(row.textContent).toContain('비교 불가');
    expect(row.textContent).toContain('compression differs');
    expect(row.textContent).not.toContain('B (');
  });

  it('측정하지 못한 값은 not-measured 로 두고 차이를 만들지 않는다', async () => {
    const runs = [
      RUNS[0],
      coreRun('run-unmeasured', [cxOnly(null)], { startedAt: '2026-09-13T11:00:00.000Z' }),
    ];
    renderEvaluation('/evaluation/runs?run=run-unmeasured&base=run-base', compareFiles(null, runs));
    const table = await main().findByRole('table', { name: '변화 — run-unmeasured 대 run-base' });
    const row = within(table).getByRole('rowheader', { name: CX }).closest('tr') as HTMLElement;
    expect(row.textContent).toContain('측정 안 됨');
    expect(row.textContent).toContain('값 없음');
  });

  it('같은 실행을 기준으로 고르면 비교하지 않는다', async () => {
    renderEvaluation('/evaluation/runs?run=run-base&base=run-base', compareFiles());
    const region = await compareRegion();
    expect(await within(region).findByText(/비교 불가 \(incompatible\)/)).toBeTruthy();
    expect(region.textContent).toContain('metadata.runId');
  });

  it('포인터 파일이 없는 것과 깨진 것을 다른 글로 알린다', async () => {
    renderEvaluation('/evaluation/runs?run=run-current', compareFiles(null));
    expect(await main().findByText(/지정된 baseline 포인터가 없다/)).toBeTruthy();
  });

  it('깨진 포인터 파일은 없음으로 뭉개지 않는다', async () => {
    renderEvaluation('/evaluation/runs?run=run-current', compareFiles('{oops'));
    expect(await main().findByText(/baseline 포인터 파일을 읽을 수 없다/)).toBeTruthy();
    expect(main().queryByText(/지정된 baseline 포인터가 없다/)).toBeNull();
  });
});

describe('실행 기록 — Level 3', () => {
  it('비교 가능한 점만 잇는 추세를 보인다', async () => {
    const { user, location } = renderEvaluation('/evaluation/runs?run=run-current', compareFiles());
    await compareRegion();
    await user.selectOptions(await main().findByLabelText('추세 지표'), CX);
    expect(location()).toBe(`/evaluation/runs?run=run-current&series=${encodeURIComponent(CX)}`);
    const table = await main().findByRole('table', { name: `추세 — ${CX}` });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows.map((row) => within(row).getByRole('rowheader').textContent)).toEqual([
      'run-base',
      'run-gzip',
      'run-current',
    ]);
    expect(rows[0].textContent).toContain('구간 1');
    expect(rows[1].textContent).toContain('구간 2');
    expect(rows[2].textContent).toContain('구간 3');
  });

  it('요약 없는 실행은 gap 으로 자리를 지킨다', async () => {
    const { user } = renderEvaluation('/evaluation/runs?run=run-current', {
      ...compareFiles(),
      '/observability/runs/run-gzip.summary.json': 'not json',
    });
    await compareRegion();
    await user.selectOptions(await main().findByLabelText('추세 지표'), CX);
    const table = await main().findByRole('table', { name: `추세 — ${CX}` });
    const gap = within(table)
      .getByRole('rowheader', { name: 'run-gzip' })
      .closest('tr') as HTMLElement;
    expect(gap.textContent).toContain('요약 없음 (gap)');
    expect(HASH).toHaveLength(64);
  });
});
