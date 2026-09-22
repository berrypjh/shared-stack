import { expect, test } from '@playwright/test';

import { enterMain, tabTo } from './support/keyboard';

const JOURNEY = { id: 'token-pipeline', title: '토큰 소스 → 웹 · RN 산출물' };

test.use({ viewport: { width: 1280, height: 800 } });

test.describe('아키텍처', () => {
  test('그림에서 노드를 고르면 주소 · 현재 표시 · 상세 정보가 바뀌고 포커스는 남는다', async ({
    page,
  }) => {
    await page.goto('/architecture');
    const nodes = page
      .getByRole('group', { name: '아키텍처 그림' })
      .getByRole('list', { name: '구성 요소' });
    const node = nodes.locator('a[href="/architecture/ui-core"]');

    await enterMain(page);
    await tabTo(page, node);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/architecture/ui-core');
    await expect(node).toHaveAttribute('aria-current', 'page');
    await expect(node).toBeFocused();
    const inspector = page.getByRole('complementary', { name: '상세 정보' });
    await expect(inspector.getByRole('heading', { level: 2 })).toHaveText('ui-core');
    await expect(page.getByRole('link', { name: '이 구성 요소의 상세 정보로 이동' })).toHaveCount(
      1,
    );
  });

  test('목록 보기에서 골라도 목록 · 포커스가 남는다', async ({ page }) => {
    await page.goto('/architecture');
    await page.getByRole('button', { name: '목록' }).click();
    const outline = page
      .getByRole('region', { name: '구성 요소와 관계' })
      .getByRole('list', { name: '구성 요소' });
    const heading = outline
      .getByRole('heading', { name: 'react-ui', exact: true })
      .getByRole('link');

    await heading.click();
    await expect(page).toHaveURL('/architecture/react-ui');
    await expect(heading).toHaveAttribute('aria-current', 'page');
    await expect(heading).toBeFocused();
    await expect(page.getByRole('button', { name: '목록' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});

test.describe('소비 흐름', () => {
  test('단계를 고르면 주소와 단계 상세가 바뀌고 포커스는 그 단계에 남는다', async ({ page }) => {
    await page.goto(`/journeys/${JOURNEY.id}`);
    const steps = page
      .getByRole('group', { name: `${JOURNEY.title} 흐름 그림` })
      .getByRole('list', { name: '단계' });
    const facade = steps.locator(`a[href="/journeys/${JOURNEY.id}/steps/facade"]`);
    await expect(facade).toContainText('3. 두 렌더러가 쓸 토큰을 한 곳에서 넘긴다');

    await enterMain(page);
    await tabTo(page, facade);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(`/journeys/${JOURNEY.id}/steps/facade`);
    await expect(facade).toHaveAttribute('aria-current', 'page');
    await expect(facade).toBeFocused();
    const inspector = page.getByRole('complementary', { name: '상세 정보' });
    await expect(inspector.getByRole('heading', { level: 2 })).toHaveText(
      '두 렌더러가 쓸 토큰을 한 곳에서 넘긴다',
    );

    await inspector.getByRole('link', { name: /^다음 단계: / }).click();
    await expect(page).toHaveURL(`/journeys/${JOURNEY.id}/steps/web#devhub-inspector`);
    await expect(inspector).toBeFocused();
  });
});

test.describe('크게 보기', () => {
  test('창 크기의 대화상자로 열고, Escape · 닫기로 닫으면 버튼으로 포커스가 돌아온다', async ({
    page,
  }) => {
    await page.goto('/architecture');
    const inPage = await page.getByRole('group', { name: '아키텍처 그림' }).boundingBox();
    const expand = page.getByRole('button', { name: '크게 보기' });
    const dialog = page.getByRole('dialog', { name: '아키텍처 그림 — 크게 보기' });

    await enterMain(page);
    await tabTo(page, expand);
    await page.keyboard.press('Enter');
    await expect(dialog).toBeVisible();
    const enlarged = await dialog.getByRole('group', { name: '아키텍처 그림' }).boundingBox();
    expect(enlarged?.height ?? 0).toBeGreaterThan(inPage?.height ?? Infinity);

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(expand).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: '닫기' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(expand).toBeFocused();
  });
});
