import { expect, type Page, test } from '@playwright/test';

import { tabTo } from './support/keyboard';

const html = (page: Page) => page.locator('html');
const option = (page: Page, name: '라이트' | '다크') =>
  page.getByRole('group', { name: '화면 테마' }).getByRole('button', { name, exact: true });

test.describe('테마', () => {
  test.describe('OS 가 어두운 테마일 때', () => {
    test.use({ colorScheme: 'dark' });

    test('처음부터 다크이고 다크가 눌린 상태다', async ({ page }) => {
      await page.goto('/');
      await expect(html(page)).toHaveAttribute('data-theme', 'dark');
      await expect(option(page, '다크')).toHaveAttribute('aria-pressed', 'true');
    });
  });

  test('키보드로 바꾸고 새로고침해도 남는다', async ({ page }) => {
    await page.goto('/');
    await expect(html(page)).toHaveAttribute('data-theme', 'light');

    await tabTo(page, option(page, '다크'));
    await page.keyboard.press('Enter');
    await expect(html(page)).toHaveAttribute('data-theme', 'dark');
    await expect(option(page, '다크')).toHaveAttribute('aria-pressed', 'true');
    const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

    await page.reload();
    await expect(html(page)).toHaveAttribute('data-theme', 'dark');
    await expect(option(page, '다크')).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
      background,
    );
  });
});
