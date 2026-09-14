# quality-lab metric 카탈로그

모든 값은 `@berrypjh/observability-contracts` (schemaVersion **1**) 로 검증된다. 이 문서는 계약의 의미를
사람이 읽는 형태로 옮긴 것이고, 어긋나면 계약(`libs/observability-contracts/src`)이 우선이다.

## 공통 규칙

| 축           | 값                                                                                                                              | 규칙                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| availability | `available` · `not-run` · `unsupported` · `unavailable` · `permission-required` · `not-measured` · `not-applicable` · `invalid` | `available` 만 값을 갖는다. 나머지는 `value: null` + 이유. 0·pass 로 바꾸지 않는다 |
| outcome      | `pass` · `fail` · `warn` · `info` · `null`                                                                                      | availability 와 별개의 축. 판정 근거가 없으면 `null`                               |
| domain       | `test` · `bundle` · `context` · `eval` · `verification` · `a11y` · `browser`                                                    |                                                                                    |
| unit         | `count` · `bytes` · `bytes-delta` · `tokens` · `tokens-delta` · `ms` · `ratio`                                                  | ratio 는 0–1                                                                       |
| 출처 모름    | `'unknown'`                                                                                                                     | `null`(비어 있음)과 구분한다                                                       |
| run state    | `running` · `complete` · `partial` · `failed` · `cancelled`                                                                     | 값 하나라도 빠지면 `partial`                                                       |
| profile      | `static` · `core` · `eval` · `a11y`                                                                                             |                                                                                    |
| freshness    | `fresh` · `stale` · `unknown`                                                                                                   | run 의 source SHA ↔ 앱 build·serve 시점 `git rev-parse HEAD`                      |

provenance 는 두 SHA 로 나뉜다: `metadata.source.sha`(측정 대상 코드)와 `metadata.collection.sha`(수집기).
eval 은 여기에 원본 run 의 `origin.gitSha` 가 따로 있다.

## test — `tests[]` (core)

| 항목                         | 내용                                                                                                                                                                                                            |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| source                       | `vitest:@berrypjh/observability-contracts` · `vitest:@berrypjh/quality-lab` · `vitest:@berrypjh/react-ui` · `jest:@berrypjh/react-native-ui` · `vitest:@berrypjh/demo-web` · `vitest:tools`                     |
| execution                    | `completed` · `failed` · `timeout` · `cancelled` · `imported` · `not-run` · `unsupported` · `unavailable` (프로세스 상태, case 상태가 아님)                                                                     |
| report                       | `parsed` · `missing` · `corrupt` · `invalid` · `not-requested`. report 가 없으면 case·count·outcome 이 없다                                                                                                     |
| count 출처                   | `sourceFiles` = source-scan (case 수 아님) · `reportedFiles`·`suites`·`cases`·`passed`·`failed`·`skipped`·`todo` = runner-report · `retriedCases`·`attempts` = derived-from-report · `wallMs` = collector-clock |
| observation `test.<project>` | value = passed ÷ (passed + failed), **denominator = 실행된 case**(skip·todo 제외), unit ratio. 실행 case 0 → `not-applicable`                                                                                   |
| outcome                      | `pass` 는 completed/imported + failed 0 + case 있음일 때만. cache 복원은 새 report 가 아니다                                                                                                                    |
| coverage                     | 수집기 없음 → `not-measured` + 이유                                                                                                                                                                             |

## verification — observations (core)

`lint.quality-lab` · `typecheck.quality-lab` · `typecheck.observability-contracts` · `typecheck.react-ui.lib` ·
`typecheck.react-ui.storybook` · `typecheck.react-ui.spec` · `build.observability-contracts`.
kind `public-import`·`typecheck`·`test`·`build`·`lint`, status `passed`·`failed`·`not-run`·`unsupported`·`timeout`
(eval harness 와 같은 어휘), exit code·발췌(정제) 포함. `--only-imports` 는 전부 `not-run`.

## bundle — `bundles[]` (core)

| 항목      | size-limit (`role: budget`)                                                                              | treeshake (`role: diagnostic`)                     |
| --------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| ID        | `bundle.size-limit.<package>.<case>`                                                                     | `bundle.treeshake.<target>.<scenario>.<raw\|gzip>` |
| source    | `pnpm size --json` + `.size-limit.cjs`                                                                   | `pnpm treeshake react-ui … --json` (esbuild)       |
| 값        | bytes, 기본 brotli, esbuild 빈 프로젝트 상수 차감 (`adjustment`)                                         | raw·gzip 을 따로                                   |
| 한도      | `.size-limit.cjs` 의 limit, `KB` = 1000 B (`bytes-iec`)                                                  | 없음 (보고 전용)                                   |
| 판정      | headroom = limit − current, 같으면 pass, 초과는 음수 headroom 과 `fail`. `toolPassed` 는 size-limit 원본 | 없음                                               |
| 비교 조건 | package·method·compression·adjustment·entry·importSpec·target·configHash·tool(name@version)·externals    | 〃                                                 |

`.size-limit.cjs` 주석·README 의 과거 숫자는 observation 이 아니다.

## context — `contexts[]` (core)

| 항목           | 내용                                                                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | `context.<scope>.<subject>.<provider>`                                                                                                    |
| scope          | `package-scenario` (measure-tokens 등록부) · `variant-initial` · `variant-routed` (consumer eval variant) · `agent-input` (수집 안 함)    |
| provider·model | `openai-tiktoken-local` · `gpt-4o`, tokenizer 버전은 설치된 `tiktoken` package.json                                                       |
| 구성           | `measure-tokens-read-files` · `eval-variant-context-join` · `executor-reported`                                                           |
| 없음           | `missing-input`(파일 하나라도 없으면 부분 합계 없이 null + `missingPaths`) · `provider-not-selected` · `provider-error` · `not-collected` |
| 비교 조건      | scope·provider·tokenModel·tokenizerVersion·contentConstruction                                                                            |

## eval — `evals[]` (eval)

| 항목               | 내용                                                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| source             | `eval:<tmp/llm-evals 디렉터리>` 의 `summary.json`·`traces.jsonl`·`routing.json`·`context.json`                                                                      |
| import 상태        | 파일마다 `parsed` · `missing` · `invalid` · `not-run` (+ 이유)                                                                                                      |
| origin             | runId·createdAt·split·gitSha·executor·model·harnessVersion·K·taskCount·trialsPerTask·conditions                                                                     |
| executorClass      | `harness-smoke` · `scripted` · `replay` · `unavailable` · `unknown`                                                                                                 |
| primary            | `verifiedTaskSuccessRate` (rate) · `routingAccuracy` (rate) · `requiredEvidenceRecallAtK` (aggregate) · `medianInputTokens` (aggregate) · `falseSuccessRate` (rate) |
| rate               | value = numerator ÷ denominator. 분모 0 → `null` + `zero-denominator`                                                                                               |
| aggregate          | value + n. n 0 → `null` + `no-samples`, 원본 null → `source-null`                                                                                                   |
| false success      | 분모 = 명시적 true·false 주장만 (unknown·null 제외)                                                                                                                 |
| retrieval          | required evidence 없는 task 는 recall·RR 이 N/A 이고 평균의 n 에서 빠진다. evidence 중복과 tool call 중복은 따로                                                    |
| routing            | expected(web·react-native·both·none) × predicted(+ `unreported`) 4×5. `trace-grades`(variant 별)와 `deterministic-resolver` 를 섞지 않는다                          |
| verification       | `verificationAuthority`: `executor-reported` / `harness-executed` (D4·D5 variant). repair: `not-in-variant` · `no-repair-hook` · `unknown`                          |
| notice             | `harness-smoke` · `no-live-executor` · `no-baseline` · `baseline-not-requested` · `unsupported-required-check` · `replay-without-repair-hook` · `partial-import`    |
| 만들지 않는 metric | `wrongPlatformRate` · `hitRate` · `stddev` · `confidenceInterval` · `passAt1`                                                                                       |
| 원래 비교          | `originalComparison`: `source` summary/baseline-file, `status` `no-baseline`·`corrupt-baseline`(이유)·`compared`(comparable·warnings)                               |

held-out(`test` split) trace 의 gold evidence·발췌와 변경 파일 내용은 공개하지 않는다.

## accessibility — `accessibility[]` (a11y)

| 출처 id               | source                  | 무엇                                                                            |
| --------------------- | ----------------------- | ------------------------------------------------------------------------------- |
| `a11y:storybook`      | `storybook-test-runner` | story 별 axe (skip 은 통과가 아님)                                              |
| `a11y:quality-lab`    | `axe-playwright`        | localhost quality-lab route × theme × viewport                                  |
| `a11y:token-contrast` | `vitest-report`         | token 색 쌍 대비 test (WCAG 4.5:1 text · 3:1 non-text, 1.2:1 은 WCAG 기준 아님) |
| `a11y:static-css`     | `vitest-report`         | compiled CSS 텍스트 검사                                                        |
| `a11y:ui-test`        | `vitest-report`         | react-ui·demo-web·quality-lab UI test                                           |
| `a11y:manual`         | `manual-record`         | 사람의 관찰                                                                     |

- audit outcome: `completed` · `partial` · `scan-failed` · `not-run` — 검사 실행의 결과이지 접근성 판정이 아니다.
- axe: rule 수와 node 수를 나누고 `incomplete` 를 violation 과 섞지 않는다. node 는 최대 20개만 싣는다.
- check: `passed` · `failed` · `unknown`(report 에 case 없음·전부 skip) · `not-run`(report 없음).
- manual: `observed-ok` · `observed-issue` · `not-run`. 합친 점수는 없다.

## browser — 세션 (artifact 아님)

- support: `supported` · `unsupported` · `unavailable` · `permission-required` · `not-measured`
- value state: `sampled` · `awaiting-sample` · `error` · `not-sampled` — `sampled` 의 false·0 은 실제 값
- performance entry 는 개별 관측(scope `hard-navigation`·`document-lifetime`·`interaction`)이고 Web Vitals 를 계산하지 않는다.
- 저장·전송하지 않는다 (`persisted: false`, `transmitted: false`).

## design system — `designSystem`·`packageSurfaces` (static)

- 관측 종류 `declared` · `consumed` · `tested` · `unknown` · `not-applicable`, state 어휘 `pressed` · `focus-visible` · `size-sm` · `size-md` · `reduced-motion`.
- test 근거는 `behavior-assertion` 과 `source-assertion` 을 나눈다. source 참조만으로 tested 가 아니다.
- 산출물 `present` · `missing` · `invalid`, package build `complete` · `partial` · `missing` · `not-applicable`, catalog 재생성 `identical`/`differs`.

## 비교·추세

- 실행 비교 상태: `comparable` · `incompatible` · `unknown` · `no-baseline` + 이유(`blocks`·`unknown`·`informs`).
- 행 상태: `compared` · `incompatible` · `unknown` · `not-measured` · `added` · `removed`. 모두 `report-only`.
- delta: 부호 있는 절대 차이 · 상대 차이(기준 0 이면 N/A) · 비율은 percentage point. median 차이는 검정이 아니다.
- 비교 대상 metric(`series`): bundle 값·context tokens·eval primary 5개. test·verification·a11y·design system 은 비교·추세 대상이 아니다.
- eval 비교 key: sourceId·variant·metric·K·taskCount·trialsPerTask·conditions(gitSha·ref 제외). model 설정·timeout 모름, task 부분집합은 `unknown`.
- source SHA·lockfile·toolchain·dirty 차이는 막지 않고 알린다. 같은 run·다른 profile·공유 지표 없음은 `incompatible`.
- 추세 점: `point`(구간 번호) · `gap`(요약 없음) · `not-measured` · `unknown-conditions` · `absent`(그 metric 이 없는 run, 구간을 끊지 않음).

## 호환·migration

schemaVersion 은 1 그대로다. 아래는 모두 **이전 artifact 를 계속 읽는** 추가 필드이고, 기본값은 "없음/모름" 이다.

| 필드                             | 이전 artifact 에서 | 뜻                                            |
| -------------------------------- | ------------------ | --------------------------------------------- |
| `run.accessibility`              | `[]`               | 접근성 결과를 수집하지 않은 run               |
| `summary.sections.accessibility` | `0`                | 〃                                            |
| `summary.series`                 | `null`             | 추세 값을 모름 (빈 목록이 아님) → 다시 export |
| `evals[].originalComparison`     | `null`             | evaluator 비교를 가져오지 않음 → 다시 수집    |
| profile `a11y`                   | —                  | 새 profile                                    |

원본 도구와 의미가 달라진 곳:

- evaluator `readBaseline` 은 없는 파일·깨진 파일을 모두 `null` 로 돌린다. importer 는 먼저 둘을 나눈다.
- size-limit 의 원본 `passed` 는 artifact 의 `budget.toolPassed` 로 보존한다. 화면은 headroom 규칙
  (`limit − current ≥ 0`)으로 정한 `budget.outcome` 을 보여주고 `toolPassed` 는 표시하지 않는다.
- treeshake 는 brotli 를 재지 않는다 (raw·gzip 만).
