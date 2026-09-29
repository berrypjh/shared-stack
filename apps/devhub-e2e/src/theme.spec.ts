import { expect, type Page, test } from '@playwright/test';

import { tabTo } from './support/keyboard';

const html = (page: Page) => page.locator('html');
const option = (page: Page, name: '라이트' | '다크') =>
  page.getByRole('group', { name: '화면 테마' }).getByRole('button', { name, exact: true });
/** 저장되는 것은 토큰 테마 이름이 아니라 모드(`light` · `dark`)다. */
const storedMode = (page: Page) => page.evaluate(() => localStorage.getItem('devhub-theme'));
const colorScheme = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.documentElement).colorScheme);

test.describe('테마', () => {
  test.describe('OS 가 어두운 테마일 때', () => {
    test.use({ colorScheme: 'dark' });

    test('처음부터 다크이고 다크가 눌린 상태다', async ({ page }) => {
      await page.goto('/');
      await expect(html(page)).toHaveAttribute('data-theme', 'dark');
      await expect(option(page, '다크')).toHaveAttribute('aria-pressed', 'true');
      expect(await colorScheme(page)).toBe('dark');
    });
  });

  test.describe('OS 가 밝은 테마일 때', () => {
    test.use({ colorScheme: 'light' });

    test('처음부터 라이트이고 라이트가 눌린 상태다', async ({ page }) => {
      await page.goto('/');
      await expect(html(page)).toHaveAttribute('data-theme', 'light');
      await expect(option(page, '라이트')).toHaveAttribute('aria-pressed', 'true');
      expect(await colorScheme(page)).toBe('light');
    });
  });

  /** 탐색기의 현재 항목과 hover 는 다른 면이어야 한다 — 선택이 hover 와 같아 보이면 위치를 잃는다. */
  test('탐색기의 현재 항목은 hover 와 다른 배경이다', async ({ page }) => {
    for (const scheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto('/');
      const nav = page.getByRole('navigation', { name: '저장소 항목' });
      const current = nav.getByRole('link', { name: '개요', exact: true });
      const other = nav.getByRole('link', { name: '아키텍처', exact: true });
      await expect(current).toHaveAttribute('aria-current', 'page');

      await other.hover();
      const hovered = await other.evaluate((el) => getComputedStyle(el).backgroundColor);
      const selected = await current.evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(hovered).not.toBe('rgba(0, 0, 0, 0)');
      expect(selected).not.toBe(hovered);
    }
  });

  test('키보드로 바꾸고 새로고침해도 남는다', async ({ page }) => {
    await page.goto('/');
    await expect(html(page)).toHaveAttribute('data-theme', 'light');

    await tabTo(page, option(page, '다크'));
    await page.keyboard.press('Enter');
    await expect(html(page)).toHaveAttribute('data-theme', 'dark');
    await expect(option(page, '다크')).toHaveAttribute('aria-pressed', 'true');
    expect(await storedMode(page)).toBe('dark');
    const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

    await page.reload();
    await expect(html(page)).toHaveAttribute('data-theme', 'dark');
    await expect(option(page, '다크')).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
      background,
    );
    expect(await colorScheme(page)).toBe('dark');

    await tabTo(page, option(page, '라이트'));
    await page.keyboard.press('Enter');
    await expect(html(page)).toHaveAttribute('data-theme', 'light');
    await expect(option(page, '라이트')).toHaveAttribute('aria-pressed', 'true');
    expect(await storedMode(page)).toBe('light');
  });
});
