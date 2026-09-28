import { expect, type Page, test } from '@playwright/test';

import { focusIsAtStart } from './support/keyboard';
import { COMPARE_RUNS, publicFiles, serveObservability } from './support/observability';

/** 탐색기의 평가 섹션. 이동 목적지는 여기 적지 않는다 — 렌더된 하위 메뉴에서 읽는다. */
const evaluation = (page: Page) =>
  page.getByRole('navigation', { name: '저장소 항목' }).getByRole('region', { name: /^평가/ });

const targets = async (page: Page) => {
  const links = await evaluation(page).getByRole('link').all();
  return Promise.all(
    links.map(async (link) => ({
      label: (await link.innerText()).trim(),
      href: (await link.getAttribute('href')) ?? '',
    })),
  );
};

test.beforeEach(async ({ page }) => {
  await serveObservability(page, publicFiles(COMPARE_RUNS));
});

test.describe('평가 하위 메뉴', () => {
  test('렌더된 모든 항목으로 이동하고, 이름 · 현재 위치 · 이동 뒤 포커스가 따라온다', async ({
    page,
  }) => {
    await page.goto('/evaluation');
    const items = await targets(page);
    // 수집이 조용히 비면 아래 반복은 아무것도 확인하지 않고 통과한다.
    expect(items.length).toBeGreaterThan(5);

    for (const { label, href } of items) {
      await page.goto(href === '/evaluation' ? '/evaluation/bundles' : '/evaluation');
      await evaluation(page).getByRole('link', { name: label, exact: true }).click();
      await page.waitForURL((url) => url.pathname === href);

      const heading = page.getByRole('main').getByRole('heading', { level: 1 });
      await expect(heading).toHaveText(label === '평가' ? '개요' : label);
      expect(await focusIsAtStart(page)).toBe(true);
      await expect(
        evaluation(page).getByRole('link', { name: label, exact: true }),
      ).toHaveAttribute('aria-current', 'page');
    }
  });

  test('보고 있는 실행(run)은 하위 화면을 옮겨도 주소에 남는다', async ({ page }) => {
    await page.goto('/evaluation/accessibility?run=run-base');
    await evaluation(page).getByRole('link', { name: '번들', exact: true }).click();
    await page.waitForURL((url) => url.pathname === '/evaluation/bundles');
    expect(new URL(page.url()).searchParams.get('run')).toBe('run-base');
  });
});
