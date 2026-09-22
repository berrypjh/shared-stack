import { expect, type Page, test } from '@playwright/test';

import { horizontalOverflow, tabTo } from './support/keyboard';

const PAGES = [
  '/',
  '/journeys/token-pipeline/steps/facade',
  '/architecture/react-ui',
  '/packages/react-ui',
  '/engineering',
  '/documents/root-readme',
  '/records/react-ui-cascade-layers',
  '/sources/libs/design-tokens/src/lib/pipeline.ts',
];

for (const width of [320, 390]) {
  test.describe(`${width}px`, () => {
    test.use({ viewport: { width, height: 844 } });

    test('어느 화면도 가로로 넘치지 않는다', async ({ page }) => {
      for (const path of PAGES) {
        await page.goto(path);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        expect(await horizontalOverflow(page), path).toBeLessThanOrEqual(0);
      }
    });
  });
}

const drawer = (page: Page) => ({
  toggle: page.getByRole('button', { name: '탐색기', exact: true }),
  items: page.getByRole('navigation', { name: '저장소 항목' }),
  pane: page.getByRole('complementary', { name: '탐색기' }),
});

/** 서랍 계약: 열면 현재 항목으로 포커스, Escape · 닫기 · 바깥 누르기는 닫고 버튼으로 돌아간다. */
const drawerContract = async (page: Page) => {
  await page.goto('/packages/react-ui');
  const { toggle, items, pane } = drawer(page);
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(items).toBeHidden();

  await tabTo(page, toggle);
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(items).toBeInViewport();
  await expect(pane.getByRole('link', { name: 'react-ui', exact: true })).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(items).toBeHidden();
  await expect(toggle).toBeFocused();

  await toggle.click();
  await pane.getByRole('button', { name: '탐색기 닫기' }).click();
  await expect(items).toBeHidden();
  await expect(toggle).toBeFocused();

  await toggle.click();
  // 서랍(최대 20rem) 밖 — 오른쪽 가장자리를 누른다.
  const viewport = page.viewportSize() ?? { width: 390, height: 844 };
  await page.mouse.click(viewport.width - 8, viewport.height / 2);
  await expect(items).toBeHidden();

  await toggle.click();
  await pane.getByRole('link', { name: 'ui-core', exact: true }).click();
  await expect(page).toHaveURL('/packages/ui-core');
  await expect(items).toBeHidden();
};

test.describe('좁은 화면의 탐색기 서랍', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('작업 영역이 첫 화면에 오고 탐색기는 접혀 있다', async ({ page }) => {
    await page.goto('/packages/react-ui');
    await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
    await expect(drawer(page).items).toBeHidden();
  });

  test('열기 · Escape · 닫기 버튼 · 바깥 누르기 · 항목 고르기', async ({ page }) => {
    await drawerContract(page);
  });

  test('움직임 줄이기 설정에서도 같은 계약이고 전환 효과가 없다', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/packages/react-ui');
    const transition = await drawer(page).pane.evaluate(
      (pane) => getComputedStyle(pane).transitionProperty,
    );
    expect(transition).toBe('none');
    await drawerContract(page);
  });

  test('기본 설정에서는 서랍이 전환 효과로 들어온다', async ({ page }) => {
    await page.goto('/packages/react-ui');
    const transition = await drawer(page).pane.evaluate(
      (pane) => getComputedStyle(pane).transitionProperty,
    );
    expect(transition).not.toBe('none');
  });
});
