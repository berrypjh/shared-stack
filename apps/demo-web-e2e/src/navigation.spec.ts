import { expect, type Page, test } from '@playwright/test';

const sidebarTargets = async (page: Page) => {
  const links = await page.getByRole('navigation', { name: '주요 메뉴' }).getByRole('link').all();

  return Promise.all(
    links.map(async (link) => ({
      label: (await link.innerText()).trim(),
      href: await link.getAttribute('href'),
    })),
  );
};

test.describe('네비게이션', () => {
  test('개요가 첫 화면이다', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('overview-page')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: '개요' })).toBeVisible();
  });

  test('사이드바의 모든 항목으로 이동한다', async ({ page }) => {
    await page.goto('/');
    const targets = await sidebarTargets(page);

    // 수집이 조용히 비면 아래 반복이 아무것도 확인하지 않고 통과한다.
    expect(targets.length).toBeGreaterThan(5);

    for (const { label, href } of targets) {
      await page.goto('/');
      await page.getByRole('link', { name: label, exact: true }).click();
      await expect(page).toHaveURL(href ?? '');
      // 사이드바 라벨과 도착한 화면의 제목은 같은 문장이다.
      await expect(page.getByRole('heading', { level: 1, name: label })).toBeVisible();
    }
  });

  test('현재 위치를 표시한다', async ({ page }) => {
    await page.goto('/tokens');
    await expect(page.getByRole('link', { name: 'Tokens', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});
