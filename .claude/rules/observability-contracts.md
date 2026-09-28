---
paths:
  - 'libs/observability-contracts/**'
---

# observability-contracts (`libs/observability-contracts`)

zod. 품질 관측 수집기(Node)와 DevHub 평가 화면(브라우저)이 **같은 schema 한 벌**로 artifact를 검증하게 하는 계약 패키지다.

**private이고 release 대상이 아니다.**

## 원칙

- **의존은 `zod` 하나다.** React · Node · DOM · Style Dictionary · metric grader를 import하지 않는다 (`tsconfig.lib.json`의 `lib: es2022`, `types: []`가 막는다)
- **타입은 schema에서 도출한다.** 손으로 쓴 중복 타입을 두지 않는다
- **값이 없으면 `null` + 이유다.** 0 · pass로 바꾸는 기본값을 넣지 않는다
- **출처를 모르면 `null`이 아니라 `'unknown'`이다**

## 파일

```
src/
  primitives.ts    schema 버전·unknown·ID·안전한 상대 경로·이유
  evidence.ts      evidence 출처·URL allowlist·발췌 정제·공개 경로 판정·safeText
  observation.ts   availability/outcome·domain(bundle·context·eval·a11y)/unit
  eval.ts          consumer eval summary·trace (trace 검증 kind·5상태 포함)
  bundle.ts        size-limit budget·treeshake 진단과 비교 조건
  context.ts       token 측정 scope·tokenizer·missing-input 과 비교 조건
  run.ts           metadata·inventory·artifact·index·manifest
  freshness.ts     source SHA 비교
  accessibility.ts DevHub 평가 화면을 axe 로 검사한 결과. rule/node 수·incomplete 분리, 점수 없음
  metrics.ts       stableJson — key 순서에 상관없이 같은 값을 같은 문자열로 만드는 안정 직렬화
tests/             test 전용 fixture 와 schema test
```

- **비교는 보고 전용이다.** 통과 · 실패 threshold · 통계 검정을 만들지 않는다. 모르는 조건(eval model 설정 · timeout · task 부분집합)은 unknown이고, evaluator의 원래 비교(`originalComparison`)는 대시보드 판정과 따로 둔다

## 검증

```bash
pnpm nx test @berrypjh/observability-contracts
pnpm nx typecheck @berrypjh/observability-contracts
pnpm nx build @berrypjh/observability-contracts   # tools·DevHub 가 dist 를 읽는다
```

## Gotcha

- **exports에 `default` 조건이 있다.** tools는 `tsx`에서 CommonJS로 로드되어 `import` 조건만으로는 해석되지 않는다. dist는 ESM이고 Node의 `require(esm)`로 읽힌다
- schema를 바꾸면 `dist`를 다시 build해야 tools · DevHub가 새 schema를 본다
