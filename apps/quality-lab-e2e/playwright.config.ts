import { workspaceRoot } from '@nx/devkit';
import { defineConfig, devices } from '@playwright/test';

/** `apps/quality-lab/vite.config.mts` 의 server.port 와 같다. 그쪽이 strictPort 라 다른 포트로 새지 않는다. */
const PORT = 4300;
const baseURL = `http://localhost:${PORT}`;
const CI = Boolean(process.env['CI']);
const OUTPUT = '../../tmp/quality-lab-e2e';

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
    command: 'pnpm exec nx run @berrypjh/quality-lab:serve',
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
