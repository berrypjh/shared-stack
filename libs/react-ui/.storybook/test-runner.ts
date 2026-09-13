import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

import { getStoryContext, type TestRunnerConfig } from '@storybook/test-runner';
import { checkA11y, configureAxe, getAxeResults, injectAxe } from 'axe-playwright';

// Storybook test-runner + axe-playwright 기반 WCAG 자동 검사.
// WCAG 2.0/2.1/2.2 Level A + AA. 위반 시 CI fail.
// 기존 위반은 stories의 `parameters.a11y.disable = true`로 baseline 처리 — 후속 PR에서 점진 수정.
//
// `wcag22aa` 는 설치된 axe-core 에 실제로 있는지 확인하고 넣었다 (4.11.1 기준 규칙 하나 —
// `target-size`, WCAG 2.5.8 Target Size Minimum). `wcag22a`·`wcag22aaa` 태그는 axe 에 **없다**
// — 없는 태그를 적으면 조용히 아무것도 검사하지 않으므로 넣지 않는다.
//
// 2.4.13 Focus Appearance 는 WCAG 2.2 에서 **AAA** 다. 품질 목표로 삼을 수는 있어도 이 AA
// 게이트에 넣지 않는다.
//
// `QUALITY_A11Y_RESULTS` 가 있을 때만 story 마다 skip 여부와 axe 원본 결과를 JSONL 로 남긴다
// (quality-lab 수집용, `tmp/quality-lab/imports` 안). 검사·skip·실패 기준은 그대로다 — 같은
// 범위·옵션으로 결과를 한 번 더 읽어 저장할 뿐이고, 판정은 아래 `checkA11y` 가 한다.
const AXE_RUN_OPTIONS = {
  runOnly: {
    type: 'tag' as const,
    values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
  },
};

const IMPORTS_DIR = path.resolve('tmp/quality-lab/imports');

const resultsFile = (() => {
  const target = process.env.QUALITY_A11Y_RESULTS;
  if (!target) return null;
  const resolved = path.resolve(target);
  if (!resolved.startsWith(`${IMPORTS_DIR}${path.sep}`)) {
    throw new Error(`QUALITY_A11Y_RESULTS 는 ${IMPORTS_DIR} 안의 경로여야 합니다`);
  }
  return resolved;
})();

const record = async (entry: Record<string, unknown>) => {
  if (!resultsFile) return;
  await mkdir(path.dirname(resultsFile), { recursive: true });
  await appendFile(
    resultsFile,
    `${JSON.stringify({ ...entry, scannedAt: new Date().toISOString() })}\n`,
  );
};

const config: TestRunnerConfig = {
  async preVisit(page) {
    await injectAxe(page);
  },
  async postVisit(page, context) {
    const story = { storyId: context.id, title: context.title, name: context.name };
    const storyContext = await getStoryContext(page, context);
    if (storyContext.parameters?.a11y?.disable) {
      await record({ ...story, status: 'skipped', reason: 'parameters.a11y.disable' });
      return;
    }

    await configureAxe(page, {
      rules: [{ id: 'color-contrast', enabled: true }],
    });
    if (resultsFile) {
      const results = await getAxeResults(page, '#storybook-root', AXE_RUN_OPTIONS);
      await record({ ...story, status: 'scanned', reason: null, results });
    }
    await checkA11y(page, '#storybook-root', {
      detailedReport: true,
      detailedReportOptions: { html: true },
      axeOptions: AXE_RUN_OPTIONS,
    });
  },
};

export default config;
