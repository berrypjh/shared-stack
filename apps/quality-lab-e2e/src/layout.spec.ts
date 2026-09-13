import { expect, test } from '@playwright/test';

import { COMPARE_RUNS, publicFiles, serveObservability } from './fixtures';

test.describe('좁은 폭', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('메뉴 disclosure 가 같은 nav 를 열고, Escape 로 닫으면 메뉴 버튼으로 포커스가 돌아온다', async ({
    page,
  }) => {
    await serveObservability(page, publicFiles(COMPARE_RUNS));
    await page.goto('/runs?run=run-current');

    const toggle = page.getByRole('button', { name: '메뉴' });
    const nav = page.getByRole('navigation', { name: '주요 메뉴' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(nav).toBeHidden();

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(nav).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(nav).toBeHidden();
    await expect(toggle).toBeFocused();
  });

  test('본문은 가로로 넘치지 않고 넓은 표는 이름 있는 스크롤 영역 안에 있다', async ({ page }) => {
    await serveObservability(page, publicFiles(COMPARE_RUNS));
    await page.goto('/runs?run=run-current&base=run-base');

    const scroll = page.getByRole('region', { name: '변화 — run-current 대 run-base 표' });
    await expect(scroll).toBeVisible();
    await expect(scroll).toHaveAttribute('tabindex', '0');

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test('본문으로 건너뛰기는 main 으로 포커스를 옮긴다', async ({ page }) => {
  await serveObservability(page, publicFiles(COMPARE_RUNS));
  await page.goto('/runs?run=run-current');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: '본문으로 건너뛰기' });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
});
