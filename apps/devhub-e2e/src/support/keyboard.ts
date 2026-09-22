import { expect, type Locator, type Page } from '@playwright/test';

/**
 * `target` 에 포커스가 갈 때까지 Tab 을 누른다. `limit` 번 안에 닿지 않으면 실패한다.
 * `locator.focus()` 와 달리 키보드로 문서 순서대로 닿는다는 것을 보인다.
 */
export const tabTo = async (page: Page, target: Locator, limit = 60) => {
  for (let press = 0; press < limit; press += 1) {
    await page.keyboard.press('Tab');
    if (await target.evaluate((element) => element === document.activeElement)) return;
  }
  await expect(target, `${limit} 번 Tab 안에 닿지 않았다`).toBeFocused();
};

/** 키보드 사용자처럼 "본문으로 건너뛰기"로 본문에 들어간다. 다음 Tab 은 본문 안이다. */
export const enterMain = async (page: Page) => {
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: '본문으로 건너뛰기' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
};

/** 문서가 가로로 넘치는 픽셀. 0 이하여야 한다. */
export const horizontalOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

/** 이동 뒤 포커스 자리(문서 맨 앞)에 있는지. 다음 Tab 이 "본문으로 건너뛰기"다. */
export const focusIsAtStart = (page: Page) =>
  page.evaluate(() => document.activeElement?.hasAttribute('data-focus-start') ?? false);
