import { expect, type Page, test } from '@playwright/test';

/**
 * View 전환과 URL.
 *
 * URL 이 ViewMode 의 canonical source 라는 주장을 **실제 브라우저 history 위에서** 확인한다.
 * vitest 쪽도 같은 규칙을 보지만, refresh 와 Back/Forward 는 브라우저가 하는 일이다.
 */
const viewSwitch = (page: Page) => page.getByRole('group', { name: 'View' });

const pickView = (page: Page, name: 'Developer' | 'Designer') =>
  viewSwitch(page).getByRole('button', { name, exact: true }).click();

const selectedView = async (page: Page) => {
  const pressed = viewSwitch(page).locator('button[aria-pressed="true"]');
  return (await pressed.getAttribute('aria-label')) ?? (await pressed.innerText()).trim();
};

test.describe('View 전환', () => {
  test('Developer 가 기본이고 URL 에 view 가 없다', async ({ page }) => {
    await page.goto('/components/button');
    expect(await selectedView(page)).toBe('Developer');
    await expect(page).toHaveURL('/components/button');
    await expect(page.getByRole('heading', { level: 1, name: 'Button' })).toBeVisible();
  });

  test('Designer 로 바꾸면 pathname 을 유지하고 view=designer 를 붙인다', async ({ page }) => {
    await page.goto('/components/button');
    await pickView(page, 'Designer');

    await expect(page).toHaveURL('/components/button?view=designer');
    expect(await selectedView(page)).toBe('Designer');
    await expect(page.getByTestId('designer-workspace')).toBeVisible();
  });

  test('Developer 로 돌아오면 view 를 지우고 같은 컴포넌트에 머문다', async ({ page }) => {
    await page.goto('/components/button?view=designer');
    await pickView(page, 'Developer');

    await expect(page).toHaveURL('/components/button');
    await expect(page.getByRole('heading', { level: 1, name: 'Button' })).toBeVisible();
  });

  test('알 수 없는 view 값은 Developer 로 떨어진다', async ({ page }) => {
    await page.goto('/components/button?view=bogus');
    expect(await selectedView(page)).toBe('Developer');
    await expect(page.getByRole('heading', { level: 1, name: 'Button' })).toBeVisible();
  });

  test('Designer URL 을 새로 열어도 그대로 복원된다', async ({ page }) => {
    await page.goto('/components/button?view=designer');
    await expect(page.getByTestId('designer-workspace')).toBeVisible();

    await page.reload();

    await expect(page).toHaveURL('/components/button?view=designer');
    expect(await selectedView(page)).toBe('Designer');
    await expect(page.getByTestId('designer-workspace')).toBeVisible();
  });

  test('Back 과 Forward 가 view 를 되돌린다', async ({ page }) => {
    await page.goto('/components/button');
    await pickView(page, 'Designer');
    await expect(page).toHaveURL('/components/button?view=designer');

    await pickView(page, 'Developer');
    await expect(page).toHaveURL('/components/button');

    await page.goBack();
    await expect(page).toHaveURL('/components/button?view=designer');
    expect(await selectedView(page)).toBe('Designer');
    await expect(page.getByTestId('designer-workspace')).toBeVisible();

    await page.goForward();
    await expect(page).toHaveURL('/components/button');
    expect(await selectedView(page)).toBe('Developer');
    await expect(page.getByRole('heading', { level: 1, name: 'Button' })).toBeVisible();
  });

  test('지원하지 않는 경로는 redirect 하지 않는다', async ({ page }) => {
    await page.goto('/tokens?view=designer');
    await expect(page).toHaveURL('/tokens?view=designer');
    await expect(page.getByTestId('designer-unsupported')).toBeVisible();
    await expect(page.getByTestId('designer-workspace')).toHaveCount(0);
  });
});
