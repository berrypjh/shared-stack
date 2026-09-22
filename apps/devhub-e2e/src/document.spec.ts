import { expect, test } from '@playwright/test';

import { enterMain, tabTo } from './support/keyboard';

const DOCUMENT = '/documents/design-tokens-agents';

test.describe('넓은 작업 영역의 "이 페이지에서"', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test('본문 옆에 있고 키보드로 절에 간다', async ({ page }) => {
    await page.goto(DOCUMENT);
    const toc = page.getByRole('navigation', { name: '이 페이지에서' });
    await expect(toc).toHaveCount(1);
    await expect(toc).toBeVisible();

    const link = toc.getByRole('link', { name: '테마 추가' });
    await enterMain(page);
    await tabTo(page, link, 120);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#%ED%85%8C%EB%A7%88-%EC%B6%94%EA%B0%80$|#테마-추가$/);
    const section = page.getByRole('heading', { name: '테마 추가', level: 2 });
    await expect(section).toBeFocused();
    await expect(section).toBeInViewport();
    await expect(toc).toBeInViewport();
  });

  test('주소의 앵커로 열면 불러온 뒤 그 절로 간다', async ({ page }) => {
    await page.goto(`${DOCUMENT}#테마-추가`);
    const section = page.getByRole('heading', { name: '테마 추가', level: 2 });
    await expect(section).toBeFocused();
    await expect(section).toBeInViewport();
  });
});

test.describe('좁은 화면의 "이 페이지에서"', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('본문 위에 접혀 있고 펼쳐서 절로 간다', async ({ page }) => {
    await page.goto(DOCUMENT);
    const summary = page.locator('summary').filter({ hasText: '이 페이지에서' });
    const toc = page.getByRole('navigation', { name: '이 페이지에서' });
    await expect(summary).toBeVisible();
    await expect(toc).toBeHidden();

    await enterMain(page);
    await tabTo(page, summary);
    await page.keyboard.press('Enter');
    await expect(toc).toBeVisible();

    const first = toc.getByRole('link').first();
    const id = decodeURIComponent(((await first.getAttribute('href')) ?? '').slice(1));
    await page.keyboard.press('Tab');
    await expect(first).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator(`[id="${id}"]`)).toBeFocused();
    await expect(page.locator(`[id="${id}"]`)).toBeInViewport();
  });
});
