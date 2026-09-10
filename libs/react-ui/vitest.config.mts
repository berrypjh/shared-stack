import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@berrypjh/ui-core': resolve(__dirname, '../ui-core/src/index.ts'),
    },
  },
  test: {
    name: '@berrypjh/react-ui',
    watch: false,
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    // `test/` 도 포함한다 — 테스트 하네스(`createRenderer`) 자체의 회귀 검사가 거기 있고,
    // `src/**` 만 보던 동안 그 파일은 한 번도 실행되지 않았다.
    include: ['{src,test}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8',
    },
  },
});
