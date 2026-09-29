import { expect, type Page, test } from '@playwright/test';

const searchBox = (page: Page) => page.getByRole('combobox', { name: '저장소 검색' });

/**
 * 앱이 검색 칸에 알리는 단축키(`aria-keyshortcuts` — `Meta+K` 또는 `Control+K`). 앱은 user agent 로 macOS 를
 * 가리는데 e2e 기기(Desktop Chrome)는 Windows UA 라, 호스트 OS 를 따르는 `ControlOrMeta` 와 다를 수 있다.
 * 알린 단축키를 그대로 누르면 "알린 키가 실제로 동작한다"까지 확인한다.
 */
const shortcutOf = async (page: Page) =>
  ((await searchBox(page).getAttribute('aria-keyshortcuts')) ?? '').replace(/K$/, 'k');

/**
 * 알린 단축키로 검색 칸에 간다. 단축키는 앱이 그린 뒤 effect 에서 붙어, 그 전에 누른 키는 버려진다 —
 * 붙을 때까지 다시 누른다. 단축키가 끝내 검색 칸으로 옮기지 못하면 실패한다.
 */
const focusSearch = async (page: Page) => {
  const shortcut = await shortcutOf(page);
  expect(shortcut).toMatch(/^(Meta|Control)\+k$/);
  await expect(async () => {
    await page.keyboard.press(shortcut);
    await expect(searchBox(page)).toBeFocused({ timeout: 500 });
  }).toPass();
};

test.describe('전역 검색', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('페이지 어디서든 ⌘K / Ctrl+K 로 검색 칸에 간다', async ({ page }) => {
    await page.goto('/architecture');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: '본문으로 건너뛰기' })).toBeFocused();

    await focusSearch(page);
    await expect(searchBox(page)).toBeFocused();
  });

  test('결과 수를 알리고 결과 종류를 글자로 보인다', async ({ page }) => {
    await page.goto('/');
    await focusSearch(page);
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
    await focusSearch(page);
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
    await focusSearch(page);
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
    await focusSearch(page);
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
    await focusSearch(page);
    await page.keyboard.type('zzzz-no-such-thing');
    // SearchField 의 빈 상태도 role=status 지만 글은 aria-hidden 이다. DOM 글자(`hasText`)가 아니라
    // 접근성 트리로 세어, 보조 기술에 정확히 한 번 알려지는지 본다.
    await expect
      .poll(async () => {
        const tree = await page.getByRole('banner').ariaSnapshot();
        return tree.match(/status: 일치하는 항목이 없습니다/g)?.length ?? 0;
      })
      .toBe(1);
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

    const shortcut = await shortcutOf(page);
    await page.keyboard.press('Escape');
    await expect(searchBox(page)).toBeHidden();
    await expect(button).toBeFocused();

    await page.keyboard.press(shortcut);
    await expect(searchBox(page)).toBeFocused();
  });
});
