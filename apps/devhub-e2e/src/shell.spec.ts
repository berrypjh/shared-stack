import { expect, test } from '@playwright/test';

import { focusIsAtStart, tabTo } from './support/keyboard';

const skipToMain = { name: '본문으로 건너뛰기' } as const;

test.describe('데스크톱 셸', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('탐색기 · 작업 영역 · 상세 정보가 한 줄에 왼쪽부터 놓인다', async ({ page }) => {
    await page.goto('/packages/react-ui');
    await expect(page.getByRole('banner')).toHaveCount(1);
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(page.getByRole('navigation', { name: '보기' })).toBeVisible();

    const panes = [
      page.getByRole('complementary', { name: '탐색기' }),
      page.getByRole('main'),
      page.getByRole('complementary', { name: '상세 정보' }),
    ];
    const boxes = [];
    for (const pane of panes) {
      await expect(pane).toBeVisible();
      boxes.push(await pane.boundingBox());
    }
    const [explorer, main, inspector] = boxes.map((box) => box ?? { x: 0, y: 0, width: 0 });
    expect(explorer.x + explorer.width).toBeLessThanOrEqual(main.x + 1);
    expect(main.x + main.width).toBeLessThanOrEqual(inspector.x + 1);
    expect(Math.abs(explorer.y - inspector.y)).toBeLessThanOrEqual(1);
  });

  test('첫 Tab 은 본문으로 건너뛰기, 둘째는 상세 정보로 건너뛰기다', async ({ page }) => {
    await page.goto('/packages/react-ui');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', skipToMain)).toBeFocused();
    await expect(page.getByRole('link', skipToMain)).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();

    await page.goto('/packages/react-ui');
    await tabTo(page, page.getByRole('link', { name: '상세 정보로 건너뛰기' }), 2);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('complementary', { name: '상세 정보' })).toBeFocused();
  });

  test('보기를 옮기면 문서 맨 앞으로 돌아가고 다음 Tab 이 본문으로 건너뛰기다', async ({
    page,
  }) => {
    await page.goto('/');
    const engineering = page
      .getByRole('navigation', { name: '보기' })
      .getByRole('link', { name: '엔지니어링', exact: true });
    await tabTo(page, engineering);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/engineering');
    await expect(engineering).toHaveAttribute('aria-current', 'page');
    expect(await focusIsAtStart(page)).toBe(true);

    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', skipToMain)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
  });

  test('마우스로 보기를 옮겨도 건너뛰기 링크가 드러나지 않는다', async ({ page }) => {
    await page.goto('/');
    const skip = page.getByRole('link', skipToMain);
    for (const view of ['소비 흐름', '아키텍처', '문서', '개요']) {
      const link = page
        .getByRole('navigation', { name: '보기' })
        .getByRole('link', { name: view, exact: true });
      await link.click();
      await expect(link).toHaveAttribute('aria-current', 'page');
      await expect(skip).not.toBeFocused();
    }
  });
});

test.describe('상세 정보 딥링크', () => {
  test('해시가 가리키는 상세 정보 섹션에 포커스가 가고 보인다', async ({ page }) => {
    await page.goto('/packages/react-ui#inspector-exports');
    const exports = page.locator('[id="inspector-exports"]');
    await expect(exports).toBeFocused();
    await expect(exports).toBeInViewport();
    const inspector = page.getByRole('complementary', { name: '상세 정보' });
    expect(await inspector.evaluate((pane) => pane.contains(document.activeElement))).toBe(true);
  });

  test('상세 정보의 관계 링크는 다음 항목의 상세 정보에 머문다', async ({ page }) => {
    await page.goto('/packages/react-ui');
    const inspector = page.getByRole('complementary', { name: '상세 정보' });
    await inspector
      .getByRole('navigation', { name: '패키지 이동' })
      .getByRole('link')
      .first()
      .click();
    await expect(page).toHaveURL(/#devhub-inspector$/);
    await expect(inspector).toBeFocused();
  });

  test('명령 카드 해시는 본문의 그 카드로 간다', async ({ page }) => {
    await page.goto('/engineering#command-script:size');
    const card = page.locator('[id="command-script:size"]');
    await expect(card).toBeFocused();
    await expect(card).toBeInViewport();
  });
});

test.describe('없는 주소', () => {
  test('없는 화면과 카탈로그에 없는 항목 · 단계를 구분한다', async ({ page }) => {
    const h1 = page.getByRole('heading', { level: 1 });

    await page.goto('/no-such-screen');
    await expect(h1).toHaveText('없는 화면');
    await expect(page.getByRole('link', { name: '개요로 가기' })).toBeVisible();

    await page.goto('/packages/no-such-package');
    await expect(h1).toHaveText('카탈로그에 없는 항목');
    await expect(page.getByRole('link', { name: '패키지 목록으로 가기' })).toHaveAttribute(
      'href',
      '/packages',
    );

    await page.goto('/journeys/token-pipeline/steps/no-such-step');
    await expect(h1).toHaveText('카탈로그에 없는 항목');
  });
});
