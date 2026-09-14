# observability-contracts

## 왜 있나

quality-lab 수집기(Node)와 화면(브라우저)이 **같은 schema 한 벌**로 artifact 를 검증하게 한다.
private 이고 release 대상이 아니다.

## 절대 원칙

- 의존은 `zod` 하나. React·Node·DOM·Style Dictionary·metric grader 를 import 하지 않는다
  (`tsconfig.lib.json` 의 `lib: es2022`, `types: []` 가 막는다).
- 타입은 schema 에서 도출한다. 손으로 쓴 중복 타입을 두지 않는다.
- 값이 없으면 `null` + 이유다. 0·pass 로 바꾸는 기본값을 넣지 않는다.
- 출처를 모르면 `null` 이 아니라 `'unknown'` 이다.

## 파일

```
src/
  primitives.ts    schema 버전·unknown·ID·안전한 상대 경로·이유
  evidence.ts      evidence 출처·URL allowlist·발췌 정제·공개 경로 판정
  observation.ts   availability/outcome·domain/unit·verification 5상태
  test-summary.ts  runner report 기반 TestSummary (count 출처·cache·report 상태)
  bundle.ts        size-limit budget·treeshake 진단과 비교 조건
  context.ts       token 측정 scope·tokenizer·missing-input 과 비교 조건
  run.ts           metadata·inventory·artifact·index·manifest
  freshness.ts     source SHA 비교
  browser.ts       브라우저 세션 capability·performance entry (artifact 아님, 지원 상태 ≠ 값 상태)
  accessibility.ts 출처별 접근성 결과 (axe target·token pair·CSS·UI test·manual). rule/node 수·incomplete 분리, 점수 없음
  metrics.ts       run 의 비교 가능한 metric 점(bundle·context·eval primary)과 comparableKey. source SHA 는 key 가 아니다
  comparison.ts    명시한 두 실행 비교(comparable·incompatible·unknown·no-baseline + 이유)·delta·baseline 포인터 schema
  history.ts       요약 기반 실행 기록(시간순·gap 자리 보존)·비교 키가 같은 이웃한 점만 잇는 추세
tests/             test 전용 fixture 와 schema test
```

- **비교는 보고 전용이다.** 통과·실패 threshold·통계 검정을 만들지 않는다. 모르는 조건(eval model 설정·
  timeout·task 부분집합)은 unknown 이고, evaluator 의 원래 비교(`originalComparison`)는 대시보드 판정과 따로 둔다.

## 검증

```bash
pnpm nx test @berrypjh/observability-contracts
pnpm nx typecheck @berrypjh/observability-contracts
pnpm nx build @berrypjh/observability-contracts   # tools·앱이 dist 를 읽는다
```

## Gotcha

- **exports 에 `default` 조건이 있다.** tools 는 `tsx` 에서 CommonJS 로 로드되어 `import` 조건만으로는
  해석되지 않는다. dist 는 ESM 이고 Node 의 `require(esm)` 로 읽힌다.
- schema 를 바꾸면 `dist` 를 다시 build 해야 tools·앱이 새 schema 를 본다.
