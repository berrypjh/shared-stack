import { expect, type Page, test } from '@playwright/test';

import { COMPARE_RUNS, publicFiles, serveObservability } from './fixtures';

/** 이동 목적지는 여기 적지 않는다 — 렌더된 주요 메뉴에서 읽는다. */
const navTargets = async (page: Page) => {
  const links = await page.getByRole('navigation', { name: '주요 메뉴' }).getByRole('link').all();
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

test.describe('내비게이션', () => {
  test('렌더된 주요 메뉴의 모든 항목으로 이동하고 h1 포커스와 현재 위치가 따라온다', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Quality Lab');
    const targets = await navTargets(page);
    // 수집이 조용히 비면 아래 반복은 아무것도 확인하지 않고 통과한다.
    expect(targets.length).toBeGreaterThan(5);

    for (const { label, href } of targets) {
      await page.goto(href === '/' ? '/runs' : '/');
      const nav = page.getByRole('navigation', { name: '주요 메뉴' });
      await nav.getByRole('link', { name: label, exact: true }).click();
      await page.waitForURL((url) => url.pathname === href);

      const heading = page.getByRole('heading', { level: 1, name: label });
      await expect(heading).toBeVisible();
      await expect(heading).toBeFocused();
      await expect(nav.getByRole('link', { name: label, exact: true })).toHaveAttribute(
        'aria-current',
        'page',
      );
    }
  });

  test('보고 있는 실행(run)은 화면을 옮겨도 주소에 남는다', async ({ page }) => {
    await page.goto('/runs?run=run-base');
    await page
      .getByRole('navigation', { name: '주요 메뉴' })
      .getByRole('link', { name: '번들', exact: true })
      .click();
    await page.waitForURL((url) => url.pathname === '/bundles');
    expect(new URL(page.url()).searchParams.get('run')).toBe('run-base');
  });
});
