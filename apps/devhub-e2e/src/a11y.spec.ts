import { expect, type Page, test } from '@playwright/test';
import { configureAxe, getAxeResults, injectAxe } from 'axe-playwright';

import { COMPARE_RUNS, publicFiles, serveObservability } from './support/observability';

/**
 * 화면의 자동 접근성 검사. 평가 화면은 `support/observability.ts` 의 fixture 를 `page.route` 로 주입한
 * 실행으로 그린 뒤 잰다 — `public/observability` 의 실측 실행에 기대지 않는다.
 * 기준은 Storybook test-runner(`libs/react-ui/.storybook/test-runner.ts`)와 같은 WCAG 2.0 · 2.1 · 2.2 A+AA 태그다.
 */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const SCREENS = [
  '/',
  '/architecture',
  '/architecture/react-ui',
  '/journeys/component-export',
  '/packages/react-ui',
  '/plugins/berry-commit',
  '/plugins/berry-dev',
  '/documents/root-agents',
  '/records/devhub-editorial-theme-pair',
  '/evaluation',
  '/evaluation/bundles',
  '/evaluation/ai',
];

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
] as const;

/** 본문 제목과 테마가 선 뒤, 불러오는 중인 영역이 없을 때 잰다. */
const ready = async (page: Page, theme: string) => {
  await page.getByRole('main').getByRole('heading', { level: 1 }).waitFor();
  await page.locator(`html[data-theme="${theme}"]`).waitFor({ state: 'attached' });
  await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'));
};

for (const theme of ['light', 'dark'] as const) {
  test.describe(`접근성 — ${theme}`, () => {
    test.use({ colorScheme: theme, contextOptions: { reducedMotion: 'reduce' } });
    test.beforeEach(async ({ page }) => {
      await serveObservability(page, publicFiles(COMPARE_RUNS));
    });

    for (const viewport of VIEWPORTS) {
      for (const path of SCREENS) {
        test(`${viewport.name} ${path} 에 WCAG A · AA 위반이 없다`, async ({ page }) => {
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          await page.goto(path);
          await ready(page, theme);
          await injectAxe(page);
          await configureAxe(page, { rules: [{ id: 'color-contrast', enabled: true }] });
          const { violations } = await getAxeResults(page, undefined, {
            runOnly: { type: 'tag', values: WCAG_TAGS },
          });
          // 실패하면 규칙 · 대상 요소 · 이유가 한눈에 보이게 줄인다.
          expect(
            violations.flatMap((v) =>
              v.nodes.map((node) => `${v.id} ${node.target.join(' ')} — ${node.failureSummary}`),
            ),
          ).toEqual([]);
        });
      }
    }
  });
}
