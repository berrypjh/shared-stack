import { chromium } from '@playwright/test';
import { configureAxe, getAxeResults, injectAxe } from 'axe-playwright';

import { WCAG_TAGS } from './adapters/axe';
import type { AuditBrowser } from './audit';

/**
 * 설치된 Playwright chromium 과 axe-playwright 로 quality-lab 화면을 연다. 검사 기준은 Storybook
 * test-runner 와 같은 WCAG tag 와 color-contrast 이고, 원본 결과는 `audit.ts` 가 정규화한다.
 * 이 파일은 브라우저가 필요해 unit test 하지 않는다.
 */

const LAUNCH_TIMEOUT_MS = 30_000;
const PAGE_TIMEOUT_MS = 20_000;

export const openPlaywrightBrowser = async (): Promise<AuditBrowser> => {
  const browser = await chromium.launch({ headless: true, timeout: LAUNCH_TIMEOUT_MS });
  return {
    scan: async (target, url) => {
      const context = await browser.newContext({
        viewport: { width: target.viewport.width, height: target.viewport.height },
        reducedMotion: 'reduce',
      });
      try {
        const page = await context.newPage();
        await page.goto(url, { waitUntil: 'networkidle', timeout: PAGE_TIMEOUT_MS });
        await page
          .getByRole('heading', { level: 1 })
          .first()
          .waitFor({ state: 'visible', timeout: PAGE_TIMEOUT_MS });
        if (target.theme === 'dark') {
          await page.getByRole('switch', { name: '다크 모드' }).click({ timeout: PAGE_TIMEOUT_MS });
          await page
            .locator('[data-theme="dark"]')
            .first()
            .waitFor({ state: 'attached', timeout: PAGE_TIMEOUT_MS });
        }
        // tools 는 DOM 타입 없이 컴파일되므로 브라우저에서 평가할 식을 문자열로 준다.
        await page.waitForFunction(
          `!document.querySelector('[aria-busy="true"]') && document.fonts.status === 'loaded'`,
          undefined,
          { timeout: PAGE_TIMEOUT_MS },
        );
        await injectAxe(page);
        await configureAxe(page, { rules: [{ id: 'color-contrast', enabled: true }] });
        return await getAxeResults(page, undefined, {
          runOnly: { type: 'tag', values: [...WCAG_TAGS] },
        });
      } finally {
        await context.close();
      }
    },
    close: () => browser.close(),
  };
};
