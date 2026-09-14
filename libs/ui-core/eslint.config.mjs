import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredFiles: [
            '{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}',
            '{projectRoot}/vite.config.{js,ts,mjs,mts}',
            '{projectRoot}/vitest.config.{js,ts,mjs,mts}',
          ],
          // @berrypjh/design-tokens는 internal — vite가 빌드 시점에 ui-core dist로 인라인하므로 런타임 의존이 아니다.
          // devDependencies에만 두고 dependency-checks에서 제외.
          ignoredDependencies: ['vitest', '@vitejs/plugin-react', '@berrypjh/design-tokens'],
        },
      ],
    },
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
  {
    ignores: ['**/out-tsc'],
  },
];
