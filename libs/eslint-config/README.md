# @berrypjh/eslint-config

Nx 워크스페이스용 공통 ESLint 설정(flat config).

## 사용

```bash
pnpm add -D @berrypjh/eslint-config eslint @nx/eslint-plugin
```

```js
// eslint.config.mjs
import base from '@berrypjh/eslint-config/base';
import nx from '@berrypjh/eslint-config/nx';
import react from '@berrypjh/eslint-config/react';

export default [
  ...base,
  ...nx,
  ...react,
  {
    ignores: ['**/dist', '**/.next'],
  },
  {
    // 워크스페이스 scope (@my-scope/*) 그룹을 자기 레포에 맞게 override
    files: ['**/*.{ts,tsx,js,jsx,mjs,cjs}'],
    rules: {
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^\\u0000'],
            ['^node:'],
            ['^react(/|$)', '^next(/|$)'],
            ['^@my-scope/'],
            ['^@?\\w'],
            ['^@/'],
            ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
            ['^.+\\.s?css$'],
          ],
        },
      ],
    },
  },
];
```

## 제공 베이스

| Export                          | 용도                                                                     |
| ------------------------------- | ------------------------------------------------------------------------ |
| `@berrypjh/eslint-config/base`  | Nx flat base/ts/js + import-sort + unused-imports + no-explicit-any      |
| `@berrypjh/eslint-config/nx`    | `@nx/enforce-module-boundaries` 기본값 (소비자가 tag · allow를 override) |
| `@berrypjh/eslint-config/react` | `nx.configs['flat/react']` + react-hooks + jsx-a11y                      |

Storybook, Next.js, Playwright 등 특수 layer는 소비자 레포에서 직접 추가한다.

## Peer dependencies

- `eslint ^9.8.0`
- `@nx/eslint-plugin ^22.6.5` — 소비자의 Nx 버전과 맞도록 peer로 둔다
