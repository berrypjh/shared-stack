# @berrypjh/tsconfig

워크스페이스 공통 TypeScript 베이스 설정.

## 사용

```bash
pnpm add -D @berrypjh/tsconfig
```

### 시나리오별 베이스

| 파일           | 용도                                                             |
| -------------- | ---------------------------------------------------------------- |
| `base.json`    | 공통 strict 옵션. 직접 extends하지 않고 시나리오별 베이스를 쓴다 |
| `next.json`    | Next.js · 번들러 기반 앱용 (`moduleResolution: bundler`)         |
| `library.json` | npm 배포 라이브러리용 (`moduleResolution: nodenext`)             |

### 예시

```jsonc
// it-tech-blog: tsconfig.base.json
{
  "extends": "@berrypjh/tsconfig/next.json",
  "compilerOptions": {
    "customConditions": ["@it-tech-blog/source"],
  },
}
```

```jsonc
// 라이브러리 패키지의 tsconfig.lib.json
{
  "extends": "@berrypjh/tsconfig/library.json",
  "compilerOptions": {
    "outDir": "./dist",
  },
}
```
