import { getStoryContext, type TestRunnerConfig } from '@storybook/test-runner';
import { checkA11y, configureAxe, injectAxe } from 'axe-playwright';

import { DS_VIEWPORTS } from './viewports';

/**
 * Storybook test-runner + axe-playwright 기반 WCAG 자동 검사. `libs/react-ui/.storybook/test-runner.ts`
 * 와 같다. 범위는 WCAG 2.0/2.1/2.2 Level A + AA 이고, 위반하면 CI 가 실패한다.
 * 기존 위반은 story 의 `parameters.a11y.disable = true` 로 baseline 처리한다 — 후속 PR 에서 점진 수정한다.
 */
const AXE_RUN_OPTIONS = {
  runOnly: {
    type: 'tag' as const,
    values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
  },
};

const config: TestRunnerConfig = {
  /**
   * `parameters.viewport.value`(예: `NarrowViewport` 이야기)가 있으면 Playwright 창을 그 크기로 맞춘다.
   * addon-viewport 는 Storybook manager 안에서만 미리보기를 리사이즈하고, `test-runner` 가 직접 여는
   * `iframe.html` 은 그 적용을 받지 않는다 — 실제 창 폭에 매이는 `lg:hidden` 같은 규칙은 이 hook 없이는
   * 늘 넓은 채로 검사돼 좁은 화면에서만 보이는 요소가 "없다"는 오류를 낸다(공식 addon-viewport 레시피).
   */
  async preVisit(page, context) {
    const storyContext = await getStoryContext(page, context);
    const value = storyContext.parameters?.viewport?.value as keyof typeof DS_VIEWPORTS | undefined;
    const size = value && DS_VIEWPORTS[value]?.styles;
    if (size)
      await page.setViewportSize({ width: parseInt(size.width), height: parseInt(size.height) });
    await injectAxe(page);
  },
  async postVisit(page, context) {
    const storyContext = await getStoryContext(page, context);
    if (storyContext.parameters?.a11y?.disable) return;

    await configureAxe(page, {
      rules: [{ id: 'color-contrast', enabled: true }],
    });
    await checkA11y(page, '#storybook-root', {
      detailedReport: true,
      detailedReportOptions: { html: true },
      axeOptions: AXE_RUN_OPTIONS,
    });
  },
};

export default config;
