import type { TestSuite } from '../domain/model';

/** 테스트 묶음. 개수 · 통과 여부는 담지 않는다 — 실행 결과는 quality-lab 의 몫이다. */
export const tests: TestSuite[] = [
  {
    id: 'design-tokens-vitest',
    runner: 'vitest',
    config: { path: 'libs/design-tokens/vitest.config.mts' },
    subjects: ['design-tokens'],
  },
  {
    id: 'ui-core-vitest',
    runner: 'vitest',
    config: { path: 'libs/ui-core/vitest.config.mts' },
    subjects: ['ui-core'],
  },
  {
    id: 'react-ui-vitest',
    runner: 'vitest',
    config: { path: 'libs/react-ui/vitest.config.mts' },
    subjects: ['react-ui'],
  },
  {
    id: 'react-ui-storybook-a11y',
    runner: 'storybook-test-runner',
    config: { path: 'libs/react-ui/.storybook', directory: true },
    subjects: ['react-ui'],
  },
  {
    id: 'react-native-ui-jest',
    runner: 'jest',
    config: { path: 'libs/react-native-ui/jest.config.cjs' },
    subjects: ['react-native-ui'],
  },
  {
    id: 'observability-contracts-vitest',
    runner: 'vitest',
    config: { path: 'libs/observability-contracts/vitest.config.mts' },
    subjects: ['observability-contracts'],
  },
  {
    id: 'devhub-ui-vitest',
    runner: 'vitest',
    config: { path: 'libs/devhub-ui/vitest.config.mts' },
    subjects: ['devhub-ui'],
  },
  {
    id: 'demo-web-vitest',
    runner: 'vitest',
    config: { path: 'apps/demo-web/vite.config.mts' },
    subjects: ['demo-web'],
  },
  {
    id: 'quality-lab-vitest',
    runner: 'vitest',
    config: { path: 'apps/quality-lab/vite.config.mts' },
    subjects: ['quality-lab'],
  },
  {
    id: 'quality-lab-e2e-playwright',
    runner: 'playwright',
    config: { path: 'apps/quality-lab-e2e/playwright.config.ts' },
    subjects: ['quality-lab'],
  },
  {
    id: 'devhub-e2e-playwright',
    runner: 'playwright',
    config: { path: 'apps/devhub-e2e/playwright.config.ts' },
    subjects: ['devhub'],
  },
  {
    id: 'devhub-vitest',
    runner: 'vitest',
    config: { path: 'apps/devhub/vite.config.mts' },
    subjects: ['devhub'],
  },
  {
    id: 'tools-vitest',
    runner: 'vitest',
    config: { path: 'tools/vitest.tools.config.mts' },
    subjects: [
      'consumer-catalog-generator',
      'consumer-retrieval',
      'consumer-eval',
      'observability-collectors',
      'release-scripts',
      'token-measurement',
      'treeshake-check',
    ],
  },
  {
    id: 'published-package-boundary',
    runner: 'vitest',
    config: { path: 'tools/vitest.tools.config.mts' },
    subjects: ['react-ui', 'react-native-ui'],
    files: [{ path: 'tools/lib/package-boundary.test.ts' }],
  },
];
