# 품질 관측 metric 카탈로그

> **한 줄 요약** — 수집 결과의 bundle · context · eval metric이 무엇을 · 어떤 단위와 분모로 · 어떤 조건에서 비교하는지를 사람이 읽는 형태로 옮긴 목록. 어긋나면 계약(`libs/observability-contracts/src`)이 우선.

- **검증** — 모든 값은 `@berrypjh/observability-contracts` (schemaVersion **1**)로 검증
- **구조 · 수집 방식** — [architecture.md](architecture.md)

## 공통 규칙

| 축           | 값                                                                                                                              | 규칙                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| availability | `available` · `not-run` · `unsupported` · `unavailable` · `permission-required` · `not-measured` · `not-applicable` · `invalid` | `available`만 값을 가짐. 나머지는 `value: null` + 이유. 0 · pass로 바꾸지 않음 |
| outcome      | `pass` · `fail` · `warn` · `info` · `null`                                                                                      | availability와 별개의 축. 판정 근거가 없으면 `null`                            |
| domain       | `bundle` · `context` · `eval`                                                                                                   |                                                                                |
| unit         | `count` · `bytes` · `bytes-delta` · `tokens` · `tokens-delta` · `ms` · `ratio`                                                  | ratio는 0–1                                                                    |
| 출처 모름    | `'unknown'`                                                                                                                     | `null`(비어 있음)과 구분                                                       |
| run state    | `running` · `complete` · `partial` · `failed` · `cancelled`                                                                     | 값 하나라도 빠지면 `partial`                                                   |
| profile      | `static` · `core` · `eval`                                                                                                      |                                                                                |
| freshness    | `fresh` · `stale` · `unknown`                                                                                                   | run의 source SHA ↔ DevHub build · serve 시점 `git rev-parse HEAD`             |

- **provenance** — `metadata.source.sha`(측정 대상 코드)와 `metadata.collection.sha`(수집기)를 구분. eval은 원본 run의 `origin.gitSha`가 따로 있음

## bundle — `bundles[]` (core)

| 항목      | size-limit (`role: budget`)                                                                                             | treeshake (`role: diagnostic`)                     |
| --------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| ID        | `bundle.size-limit.<package>.<case>`                                                                                    | `bundle.treeshake.<target>.<scenario>.<raw\|gzip>` |
| source    | `pnpm size --json` + `.size-limit.cjs`                                                                                  | `pnpm treeshake react-ui … --json` (esbuild)       |
| 값        | bytes, 기본 brotli, esbuild 빈 프로젝트 상수 차감 (`adjustment`)                                                        | raw · gzip을 따로. brotli 미측정                   |
| 한도      | `.size-limit.cjs`의 limit, `KB` = 1000 B (`bytes-iec`)                                                                  | 없음 (보고 전용)                                   |
| 판정      | headroom = limit − current, 같으면 pass, 초과는 음수 headroom과 `fail`. `toolPassed`는 size-limit 원본                  | 없음                                               |
| 비교 조건 | package · method · compression · adjustment · entry · importSpec · target · configHash · tool(name@version) · externals | 〃                                                 |

- **size-limit `passed`** — 원본 `passed`는 `budget.toolPassed`로 보존. 화면은 headroom 규칙(`limit − current ≥ 0`)으로 정한 `budget.outcome`만 표시
- **과거 숫자** — `.size-limit.cjs` 주석 · README의 과거 숫자는 observation이 아님

## context — `contexts[]` (core)

| 항목             | 내용                                                                                                                                                                                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID               | `context.<scope>.<subject>.<provider>`                                                                                                                                                                                                                                                               |
| scope            | `package-scenario` (measure-tokens 등록부) · `variant-initial` · `variant-routed` (consumer eval variant) · `agent-input` (live 평가의 실제 입력 — trial 마다 API 사용량의 턴 합계, `anthropic-messages-usage`(Claude · 로컬) 또는 `openai-chat-usage`(OpenAI) · `executor-reported` · 글자 수 없음) |
| provider · model | 수집기는 `openai-tiktoken-local` · 기본 `gpt-4o`. tokenizer 버전은 설치된 `tiktoken` package.json                                                                                                                                                                                                    |
| 구성             | `measure-tokens-read-files` · `eval-variant-context-join` · `executor-reported`                                                                                                                                                                                                                      |
| variant 정의     | variant scope 행의 `definition`(이름 · 설명). 수집할 때 consumer eval `VARIANTS`에서 가져옴. 이 필드 전에 수집한 실행에는 없음                                                                                                                                                                       |
| 없음             | `missing-input`(파일 하나라도 없으면 부분 합계 없이 null + `missingPaths`) · `provider-not-selected` · `provider-error` · `not-collected`                                                                                                                                                            |
| 비교 조건        | scope · provider · tokenModel · tokenizerVersion · contentConstruction                                                                                                                                                                                                                               |

## eval — `evals[]` (eval)

| 항목               | 내용                                                                                                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| source             | `eval:<tmp/llm-evals 디렉터리>`의 `summary.json` · `traces.jsonl` · `routing.json` · `context.json`                                                                                    |
| import 상태        | 파일마다 `parsed` · `missing` · `invalid` · `not-run` (+ 이유)                                                                                                                         |
| origin             | runId · createdAt · split · gitSha · executor · model · harnessVersion · K · taskCount · trialsPerTask · conditions                                                                    |
| executorClass      | `harness-smoke` · `live` · `scripted` · `replay` · `unavailable` · `unknown`                                                                                                           |
| primary            | `verifiedTaskSuccessRate` (rate) · `routingAccuracy` (rate) · `requiredEvidenceRecallAtK` (aggregate) · `medianInputTokens` (aggregate) · `falseSuccessRate` (rate)                    |
| rate               | value = numerator ÷ denominator. 분모 0 → `null` + `zero-denominator`                                                                                                                  |
| aggregate          | value + n. n 0 → `null` + `no-samples`, 원본 null → `source-null`                                                                                                                      |
| false success      | 분모 = 명시적 true · false 주장만 (unknown · null 제외)                                                                                                                                |
| retrieval          | required evidence 없는 task는 recall · RR이 N/A이고 평균의 n에서 빠짐. evidence 중복과 tool call 중복은 따로                                                                           |
| routing            | expected(web · react-native · both · none) × predicted(+ `unreported`) 4×5. `trace-grades`(variant 별)와 `deterministic-resolver`를 섞지 않음                                          |
| verification       | `verificationAuthority`: `executor-reported` / `harness-executed` (Progressive + Verification · Progressive + Repair variant). repair: `not-in-variant` · `no-repair-hook` · `unknown` |
| notice             | `harness-smoke` · `no-live-executor` · `no-baseline` · `baseline-not-requested` · `unsupported-required-check` · `replay-without-repair-hook` · `partial-import`                       |
| 만들지 않는 metric | `wrongPlatformRate` · `hitRate` · `stddev` · `confidenceInterval` · `passAt1`                                                                                                          |
| 원래 비교          | `originalComparison`: `source` summary/baseline-file, `status` `no-baseline` · `corrupt-baseline`(이유) · `compared`(comparable · warnings)                                            |

- **비공개** — held-out(`test` split) trace의 gold evidence · 발췌와 변경 파일 내용

## 비교

- **방식** — 번들 화면에서 고른 baseline 실행(`?base=`)과의 report-only diff
- **없는 것** — 실행 목록 · baseline 포인터 · 추세 화면. 최신 실행을 자동 baseline으로 삼지 않음
- **delta 조건** — 각 domain의 "비교 조건"이 모두 같을 때만 delta. 다르면 이유만

## 호환

- **schemaVersion** — 1 그대로
- **`evals[].originalComparison`** — 이전 artifact에서는 `null`(evaluator 비교를 가져오지 않음). 다시 수집하면 채워짐
- **`evals`** — eval import 이전 artifact에는 key가 없음. `[]`로 읽음
- **제거한 필드** — 지금 계약에 없는 필드(이전 test 결과 · package 표면 · 실행 추세 등)를 가진 이전 artifact는 계약을 통과하지 않음. 다시 수집 · export
