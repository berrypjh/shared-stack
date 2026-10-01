---
paths:
  - 'libs/observability-contracts/**'
---

# observability-contracts (`libs/observability-contracts`)

품질 관측 수집기(Node · `tools/scripts/observability`)와 DevHub 평가 화면(브라우저)이 같은 zod schema로 artifact를 검증하게 하는 계약 패키지. private이고 release하지 않는다. 공개 schema 목록은 `src/index.ts`가 원본이다.

## 규칙

- **의존은 `zod` 하나만 둔다.** 양쪽 런타임이 같은 코드를 읽기 때문이다. `tsconfig.lib.json`의 `lib: es2022` · `types: []`가 DOM · Node 타입을 막는다
- **타입은 `z.infer`로 schema에서 만든다.** 손으로 쓴 타입은 schema와 어긋난다
- **값이 없으면 `null`과 이유를 함께 둔다.** 0 · pass 같은 기본값은 "측정 안 됨"을 "통과"로 보이게 한다
- **출처를 모르면 `'unknown'`을 쓴다.** `null`(값 없음)과 구분하기 위해서다
- **비교는 보고만 한다.** 통과 · 실패 threshold나 통계 검정을 넣지 않는다. 모르는 조건(eval model 설정 · timeout · task 부분집합)은 unknown으로 두고, evaluator의 원래 비교(`originalComparison`)는 대시보드 판정과 따로 둔다

## 검증

```bash
pnpm nx test @berrypjh/observability-contracts
pnpm nx typecheck @berrypjh/observability-contracts
pnpm nx build @berrypjh/observability-contracts
```

schema를 바꾸면 build까지 돌린다. tools와 DevHub는 `src`가 아니라 `dist`를 읽는다.

## Gotcha

- **`exports`의 `default` 조건을 지우지 않는다.** 루트 `package.json`에 `"type"`이 없어 tools는 `tsx`에서 CommonJS로 로드되고, `import` 조건만으로는 해석되지 않는다. dist는 ESM이고 Node의 `require(esm)`로 읽힌다
- **테스트는 `tests/` 아래 `*.test.ts`로 만든다.** vitest가 `tests/**/*.test.ts`만 모아서, 다른 lib처럼 `*.spec.ts`로 쓰면 조용히 돌지 않는다
