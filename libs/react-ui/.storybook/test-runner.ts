import { getStoryContext, type TestRunnerConfig } from '@storybook/test-runner';
import { checkA11y, configureAxe, injectAxe } from 'axe-playwright';

/**
 * Storybook test-runner + axe-playwright 기반 WCAG 자동 검사.
 * 범위는 WCAG 2.0/2.1/2.2 Level A + AA이고, 위반하면 CI가 실패한다.
 * 기존 위반은 stories의 `parameters.a11y.disable = true`로 baseline 처리한다 — 후속 PR에서 점진 수정한다.
 * `wcag22aa`는 설치된 axe-core에 실제로 있는지 확인하고 넣었다 (4.11.1 기준 규칙 하나 — `target-size`, WCAG 2.5.8 Target Size Minimum).
 * `wcag22a`·`wcag22aaa` 태그는 axe에 없다 — 없는 태그를 적으면 조용히 아무것도 검사하지 않으므로 넣지 않는다.
 * 2.4.13 Focus Appearance는 WCAG 2.2에서 AAA다.
 * 품질 목표로 삼을 수는 있어도 이 AA 게이트에 넣지 않는다.
 */
const AXE_RUN_OPTIONS = {
  runOnly: {
    type: 'tag' as const,
    values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
  },
};

const config: TestRunnerConfig = {
  async preVisit(page) {
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
