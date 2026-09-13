import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { bundleArtifact, cxOnly } from '../../../test/bundles';
import { HASH, OTHER_SHA, publicArtifact, SHA } from '../../../test/fixtures';
import { locationOf, renderApp } from '../../../test/render';
import { publicFiles } from '../../../test/runs';

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

const files = (pointer: unknown = POINTER) => ({
  ...publicFiles(RUNS),
  ...(pointer === null ? {} : { '/observability/baseline.json': pointer }),
});

const compareRegion = () => screen.findByRole('region', { name: '실행 비교' });

describe('실행 비교 — Level 1·2', () => {
  it('기준을 고르지 않으면 no-baseline 이고 최신 실행을 자동으로 기준 삼지 않는다', async () => {
    renderApp('/runs?run=run-current', files());
    const region = await compareRegion();
    expect(await within(region).findByText(/기준 실행을 고르지 않았습니다/)).toBeTruthy();
    expect(region.textContent).toContain('기준 없음 (no-baseline)');
    expect(screen.queryByRole('table', { name: /^변화 —/ })).toBeNull();
  });

  it('baseline 포인터는 보이기만 하고, 링크로 고르면 주소에 남는다', async () => {
    const { user, router } = renderApp('/runs?run=run-current', files());
    const region = await compareRegion();
    expect(await within(region).findByText(/지정된 baseline 포인터: run-base/)).toBeTruthy();
    await user.click(within(region).getByRole('link', { name: '포인터 baseline 으로 비교' }));
    expect(locationOf(router)).toBe('/runs?run=run-current&base=run-base');
  });

  it('명시한 기준과 비교해 부호 있는 차이와 두 실행의 출처·수집 시각을 보인다', async () => {
    const { user, router } = renderApp('/runs?run=run-current', files());
    await compareRegion();
    await user.selectOptions(await screen.findByLabelText('기준 실행 (baseline)'), 'run-base');
    expect(locationOf(router)).toBe('/runs?run=run-current&base=run-base');
    const table = await screen.findByRole('table', { name: '변화 — run-current 대 run-base' });
    const row = within(table).getByRole('rowheader', { name: CX }).closest('tr') as HTMLElement;
    expect(row.textContent).toContain('-100 B');
    expect(row.textContent).toContain('-0.95%');
    const region = await compareRegion();
    expect(region.textContent).toContain('비교 가능 (comparable)');
    expect(region.textContent).toContain('source.sha');
    expect(region.textContent).toContain('참고 (비교는 계속)');
    const lineage = screen.getByRole('table', { name: '비교하는 두 실행' });
    expect(lineage.textContent).toContain('2026-09-13T09:00:00.000Z');
    expect(lineage.textContent).toContain('2026-09-13T08:00:00.000Z');
    expect(lineage.textContent).toContain(OTHER_SHA.slice(0, 7));
  });

  it('압축이 다른 행은 비교 불가이고 차이를 만들지 않는다', async () => {
    renderApp('/runs?run=run-gzip&base=run-base', files());
    const table = await screen.findByRole('table', { name: '변화 — run-gzip 대 run-base' });
    const row = within(table).getByRole('rowheader', { name: CX }).closest('tr') as HTMLElement;
    expect(row.textContent).toContain('비교 불가');
    expect(row.textContent).toContain('compression differs');
    expect(row.textContent).not.toContain('B (');
  });

  it('같은 실행을 기준으로 고르면 비교하지 않는다', async () => {
    renderApp('/runs?run=run-base&base=run-base', files());
    const region = await compareRegion();
    expect(await within(region).findByText(/비교 불가 \(incompatible\)/)).toBeTruthy();
    expect(region.textContent).toContain('metadata.runId');
  });

  it('포인터 파일이 없는 것과 깨진 것을 다른 글로 알린다', async () => {
    renderApp('/runs?run=run-current', files(null));
    expect(await screen.findByText(/지정된 baseline 포인터가 없습니다/)).toBeTruthy();
  });

  it('깨진 포인터 파일은 없음으로 뭉개지 않는다', async () => {
    renderApp('/runs?run=run-current', files('{oops'));
    expect(await screen.findByText(/baseline 포인터 파일을 읽을 수 없습니다/)).toBeTruthy();
    expect(screen.queryByText(/지정된 baseline 포인터가 없습니다/)).toBeNull();
  });
});

describe('실행 기록 — Level 3', () => {
  it('비교 가능한 점만 잇는 추세를 보인다', async () => {
    const { user, router } = renderApp('/runs?run=run-current', files());
    await compareRegion();
    await user.selectOptions(await screen.findByLabelText('추세 지표'), CX);
    expect(locationOf(router)).toBe(`/runs?run=run-current&series=${encodeURIComponent(CX)}`);
    const table = await screen.findByRole('table', { name: `추세 — ${CX}` });
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
    const { user } = renderApp('/runs?run=run-current', {
      ...files(),
      '/observability/runs/run-gzip.summary.json': 'not json',
    });
    await compareRegion();
    await user.selectOptions(await screen.findByLabelText('추세 지표'), CX);
    const table = await screen.findByRole('table', { name: `추세 — ${CX}` });
    const gap = within(table)
      .getByRole('rowheader', { name: 'run-gzip' })
      .closest('tr') as HTMLElement;
    expect(gap.textContent).toContain('요약 없음 (gap)');
    expect(HASH).toHaveLength(64);
  });
});
