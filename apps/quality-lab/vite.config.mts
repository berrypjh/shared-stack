/// <reference types='vitest' />
import { execFileSync } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** 화면이 run 의 freshness 를 비교할 기준 SHA. 읽지 못하면 unknown 이고 freshness 도 unknown 이다. */
const sourceSha = () => {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: __dirname, encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
};

/**
 * `nxViteTsPaths` 를 두지 않는다. 그 plugin 은 root `tsconfig.base.json` 의 paths 로
 * `@berrypjh/react-ui` 를 `libs/react-ui/src` 로 되돌린다. 이 앱은 소비자처럼 package
 * exports(dist)를 읽어야 한다.
 */
export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/quality-lab',
  define: {
    __QUALITY_LAB_SOURCE_SHA__: JSON.stringify(sourceSha()),
  },
  server: {
    port: 4300,
    host: 'localhost',
    strictPort: true,
  },
  preview: {
    port: 4300,
    host: 'localhost',
    strictPort: true,
  },
  plugins: [react()],
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
  },
  test: {
    name: '@berrypjh/quality-lab',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.spec.{ts,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/apps/quality-lab',
      provider: 'v8' as const,
    },
  },
}));
