import { expect, test } from '@playwright/test';

import { enterMain, tabTo } from './support/keyboard';

test.describe('기록', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('목록은 최신순이고 항목마다 날짜 · 종류 · 요약이 있다', async ({ page }) => {
    await page.goto('/records');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('기록');
    const items = page.getByRole('main').getByRole('listitem');
    await expect(items.first()).toContainText(/\d{4}-\d{2}-\d{2}/);
    await expect(items.first()).toContainText(/설계 결정|문제 해결|구현/);
    const dates = await items.locator('time').allTextContents();
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  test('기록 하나는 본문 · "이 페이지에서" · 상세 정보를 함께 보인다', async ({ page }) => {
    await page.goto('/records');
    const first = page.getByRole('main').getByRole('listitem').first().getByRole('link');
    await enterMain(page);
    await tabTo(page, first);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/records\/[a-z0-9-]+$/);

    const toc = page.getByRole('navigation', { name: '이 페이지에서' });
    await expect(toc.getByRole('link', { name: '검증' })).toBeVisible();
    const inspector = page.getByRole('complementary', { name: '상세 정보' });
    await expect(inspector.getByRole('heading', { level: 3, name: /^소스/ })).toBeVisible();
    await expect(inspector.getByRole('heading', { level: 3, name: /^테스트/ })).toBeVisible();
  });

  test('상세 정보의 다음 기록은 상세 정보에 머문다', async ({ page }) => {
    await page.goto('/records');
    const first = page.getByRole('main').getByRole('listitem').first().getByRole('link');
    await first.click();
    const inspector = page.getByRole('complementary', { name: '상세 정보' });
    await inspector
      .getByRole('navigation', { name: '기록 이동' })
      .getByRole('link', { name: /^다음 기록/ })
      .click();
    await expect(page).toHaveURL(/\/records\/[a-z0-9-]+#devhub-inspector$/);
    await expect(inspector).toBeFocused();
  });
});
