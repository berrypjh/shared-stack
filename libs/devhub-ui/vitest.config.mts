import { defineConfig } from 'vitest/config';

/**
 * 순수 함수 · 브라우저 API 만 검사한다. 컴포넌트를 그리는 계약(셸 · 검색 · 문서)은 소비하는 앱의
 * 테스트(apps/devhub)가 실제 카탈로그와 함께 본다.
 */
export default defineConfig({
  test: {
    name: '@berrypjh/devhub-ui',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    reporters: ['default'],
  },
});
