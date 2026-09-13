import { expect, type Page, test } from '@playwright/test';

/**
 * Designer Workspace — 컴포넌트 문맥 · 테마 · 폭별 접근.
 *
 * 목적지 목록을 여기 적지 않는다. **렌더된 사이드바 링크**에서 읽는다 — 경로를 손으로 적으면
 * `demo-web` 에 컴포넌트가 늘 때 이 테스트만 조용히 낡는다.
 *
 * 픽셀을 단언하지 않는다. 색·간격은 보지 않고 동작과 가시성까지만 본다.
 */

/** Inspector 가 Canvas 옆에 펼쳐지는 폭과 sheet 로 접히는 폭. 컴포넌트가 쓰는 값과 같다. */
const WIDE = { width: 1440, height: 900 };
const TABLET = { width: 900, height: 900 };
const MOBILE = { width: 390, height: 844 };

/** 이 앱의 유일한 내비게이션. Designer 에도 두 번째 목록을 두지 않는다. */
const nav = (page: Page) => page.getByRole('navigation', { name: '주요 메뉴' });

/** 컴포넌트 목적지는 렌더된 사이드바에서 읽는다 — 경로를 손으로 적지 않는다. */
const componentTargets = async (page: Page) => {
  const links = await nav(page).getByRole('link').all();
  const targets = await Promise.all(
    links.map(async (link) => ({
      label: (await link.innerText()).trim(),
      href: await link.getAttribute('href'),
    })),
  );
  return targets.filter((t) => (t.href ?? '').startsWith('/components/'));
};

test.describe('Designer 컴포넌트 문맥', () => {
  test.use({ viewport: WIDE });

  test('사이드바의 모든 컴포넌트로 이동하며 view=designer 를 유지한다', async ({ page }) => {
    await page.goto('/components/button?view=designer');
    const targets = await componentTargets(page);

    // 수집이 조용히 비면 아래 반복이 아무것도 확인하지 않고 통과한다.
    expect(targets.length).toBeGreaterThan(5);

    for (const { label, href } of targets) {
      await nav(page).getByRole('link', { name: label, exact: true }).click();
      await expect(page).toHaveURL(href ?? '');
      expect(href).toContain('view=designer');
      // 도착한 화면의 제목이 그 컴포넌트를 말한다.
      await expect(page.getByRole('heading', { level: 1 })).toContainText(label);
      await expect(page.getByTestId('designer-canvas')).toBeVisible();
    }
  });

  test('Designer 에서 고른 컴포넌트가 Developer 로 돌아가도 유지된다', async ({ page }) => {
    await page.goto('/components/button?view=designer');
    const targets = await componentTargets(page);
    const last = targets[targets.length - 1];
    expect(last).toBeDefined();

    await nav(page).getByRole('link', { name: last.label, exact: true }).click();
    const designerUrl = new URL(page.url());

    await page
      .getByRole('group', { name: 'View' })
      .getByRole('button', { name: 'Developer' })
      .click();

    // pathname 은 그대로, view 만 사라진다.
    await expect(page).toHaveURL(designerUrl.pathname);
    await expect(page.getByRole('heading', { level: 1, name: last.label })).toBeVisible();
  });

  test('현재 컴포넌트를 사이드바가 표시한다 — 표시는 한 곳뿐이다', async ({ page }) => {
    await page.goto('/components/divider?view=designer');
    await expect(nav(page).getByRole('link', { name: 'Divider', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );
    // 내비게이션이 하나이므로 현재 위치 표시도 하나다.
    await expect(page.locator('a[aria-current="page"]')).toHaveCount(1);
  });

  test('사이드바 · Canvas · Inspector 가 함께 보인다', async ({ page }) => {
    await page.goto('/components/button?view=designer');
    await expect(page.getByTestId('designer-wide')).toBeVisible();
    await expect(nav(page)).toBeVisible();
    await expect(page.getByTestId('designer-canvas')).toBeVisible();
    await expect(page.getByTestId('token-inspector')).toBeVisible();
    await expect(page.getByTestId('properties-inspector')).toBeVisible();
    // Designer 가 두 번째 내비게이션을 만들지 않는다.
    await expect(page.getByRole('navigation')).toHaveCount(1);
  });

  test('컴포넌트 검색이 사이드바 상단에 있다', async ({ page }) => {
    await page.goto('/components/button?view=designer');
    const search = nav(page).getByRole('searchbox', { name: '컴포넌트 검색' });
    await expect(search).toBeVisible();

    await search.fill('divi');
    await expect(nav(page).getByRole('link', { name: 'Divider', exact: true })).toBeVisible();
    await expect(nav(page).getByRole('link', { name: 'Button', exact: true })).toHaveCount(0);
    // 컴포넌트 검색이 다른 화면으로 가는 길을 지우지 않는다.
    await expect(nav(page).getByRole('link', { name: 'Tokens', exact: true })).toBeVisible();

    await nav(page).getByRole('link', { name: 'Divider', exact: true }).click();
    await expect(page).toHaveURL('/components/divider?view=designer');
  });
});

test.describe('Designer 테마 동기화', () => {
  test.use({ viewport: WIDE });

  /** 픽셀 색을 보지 않는다 — theme scope 속성과 Inspector 가 읽는 theme 문맥을 본다. */
  test('보이는 테마 컨트롤로 바꾸면 Canvas scope 와 Inspector 문맥이 함께 움직인다', async ({
    page,
  }) => {
    await page.goto('/components/button?view=designer');

    const root = page.getByTestId('theme-root');
    await expect(root).toHaveAttribute('data-theme', 'light');
    // Canvas 는 theme scope 안에 있다.
    await expect(root.getByTestId('designer-canvas')).toBeVisible();

    const inspector = page.getByTestId('token-inspector');
    await expect(inspector).toContainText('light');
    const lightValue = await inspector.innerText();

    await page.getByTestId('theme-select').selectOption('dark');

    await expect(root).toHaveAttribute('data-theme', 'dark');
    await expect(inspector).toContainText('dark');
    // token identity 는 그대로이고 해석된 값이 달라진다.
    await expect(inspector).toContainText('color.primaryBtn.default');
    await expect(inspector).toContainText('--ds-primary-btn-default');
    // 값이 실제로 달라졌다. 어떤 색인지는 단언하지 않는다 — 픽셀·색을 보는 자리가 아니다.
    await expect(inspector).not.toHaveText(lightValue);
  });
});

test.describe('Designer 좁은 화면 접근', () => {
  for (const [name, viewport] of [
    ['tablet', TABLET],
    ['mobile', MOBILE],
  ] as const) {
    test(`${name}: Canvas 가 보이고 Inspector 는 trigger 로 연다`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/components/button?view=designer');

      // 데스크톱 세 열을 줄여 넣지 않는다.
      await expect(page.getByTestId('designer-compact')).toBeVisible();
      await expect(page.getByTestId('designer-wide')).toHaveCount(0);

      // 현재 컴포넌트 identity 와 Canvas 는 계속 보인다.
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Button');
      await expect(page.getByTestId('designer-canvas')).toBeVisible();

      // Inspector 내용이 Canvas 아래에 항상 펼쳐져 있지 않다.
      await expect(page.getByTestId('token-inspector')).toHaveCount(0);
      // Designer 전용 컴포넌트 목록을 만들지 않는다.
      await expect(page.getByTestId('library-sheet-trigger')).toHaveCount(0);

      const inspectorTrigger = page.getByTestId('inspector-sheet-trigger');
      await expect(inspectorTrigger).toBeVisible();
      await expect(inspectorTrigger).toHaveAttribute('aria-expanded', 'false');

      await inspectorTrigger.click();
      const inspectorPanel = page.getByRole('dialog', { name: 'Inspector' });
      await expect(inspectorPanel).toBeVisible();
      await expect(inspectorTrigger).toHaveAttribute('aria-expanded', 'true');
      await expect(inspectorPanel.getByTestId('token-inspector')).toBeVisible();

      // 열면 포커스가 패널 안으로 들어간다.
      await expect(inspectorPanel.locator(':focus')).toHaveCount(1);

      // Escape 로 닫고 포커스가 trigger 로 돌아온다.
      await page.keyboard.press('Escape');
      await expect(inspectorPanel).toHaveCount(0);
      await expect(inspectorTrigger).toBeFocused();

      // 닫기 버튼으로도 같다.
      await inspectorTrigger.click();
      await page.getByRole('button', { name: 'Inspector 닫기' }).click();
      await expect(page.getByRole('dialog', { name: 'Inspector' })).toHaveCount(0);
      await expect(inspectorTrigger).toBeFocused();
    });

    test(`${name}: 전역 드로어에서 검색해 컴포넌트를 바꾼다`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/components/button?view=designer');

      await page.getByTestId('open-menu').click();
      const drawer = page.getByTestId('menu-drawer');
      await expect(drawer).toBeVisible();

      // 검색은 드로어 안 사이드바 상단에도 그대로 있다.
      await drawer.getByRole('searchbox', { name: '컴포넌트 검색' }).fill('divi');
      const target = drawer.getByRole('link', { name: 'Divider', exact: true });
      const href = await target.getAttribute('href');

      await target.click();
      await expect(page).toHaveURL(href ?? '');
      expect(href).toContain('view=designer');
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Divider');
      // 이동하면 드로어는 닫힌다.
      await expect(drawer).toHaveCount(0);
    });

    test(`${name}: 전역 AppShell 메뉴도 그대로 쓸 수 있다`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/components/button?view=designer');

      const menuButton = page.getByTestId('open-menu');
      await expect(menuButton).toBeVisible();
      await menuButton.click();
      await expect(page.getByTestId('menu-drawer')).toBeVisible();

      await page.getByRole('button', { name: '메뉴 닫기' }).click();
      await expect(page.getByTestId('menu-drawer')).toHaveCount(0);
    });
  }
});

test.describe('Designer 키보드 전용 workflow', () => {
  test.use({ viewport: WIDE });

  /**
   * 마우스 없이 Developer → Designer → scenario → property → token copy 까지 간다.
   * 어디서 멈추는지가 중요하므로 각 단계에서 무엇에 포커스가 있는지 확인한다.
   */
  test('View 전환 · scenario · property · copy 를 키보드로 수행한다', async ({ page }) => {
    await page.goto('/components/button');

    const designer = page
      .getByRole('group', { name: 'View' })
      .getByRole('button', { name: 'Designer' });
    await designer.focus();
    await expect(designer).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/components/button?view=designer');

    const scenario = page
      .getByRole('group', { name: 'Scenario' })
      .getByRole('button', { name: 'Outlined', exact: true });
    await scenario.focus();
    await page.keyboard.press('Enter');
    await expect(scenario).toHaveAttribute('aria-pressed', 'true');

    const disabled = page
      .getByTestId('properties-inspector')
      .getByRole('checkbox', { name: 'Disabled' });
    await disabled.focus();
    await page.keyboard.press(' ');
    await expect(disabled).toBeChecked();

    const copy = page
      .getByTestId('token-inspector')
      .getByRole('button', { name: /이름 복사$/ })
      .first();
    await copy.focus();
    await expect(copy).toBeFocused();
    await page.keyboard.press('Enter');
    // 복사 결과를 보조 기술에도 알린다.
    const status = page.getByTestId('copy-status');
    await expect(status).toHaveAttribute('aria-live', 'polite');
    await expect(status).toContainText('복사');

    const developer = page
      .getByRole('group', { name: 'View' })
      .getByRole('button', { name: 'Developer' });
    await developer.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/components/button');
  });

  test('SkipLink 가 본문으로 포커스를 옮긴다', async ({ page }) => {
    await page.goto('/components/button?view=designer');
    const skip = page.getByRole('link', { name: '본문으로 건너뛰기' });
    await skip.focus();
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main#main')).toBeFocused();
  });
});

test.describe('Designer 비교 표 시맨틱', () => {
  test.use({ viewport: WIDE });

  test('Variant Matrix 가 표 구조와 키보드 스크롤 영역을 갖는다', async ({ page }) => {
    await page.goto('/components/button?view=designer');

    const region = page.getByRole('region', { name: 'Button variant 비교 표' });
    await expect(region).toBeVisible();
    // 키보드로 스크롤할 수 있어야 한다 (WCAG 2.1.1).
    await expect(region).toHaveAttribute('tabindex', '0');

    const table = page.getByTestId('variant-matrix');
    await expect(table.getByRole('columnheader').first()).toBeVisible();
    await expect(table.getByRole('rowheader').first()).toBeVisible();
    await expect(table.locator('caption')).toHaveCount(1);
  });

  test('State Matrix 는 재현 가능한 상태만 열로 두고 한계를 밝힌다', async ({ page }) => {
    await page.goto('/components/button?view=designer');

    const headers = await page
      .getByTestId('state-matrix')
      .getByRole('columnheader')
      .allInnerTexts();
    expect(headers.length).toBeGreaterThan(1);
    for (const fake of ['hover', 'focus', 'pressed']) {
      expect(headers.join(' ').toLowerCase()).not.toContain(fake);
    }
    await expect(page.getByTestId('interactive-only')).toContainText('hover');
  });

  test('Canvas preview 는 자기 키보드 동작을 잃지 않는다', async ({ page }) => {
    await page.goto('/components/popover?view=designer');

    const trigger = page
      .getByTestId('designer-canvas')
      .getByRole('button', { name: '도움말 열기' });
    await trigger.focus();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await page.keyboard.press('Enter');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});
