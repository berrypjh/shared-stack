import base from '@berrypjh/eslint-config/base';
import nx from '@berrypjh/eslint-config/nx';
import react from '@berrypjh/eslint-config/react';

import storybook from 'eslint-plugin-storybook';

export default [
  ...base,
  ...nx,
  ...react,
  ...storybook.configs['flat/recommended'],
  {
    ignores: [
      '**/dist',
      '**/out-tsc',
      '**/storybook-static',
      '**/.generated',
      '**/_generated',
      '**/vitest.config.*.timestamp*',
      '**/vite.config.*.timestamp*',
      '!.storybook',
    ],
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    rules: {
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // 1. Side effect imports (e.g. import 'polyfill')
            ['^\\u0000'],
            // 2. Node.js builtins
            ['^node:'],
            // 3. React / React Native
            ['^react(/|$)', '^react-native(/|$)'],
            // 4. Workspace packages (@berrypjh/*)
            ['^@berrypjh/'],
            // 5. 그 외 외부 패키지 (@nx, @storybook, @playwright 등)
            ['^@?\\w'],
            // 6. 앱 내부 절대 경로 별칭 (@/...)
            ['^@/'],
            // 7. 부모 경로 (../)
            ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
            // 8. 같은/하위 디렉터리 (./)
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
            // 9. 스타일 파일
            ['^.+\\.s?css$'],
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.jsx', '**/*.tsx'],
    rules: {
      // 커스텀 컴포넌트가 autoFocus prop을 forward 하는 패턴은 호출자 책임이므로 제외
      'jsx-a11y/no-autofocus': ['error', { ignoreNonDOM: true }],
    },
  },
  {
    // 테스트 파일에서는 이벤트 버블링/위임 등을 검증하기 위해 의미 없는 div onClick을 자주 사용
    files: ['**/*.test.{ts,tsx,jsx,js}', '**/*.spec.{ts,tsx,jsx,js}'],
    rules: {
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
    },
  },
];
