import { expect, type Page, test } from '@playwright/test';

import {
  COMPARE_RUNS,
  coreRun,
  CX,
  cxOnly,
  POINTER,
  publicFiles,
  serveObservability,
} from './fixtures';

const BASELINE = '/observability/baseline.json';

const compareRegion = (page: Page) => page.getByRole('region', { name: '실행 비교' });

const metricRow = (page: Page, caption: string) =>
  page
    .getByRole('table', { name: caption })
    .getByRole('row')
    .filter({ has: page.getByRole('rowheader', { name: CX }) });

test.describe('실행 비교 — 명시한 baseline', () => {
  test('기준을 고르지 않으면 no-baseline 이고, 고른 기준은 주소로 재현되며 뒤로 가면 풀린다', async ({
    page,
  }) => {
    await serveObservability(page, publicFiles(COMPARE_RUNS, { [BASELINE]: POINTER }));
    await page.goto('/runs?run=run-current');

    const region = compareRegion(page);
    await expect(region.getByText('기준 없음 (no-baseline)')).toBeVisible();
    await expect(region.getByText(/기준 실행을 고르지 않았습니다/)).toBeVisible();
    await expect(page.getByRole('table', { name: /^변화 —/ })).toHaveCount(0);

    const baseline = page.getByLabel('기준 실행 (baseline)');
    await baseline.focus();
    await expect(baseline).toBeFocused();
    await baseline.selectOption('run-base');
    await expect(page).toHaveURL(/\/runs\?run=run-current&base=run-base$/);

    const caption = '변화 — run-current 대 run-base';
    await expect(metricRow(page, caption)).toContainText('-100 B (-0.95%)');
    await expect(page.getByRole('region', { name: `${caption} 표` })).toBeVisible();
    await expect(region.getByText('비교 가능 (comparable)')).toBeVisible();
    await expect(region).toContainText('source.sha');

    await page.reload();
    await expect(metricRow(page, caption)).toContainText('-100 B (-0.95%)');

    await page.goBack();
    await expect(page).toHaveURL(/\/runs\?run=run-current$/);
    await expect(region.getByText('기준 없음 (no-baseline)')).toBeVisible();
  });

  test('baseline 포인터는 자동으로 적용하지 않고 링크로 고른다', async ({ page }) => {
    await serveObservability(page, publicFiles(COMPARE_RUNS, { [BASELINE]: POINTER }));
    await page.goto('/runs?run=run-current');
    const region = compareRegion(page);
    await expect(region.getByText(/지정된 baseline 포인터: run-base/)).toBeVisible();
    await expect(region.getByText('기준 없음 (no-baseline)')).toBeVisible();
    await region.getByRole('link', { name: '포인터 baseline 으로 비교' }).click();
    await expect(page).toHaveURL(/\/runs\?run=run-current&base=run-base$/);
  });

  test('압축 조건이 다른 행은 비교 불가이고 차이를 만들지 않는다', async ({ page }) => {
    await serveObservability(page, publicFiles(COMPARE_RUNS));
    await page.goto('/runs?run=run-gzip&base=run-base');
    const row = metricRow(page, '변화 — run-gzip 대 run-base');
    await expect(row).toContainText('비교 불가');
    await expect(row).toContainText('compression differs');
    await expect(row).not.toContainText('B (');
  });

  test('측정하지 못한 값은 not-measured 로 두고 차이를 만들지 않는다', async ({ page }) => {
    const runs = [
      COMPARE_RUNS[0],
      coreRun('run-unmeasured', [cxOnly(null)], { startedAt: '2026-09-13T11:00:00.000Z' }),
    ];
    await serveObservability(page, publicFiles(runs));
    await page.goto('/runs?run=run-unmeasured&base=run-base');
    const row = metricRow(page, '변화 — run-unmeasured 대 run-base');
    await expect(row).toContainText('측정 안 됨');
    await expect(row).toContainText('값 없음');
  });

  test('같은 실행을 기준으로 고르면 이유와 함께 비교하지 않는다', async ({ page }) => {
    await serveObservability(page, publicFiles(COMPARE_RUNS));
    await page.goto('/runs?run=run-base&base=run-base');
    const region = compareRegion(page);
    await expect(region.getByText('비교 불가 (incompatible)')).toBeVisible();
    await expect(region).toContainText('metadata.runId');
  });

  test('포인터 파일이 없는 것과 깨진 것은 다른 화면이다', async ({ page }) => {
    await serveObservability(page, publicFiles(COMPARE_RUNS));
    await page.goto('/runs?run=run-current');
    await expect(page.getByText(/지정된 baseline 포인터가 없습니다/)).toBeVisible();

    await page.unrouteAll();
    await serveObservability(page, publicFiles(COMPARE_RUNS, { [BASELINE]: '{oops' }));
    await page.reload();
    await expect(page.getByText(/baseline 포인터 파일을 읽을 수 없습니다/)).toBeVisible();
    await expect(page.getByText(/지정된 baseline 포인터가 없습니다/)).toHaveCount(0);
  });
});

test.describe('실행 기록 추세', () => {
  test('비교 조건이 같은 이웃한 점만 한 구간으로 잇고 요약 없는 실행은 gap 으로 둔다', async ({
    page,
  }) => {
    await serveObservability(page, publicFiles(COMPARE_RUNS));
    await page.goto('/runs?run=run-current');
    await page.getByLabel('추세 지표').selectOption(CX);
    await expect(page).toHaveURL(new RegExp(`series=${CX.replace(/\./g, '\\.')}`));

    const table = page.getByRole('table', { name: `추세 — ${CX}` });
    await expect(table.getByRole('rowheader')).toHaveText(['run-base', 'run-gzip', 'run-current']);
    await expect(table.getByRole('row').nth(1)).toContainText('구간 1');
    await expect(table.getByRole('row').nth(2)).toContainText('구간 2');
    await expect(table.getByRole('row').nth(3)).toContainText('구간 3');

    await page.unrouteAll();
    await serveObservability(
      page,
      publicFiles(COMPARE_RUNS, { '/observability/runs/run-gzip.summary.json': 'not json' }),
    );
    await page.reload();
    await expect(
      table.getByRole('row').filter({ has: page.getByRole('rowheader', { name: 'run-gzip' }) }),
    ).toContainText('요약 없음 (gap)');
  });
});
