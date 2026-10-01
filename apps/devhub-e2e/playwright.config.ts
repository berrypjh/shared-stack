import { workspaceRoot } from '@nx/devkit';
import { defineConfig, devices } from '@playwright/test';

/** `apps/devhub/vite.config.mts` 의 server.port 와 같다. 그쪽이 strictPort 라 다른 포트로 새지 않는다. */
const PORT = 4400;
const baseURL = `http://localhost:${PORT}`;
const CI = Boolean(process.env['CI']);
const OUTPUT = '../../tmp/devhub-e2e';

/**
 * Chromium 만: DevHub 는 내부 데스크톱 도구이고, 이 묶음은 키보드 경로를 본다 — macOS WebKit 은
 * Option 없이 Tab 이 링크를 건너뛰어 같은 경로를 검사할 수 없다.
 */
export default defineConfig({
  testDir: './src',
  outputDir: `${OUTPUT}/test-output`,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  reporter: [['list'], ['html', { outputFolder: `${OUTPUT}/report`, open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm exec nx run @berrypjh/devhub:serve',
    url: baseURL,
    // CI 에서는 같은 포트에 떠 있는 무관한 서버를 재사용하지 않는다.
    reuseExistingServer: !CI,
    cwd: workspaceRoot,
    timeout: 180_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
