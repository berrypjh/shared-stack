/// <reference types='vitest' />
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

import { readSnapshot } from './src/lib/repository/snapshot';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * `nxViteTsPaths` 를 두지 않는다. root `tsconfig.base.json` 의 paths 가 `@berrypjh/react-ui` 를
 * `libs/react-ui/src` 로 돌려 놓기 때문이다. DevHub 는 소비자처럼 package exports(dist)를 읽는다.
 */
export default defineConfig(({ command, mode }) => ({
  root: __dirname,
  /** `@/` 는 이 앱의 `src/`. 다른 alias 는 두지 않는다 — 위 설명대로 react-ui 는 패키지로 읽는다. */
  resolve: {
    alias: { '@': join(__dirname, 'src') },
  },
  cacheDir: '../../node_modules/.vite/apps/devhub',
  /** `public/`(기본값)의 `observability/` 가 평가 화면이 fetch 하는 export 산출물이다 — build 가 dist 로 복사한다. */
  /** 저장소 스냅샷은 여기서 한 번 읽는다. 브라우저는 git 을 부르지 않는다. */
  define: {
    __DEVHUB_SNAPSHOT__: JSON.stringify(readSnapshot(join(__dirname, '../..'))),
    /** 개발 서버에서만. 이 머신의 절대 경로라 빌드 · 테스트에는 넣지 않는다("에디터에서 열기"). */
    __DEVHUB_REPOSITORY_ROOT__: JSON.stringify(
      command === 'serve' && mode !== 'test' ? join(__dirname, '../..') : null,
    ),
    /**
     * 같은 조건으로 에디터 설정. snapdone DevHub 와 같은 이름(`DEVHUB_EDITOR`)이라 `VITE_` 접두가 없어
     * `import.meta.env` 로는 오지 않는다 — 여기서 읽어 넣는다.
     */
    __DEVHUB_EDITOR__: JSON.stringify(
      command === 'serve' && mode !== 'test'
        ? (loadEnv(mode, __dirname, '')['DEVHUB_EDITOR'] ?? null)
        : null,
    ),
    /**
     * 평가 섹션을 싣는가. 평가 데이터(`public/observability`)는 커밋되지 않아 원격 배포에는 없다 —
     * 배포 build 는 `DEVHUB_EVALUATION=off` 로 섹션 · route · 링크를 뺀다. 그 밖에는 싣는다.
     */
    __DEVHUB_EVALUATION__: JSON.stringify(
      loadEnv(mode, __dirname, '')['DEVHUB_EVALUATION'] !== 'off',
    ),
  },
  server: {
    port: 4400,
    host: 'localhost',
    strictPort: true,
  },
  preview: {
    port: 4400,
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
    name: '@berrypjh/devhub',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.spec.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/apps/devhub',
      provider: 'v8' as const,
    },
  },
}));
