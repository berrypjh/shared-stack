# consumer eval

`@berrypjh/react-ui` / `@berrypjh/react-native-ui` 소비자 관점의 LLM 작업을
같은 dataset·같은 grader로 비교하는 평가 harness.

```text
Dataset → Runner → Variant → Trace → Deterministic Graders → Metrics → Report
```

목적은 "무엇을 읽혔을 때 correctness가 어떻게 되는가"를 **같은 조건에서 비교**하는 것이다.
컨텍스트가 줄었다는 것만으로 성공이라고 하지 않는다 — `Correctness >= Baseline`이 먼저다.

## 명령

| 명령                         | 내용                                            | executor 필요 |
| ---------------------------- | ----------------------------------------------- | ------------- |
| `pnpm eval:consumer:context` | variant별 초기 컨텍스트 토큰 실측               | 아니오        |
| `pnpm eval:consumer:routing` | deterministic platform routing confusion matrix | 아니오        |
| `pnpm eval:consumer:smoke`   | 모델 없이 도는 결정적 smoke (PR CI가 쓰는 것)   | 아니오        |
| `pnpm tools:check`           | `tools/` 전체 typecheck + 단위/통합 테스트      | 아니오        |
| `pnpm eval:consumer:dev`     | dev split 실행                                  | 예            |
| `pnpm eval:consumer:test`    | held-out test split 실행                        | 예            |

CLI 옵션:

| 옵션                 | 뜻                                              |
| -------------------- | ----------------------------------------------- |
| `--split`            | `dev` / `test`                                  |
| `--variants`         | 쉼표 구분 variant id (기본: 전체)               |
| `--tasks`            | 쉼표 구분 taskId만 실행                         |
| `--trials`           | task당 시행 횟수                                |
| `--k`                | evidence recall@K의 K                           |
| `--replay`           | 수집된 `traces.jsonl`을 다시 채점               |
| `--out` `--run-id`   | 산출물 위치                                     |
| `--context-only`     | executor 없이 컨텍스트만 측정                   |
| `--routing-only`     | executor 없이 routing confusion matrix만 계산   |
| `--smoke`            | 내장 scripted agent로 결정적 실행               |
| `--compare-baseline` | baseline 스냅샷과 비교 (없으면 "baseline 없음") |
| `--write-baseline`   | 이번 실행 결과를 baseline으로 저장              |

```bash
pnpm exec tsx tools/evals/consumer/runner/run.ts \
  --split=dev --replay=tmp/llm-evals/<run>/traces.jsonl --trials=3
```

## CI

| 시점                                                    | 무엇을 도는가                                              | 비용                 |
| ------------------------------------------------------- | ---------------------------------------------------------- | -------------------- |
| 모든 PR (`pr-check.yml`의 `consumer-eval` job)          | libs 빌드 → `tools:check` → 결정적 smoke → 리포트 아티팩트 | 모델 호출 0          |
| 수동 (`consumer-eval-heldout.yml`, `workflow_dispatch`) | held-out split, 설정된 trial 수, variant matrix            | executor가 있을 때만 |

정기 실행(schedule)은 넣지 않았다. executor가 없는 지금은 CI 시간만 쓰고 실제 metric을
만들지 못한다.

### Gate 정책

**결정적 불변식만 gate한다:**
schema 위반, catalog/public export drift, harness 단위 테스트 실패, typecheck 실패,
smoke 실패. 전부 PR job이 exit code로 강제한다.

**stochastic metric은 전부 report-only다.** baseline과 반복 시행 분산이 없는 상태에서
`80%` 같은 임계값을 정하는 것은 근거가 없다. 순서는 baseline 수집 → 분산 확인 →
tolerance 결정 → gate 도입이다.

### Catalog drift 검사 방법

`dist`는 커밋 대상이 아니므로 `git diff --exit-code dist/...` 같은 검사를 쓰지 않는다.
대신 CI가 libs를 빌드한 뒤, **빌드가 쓴 `llm-catalog.json`과 generator 재생성 결과가
byte 단위로 같은지**를 harness 테스트가 확인한다. source barrel ↔ catalog 심볼 일치도
같은 테스트가 본다.

### Baseline

`tools/evals/consumer/baseline/<split>.json`. 실제 실행에서만 `--write-baseline`으로
만들어진다. 없으면 report가 그렇게 말한다. 자세한 규칙은 그 디렉터리의 README 참조.

## Executor

이 repository에는 programmatic LLM executor가 없다. 새 provider SDK·agent framework를
추가하지 않고 boundary(`runner/executor.ts`)만 둔다.

- `createScriptedExecutor` — harness 테스트용 in-memory executor
- `createReplayExecutor` — 외부에서 수집한 trace를 다시 채점
- `unavailableExecutor` — 기본값. 호출되면 **throw**한다

`--replay` 없이 실행하면 실패한다. 가짜 completion이나 placeholder baseline을 만들지 않는다.
Claude Code CLI를 child process로 부르는 adapter는 넣지 않았다 — 중첩 실행이 이 repository의
확립된 convention이 아니고, 안정 지원 여부를 확인하지 못했다.

## Split

- `datasets/dev.jsonl` — prompt/variant/catalog 튜닝에 사용 가능
- `datasets/test.jsonl` — held-out. 기본 개발 명령이 자동으로 덤프하지 않는다

report에는 항상 split이 기록된다.

## Evidence ID

Retrieval 채점은 prose matching을 하지 않는다. gold와 trace가 같은 ID를 쓰고 정확 일치로 비교한다.

```text
package:@berrypjh/react-ui
component:@berrypjh/react-ui#Button
prop:@berrypjh/react-ui#Button.loading
export:@berrypjh/react-native-ui#useTheme
token:color.primary.pr500
doc:libs/react-ui/AGENTS.consumer.md
```

생성 카탈로그(`dist/llm-catalog.json`)도 같은 convention으로 evidence ID를 만든다
(`tools/scripts/generate-consumer-catalog/schema.ts`의 `evidenceIdsOf`).

## Variant

| id                                   | 의미                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------ |
| `full-source` (A)                    | lib source 전체. correctness ceiling 기준선                              |
| `consumer-docs` (B)                  | `AGENTS.consumer.md` 중심 compact 컨텍스트                               |
| `current-discovery` (C)              | package manifest + README + 번들 declaration + token catalog (현재 방식) |
| `current-with-catalog` (D1)          | C + 빌드 생성 `llm-catalog.json`                                         |
| `catalog-with-routing` (D2)          | D1 + deterministic platform routing                                      |
| `progressive-retrieval` (D3)         | D2 + progressive lookup — full d.ts / full token catalog 제외            |
| `progressive-with-verification` (D4) | D3 + required verification 실제 실행 (관찰만)                            |
| `progressive-with-repair` (D5)       | D4 + 상한 있는 최소 수정                                                 |

모든 variant는 같은 dataset과 같은 grader를 쓴다. **한 번에 하나씩만 더한다** — 그래야
어느 변화가 효과를 냈는지 분리된다.

D1의 초기 컨텍스트는 C보다 **크다** (정확한 사실을 추가하기만 하므로). 축소는 D2/D3에서
일어난다. routing이 있는 variant는 `routedContextPaths`를 갖고, task 하나가 실제로 받는
플랫폼별 컨텍스트가 따로 측정되어 report에 `→ web` / `→ react-native` 행으로 나온다.

routing / catalog / token 조회 resolver 자체는 `tools/consumer-retrieval`에 있다.

## Verification (D4/D5)

D4/D5에서는 **harness가 직접 검증을 돌린다** — executor가 스스로 보고한 verification을
믿지 않고 실측 결과로 덮어쓴다.

```text
fixture 복사 + agent 변경 파일 적용 → 임시 workspace
  → 가장 작은 required check부터 실행
  → required 실패에서 멈춘다 (나머지는 not-run)
  → D5만: 실패 근거로 최소 수정 → 그 check만 재실행
```

임시 workspace의 module 해석은 **published declaration/bundle**을 가리킨다. 그래서
deep source import는 해석부터 실패하고, 없는 export는 typecheck가 잡는다.

| kind            | 실행 방식                                           | 비고                             |
| --------------- | --------------------------------------------------- | -------------------------------- |
| `public-import` | in-process grader                                   | 프로세스를 띄우지 않는다         |
| `typecheck`     | `tsc -p <workspace>/tsconfig.json`                  | 실제 실행                        |
| `test`          | `vitest run --config <workspace>/vitest.config.mts` | web/none만. RN은 `unsupported`   |
| `build`         | 기존 Nx `build` target                              | 새 global target을 만들지 않는다 |
| `lint`          | workspace eslint                                    | gold에서 요구할 때만             |

`status`는 `passed`/`failed`/`not-run`/`unsupported`/`timeout`이다.
**실행하지 않은 check는 절대 `passed`가 아니다.** `unsupported`(harness가 지원 못 함)와
`not-run`(지원하지만 실행 안 됨)을 구분한다.

react-native 컴포넌트 테스트는 이 harness에서 `unsupported`다 — `react-native`가
트랜스파일되지 않은 소스를 배포해 jsdom fixture에서 파싱되지 않는다(실측 확인).

### False Success

```text
False Success = claimedSuccess === true AND required verification did not pass
```

분모는 `true`/`false`를 **명시적으로 주장한** 시행만이다. `'unknown'`(agent가 모른다고
답함)과 `null`(executor 미보고)은 분모에서 제외한다 — 모른다고 답한 것을 거짓 주장으로
세지 않는다.

### Repair 상한

기본 2회. **engineering guardrail이지 업계 표준이 아니다.** 무한 loop를 막고 repair
비용을 유한하게 두려고 고른 값이며 `maxRepairAttempts`로 바꿀 수 있다.
같은 `failureFingerprint`가 반복되면 같은 수리를 되풀이하지 않고 멈춘다.

## Grader

전부 deterministic이다. LLM-as-a-Judge를 쓰지 않는다.

| grader          | 내용                                                                      |
| --------------- | ------------------------------------------------------------------------- |
| `routing`       | platform/package 일치, forbidden package, `none` task의 불필요 UI routing |
| `retrieval`     | evidence recall@K, reciprocal rank, duplicate retrieval                   |
| `public-import` | 변경된 코드의 import를 실제 package `exports` 기준으로 검사               |
| `verification`  | required check의 실행 여부·exit code·통과 여부                            |
| `task-success`  | verified success와 false success 분리, failure category                   |

`public-import`는 regex 대신 TypeScript Compiler API로 specifier를 추출한다 (새 AST 의존성 없음).

## 측정 불가와 0의 구분

executor가 보고하지 않은 값은 trace에서 `null`로 남고, metric은 `N/A`로 렌더링된다.
`summary.json`의 `unsupported` 배열이 그 목록을 명시한다. 0으로 대체하지 않는다.

## 산출물

```text
tmp/llm-evals/<run-id>/
  traces.jsonl   채점된 trace (raw + grade)
  summary.json   run metadata + 조건 + variant별 metric
  report.md      Scorecard / Correctness / Routing / Context Efficiency / Verification
```

`report.md`는 네 축을 **각각 독립적으로** 보여준다. 합성 점수(composite score)를 만들지 않는다 —
축끼리 상쇄되면 판단이 불가능해지기 때문이다.

검증용 임시 workspace는 아티팩트 밖(`tmp/llm-evals/work/<run-id>/`)에 만든다.
아티팩트에는 실행 환경 절대 경로가 남지 않고(`<repo>`로 치환), 캡처 출력에는 상한이 있다.

`tmp/`는 gitignore 대상이다.

## 아직 채점하지 않는 것

- `expected.requiredBehaviors` / `forbiddenBehaviors` — schema에는 있지만 **어떤 grader도
  아직 채점하지 않는다.** 실제 동작은 verification의 targeted test가 간접적으로만 확인한다.
- `tool-error` failure category — 선언되어 있으나 배정되는 경로가 없다. executor가 tool
  실패를 보고해야 채워진다.
- prop 수준 hallucination — typecheck는 없는 _export_(TS2305)는 잡지만, polymorphic
  컴포넌트의 없는 *prop*은 통과시킨다. 그쪽은 카탈로그로만 잡힌다.

## 토큰 카운팅

`tools/lib/token-count.ts`를 `tools/scripts/measure-tokens/*`와 공유한다. 중복 구현 없음.
