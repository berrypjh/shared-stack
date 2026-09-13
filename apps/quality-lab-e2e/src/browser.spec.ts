import { expect, test } from '@playwright/test';

/** 브라우저 세션 화면은 artifact 를 읽지 않는다. 지금 이 탭의 API 만 읽는다. */
test.describe('브라우저 세션', () => {
  test('지원하지 않는 API 는 값을 만들지 않고 지원 안 함과 이유로 보인다', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(Navigator.prototype, 'storage', {
        configurable: true,
        get: () => undefined,
      });
    });
    await page.goto('/browser?panel=capabilities');

    const row = page
      .getByRole('table', { name: 'Capabilities' })
      .getByRole('row')
      .filter({ has: page.getByRole('rowheader', { name: /사용량 추정 \(storage\.estimate\)/ }) });
    await expect(row).toContainText('지원 안 함');
    await expect(row).toContainText('값 없음');
  });

  test('지원 상태 필터는 키보드로 바꾸고 주소에 남으며 뒤로 가면 되돌아온다', async ({ page }) => {
    await page.goto('/browser?panel=capabilities');
    const group = page.getByRole('group', { name: '지원 상태' });
    const unsupported = group.getByRole('button', { name: '지원 안 함', exact: true });

    await unsupported.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/browser\?panel=capabilities&status=unsupported$/);
    await expect(unsupported).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('status').filter({ hasText: /필터와 일치/ })).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/\/browser\?panel=capabilities$/);
    await expect(group.getByRole('button', { name: '전체', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
