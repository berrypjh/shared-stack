import { expect, type Page, test } from '@playwright/test';

const searchBox = (page: Page) => page.getByRole('combobox', { name: '저장소 검색' });

test.describe('전역 검색', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('페이지 어디서든 ⌘K / Ctrl+K 로 검색 칸에 간다', async ({ page }) => {
    await page.goto('/architecture');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: '본문으로 건너뛰기' })).toBeFocused();

    // Playwright 의 ControlOrMeta 는 macOS 에서 ⌘, 그 밖에서 Ctrl 이다 — 앱의 규칙과 같다.
    await page.keyboard.press('ControlOrMeta+k');
    await expect(searchBox(page)).toBeFocused();
  });

  test('결과 수를 알리고 결과 종류를 글자로 보인다', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('ControlOrMeta+k');
    await page.keyboard.type('react-ui');

    await expect(page.getByRole('listbox')).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: /^결과 \d+개/ })).toHaveCount(1);
    const first = page.getByRole('option').first();
    await expect(first).toContainText('react-ui');
    await expect(first).toContainText('패키지 ·');
  });

  test('화살표로 옮기고 Enter 로 연다 — 다음 Tab 은 새 화면의 맨 앞이다', async ({ page }) => {
    await page.goto('/');
    const search = searchBox(page);
    await page.keyboard.press('ControlOrMeta+k');
    await page.keyboard.type('react-ui');

    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('option').first()).toHaveAttribute('aria-selected', 'true');
    await expect(search).toHaveAttribute('aria-activedescendant', /.+/);
    await expect(search).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/packages/react-ui');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('react-ui');
    await expect(search).toHaveValue('');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: '본문으로 건너뛰기' })).toBeFocused();
  });

  test('해시가 있는 결과는 그 자리로 간다', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('ControlOrMeta+k');
    await page.keyboard.type('buildTokenOutputs');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(
      /\/sources\/libs\/design-tokens\/src\/lib\/pipeline\.ts#symbol-buildTokenOutputs$/,
    );
    await expect(page.locator('[id="symbol-buildTokenOutputs"]')).toBeFocused();
  });

  test('Escape 는 목록을 닫고 포커스와 글자를 남긴다', async ({ page }) => {
    await page.goto('/');
    const search = searchBox(page);
    await page.keyboard.press('ControlOrMeta+k');
    await page.keyboard.type('size');
    await expect(page.getByRole('listbox')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await expect(search).toBeFocused();
    await expect(search).toHaveValue('size');
    await expect(search).toHaveAttribute('aria-expanded', 'false');
  });

  test('맞는 것이 없으면 live region 이 말한다', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('ControlOrMeta+k');
    await page.keyboard.type('zzzz-no-such-thing');
    await expect(
      page.getByRole('status').filter({ hasText: '일치하는 항목이 없습니다' }),
    ).toHaveCount(1);
    await expect(page.getByRole('option')).toHaveCount(0);
  });
});

test.describe('좁은 화면의 검색', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('상단 바 버튼이 검색 칸을 열고, 빈 칸의 Escape 가 접고 버튼으로 돌아간다', async ({
    page,
  }) => {
    await page.goto('/');
    const button = page.getByRole('button', { name: '검색', exact: true });
    await expect(searchBox(page)).toBeHidden();

    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(searchBox(page)).toBeFocused();
    await expect(searchBox(page)).toBeInViewport();

    await page.keyboard.press('Escape');
    await expect(searchBox(page)).toBeHidden();
    await expect(button).toBeFocused();

    await page.keyboard.press('ControlOrMeta+k');
    await expect(searchBox(page)).toBeFocused();
  });
});
