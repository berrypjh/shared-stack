# consumer eval

> **한 줄 요약** — `@berrypjh/react-ui` · `@berrypjh/react-native-ui`를 쓰는 LLM 작업에서, 에이전트에게 무엇을 읽혔을 때 결과가 얼마나 정확한지를 같은 dataset · 같은 결정적 grader로 비교하는 평가 harness.

대상 코드: `tools/evals/consumer/`

```text
Dataset → Runner → Variant → Executor(trace) → Verification → Graders → Metrics → Report
```

- **성공 기준** — 컨텍스트 감소만으로는 성공 아님. `Correctness >= Baseline`이 우선
- **결정적 채점** — grader는 전부 코드. LLM-as-a-Judge 미사용
- **가짜 결과 없음** — live executor가 없으면 실행 실패. 가짜 completion · placeholder baseline을 만들지 않음
- **측정 불가 ≠ 0** — 보고되지 않은 값은 trace에 `null`, report에 `N/A`, `summary.json`의 `unsupported`에 명시

## 사용법

| 명령                         | 내용                                       | executor 필요 |
| ---------------------------- | ------------------------------------------ | ------------- |
| `pnpm eval:consumer:context` | variant별 초기 컨텍스트 토큰 실측          | 아니오        |
| `pnpm eval:consumer:routing` | 결정적 platform routing confusion matrix   | 아니오        |
| `pnpm eval:consumer:smoke`   | 내장 scripted executor로 도는 smoke(PR CI) | 아니오        |
| `pnpm eval:consumer:dev`     | dev split 실행                             | 예            |
| `pnpm eval:consumer:test`    | held-out test split 실행                   | 예            |
| `pnpm tools:check`           | `tools/` 전체 typecheck + 테스트           | 아니오        |

```bash
pnpm eval:consumer:dev --replay=tmp/llm-evals/<run>/traces.jsonl --trials=3
pnpm eval:consumer:routing --split=test --json=tmp/routing.json
```

CLI 옵션(`runner/run.ts`).

| 옵션                 | 뜻                                                       |
| -------------------- | -------------------------------------------------------- |
| `--split`            | `dev` · `test` (기본 `dev`)                              |
| `--variants`         | 쉼표 구분 variant id (기본 전체)                         |
| `--tasks`            | 쉼표 구분 taskId만 실행                                  |
| `--trials`           | task당 시행 횟수 (기본 1)                                |
| `--k`                | evidence recall@K의 K (기본 5)                           |
| `--replay`           | 수집된 `traces.jsonl`을 다시 채점                        |
| `--out` · `--run-id` | 산출물 위치 (기본 `tmp/llm-evals/<split>-<시각>`)        |
| `--context-only`     | executor 없이 컨텍스트만 측정                            |
| `--routing-only`     | executor 없이 routing confusion matrix만 계산            |
| `--json`             | `--context-only` · `--routing-only` 결과를 JSON으로 저장 |
| `--smoke`            | 고정 task 4개를 scripted executor로 결정적 실행          |
| `--compare-baseline` | baseline 스냅샷과 비교                                   |
| `--write-baseline`   | 이번 실행 결과를 baseline으로 저장                       |

## Executor

- **live executor 없음** — 새 provider SDK · agent framework를 들이지 않고 boundary(`runner/executor.ts`)만 둠
- **`unavailableExecutor`** — 기본값. 호출 시 throw. `--replay`나 `--smoke` 없는 실행은 실패
- **`createReplayExecutor`** — 외부에서 수집한 trace를 다시 채점
- **`createScriptedExecutor`** — harness 테스트용 in-memory executor

## Dataset · Variant

- **split** — `datasets/dev.jsonl`(튜닝용) · `datasets/test.jsonl`(held-out). report에 항상 split 기록
- **evidence ID** — gold와 trace가 같은 ID(`component:@berrypjh/react-ui#Button`, `token:color.primary.pr500` 등)를 쓰고 정확 일치로 비교. 생성 카탈로그도 같은 규칙(`tools/scripts/generate-consumer-catalog/schema.ts`의 `evidenceIdsOf`)
- **variant 사다리** — A(`full-source`) · B(`consumer-docs`) · C(`current-discovery`)에서 D1 카탈로그 → D2 routing → D3 progressive lookup → D4 검증 실행 → D5 repair로 한 번에 하나씩 추가. 정의는 `variants/index.ts`, 비교 쌍은 `ci/compare.ts`의 `ABLATION_PAIRS`
- **routed 컨텍스트** — D2 이후 variant는 `routedContextPaths`로 플랫폼별 컨텍스트를 따로 측정해 report에 `→ web` · `→ react-native` 행으로 표시
- **resolver 위치** — routing · 카탈로그 · 토큰 조회는 [consumer-retrieval](consumer-retrieval.md)

## Verification (D4 · D5)

executor가 보고한 검증을 믿지 않고 harness가 직접 실행해 덮어씀.

```text
fixture 복사 + agent 변경 파일 → tmp/llm-evals/work/<run-id>/
  → 작은 required check부터 실행 → required 실패에서 멈춤(나머지 not-run)
  → D5만: 실패 근거로 최소 수정 → 그 check만 재실행
```

| kind            | 실행 방식                                           |
| --------------- | --------------------------------------------------- |
| `public-import` | in-process grader. 프로세스 없음                    |
| `typecheck`     | `tsc -p <workspace>/tsconfig.json`                  |
| `test`          | `vitest run --config <workspace>/vitest.config.mts` |
| `build`         | 기존 Nx `build` target(`nx run-many -t build`)      |
| `lint`          | workspace `eslint`. gold가 요구할 때만              |

- **module 해석** — 임시 workspace는 라이브러리 source가 아니라 빌드된 `dist` declaration · bundle을 가리킴. deep source import는 해석 실패, 없는 export는 typecheck 실패
- **status** — `passed` · `failed` · `not-run` · `unsupported` · `timeout`. 실행하지 않은 check는 `passed`가 아님
- **RN test** — `unsupported`. `react-native`가 트랜스파일되지 않은 소스를 배포해 jsdom fixture에서 파싱 불가
- **False Success** — `claimedSuccess === true`인데 required 검증 미통과. 분모는 성공 여부를 명시적으로 주장한 시행만(`'unknown'` · `null` 제외)
- **repair 상한** — 기본 2회(`DEFAULT_REPAIR_LIMIT`, `maxRepairAttempts`로 변경). 업계 표준이 아닌 guardrail. 같은 `failureFingerprint`가 반복되면 중단

## Grader

| grader          | 내용                                                                        |
| --------------- | --------------------------------------------------------------------------- |
| `routing`       | platform · package 일치, forbidden package, `none` task의 불필요 UI routing |
| `retrieval`     | evidence recall@K, reciprocal rank, 중복 조회                               |
| `public-import` | 변경 코드의 import를 실제 package `exports` 기준으로 검사(TS Compiler API)  |
| `verification`  | required check의 실행 여부 · exit code · 통과 여부                          |
| `task-success`  | verified success와 false success 분리, failure category                     |

아직 채점하지 않는 것.

- **`requiredBehaviors` · `forbiddenBehaviors`** — schema에만 있음. verification의 test가 간접 확인
- **`tool-error` category** — 선언만 있고 배정 경로 없음
- **없는 prop** — typecheck는 없는 export는 잡지만 polymorphic 컴포넌트의 없는 prop은 통과. 카탈로그로만 잡힘

## 산출물

```text
tmp/llm-evals/<run-id>/
  traces.jsonl   채점된 trace (raw + grade)
  summary.json   run 조건 + variant별 metric
  report.md      Overall Scorecard + Correctness · Routing · Context Efficiency · Verification
```

- **축별 독립 표시** — 네 축을 따로 표시. 합성 점수 없음
- **절대 경로 제거** — 캡처 출력의 저장소 경로를 `<repo>`로 치환, 출력 길이 상한(`EXCERPT_LIMIT`)
- **baseline** — `--compare-baseline`일 때만 비교. 규칙은 [Baseline](#baseline)

## Baseline

실제 run의 metric과 실행 조건을 split별 JSON 스냅샷(`tools/evals/consumer/baseline/<split>.json`)으로 남겨, 다음 run이 같은 조건에서만 비교하게 함. 읽기 · 쓰기는 `ci/baseline.ts`, 비교는 `ci/compare.ts`.

```bash
pnpm eval:consumer:test --replay=<traces.jsonl> --write-baseline
pnpm eval:consumer:test --replay=<traces.jsonl> --compare-baseline
```

- **현재 상태** — 스냅샷 없음. 폴더는 `--write-baseline`이 처음 쓸 때 생성
- **손으로 쓰지 않음** — 실제 실행 결과만 `--write-baseline`이 기록
- **파일이 없을 때** — report가 `No baseline available — reporting current run only` 출력. 회귀를 지어내지 않음
- **조건 저장** — dataset 해시, split, variant, trial 수, executor · model, capability 해시, catalog schema, harness 버전(`ci/conditions.ts`)
- **조건 불일치** — report가 다른 필드를 경고하고 비교 불가로 표시
- **gate 아님** — 모든 delta는 report-only. executor 연결과 반복 시행 분산 확인 전까지 임계값 없음

## Fixtures

평가 task가 가리키는 최소 consumer project(`tools/evals/consumer/fixtures/`). routing 근거와 D4 · D5 검증 workspace의 원본.

| fixture              | 의존성(`package.json`)                      | 용도                          |
| -------------------- | ------------------------------------------- | ----------------------------- |
| `web-basic`          | `@berrypjh/react-ui`                        | React 웹 소비자               |
| `react-native-basic` | `@berrypjh/react-native-ui`                 | React Native 소비자           |
| `mixed`              | 두 UI 패키지 모두(`src/web` · `src/native`) | 웹 + RN 양쪽이 필요한 소비자  |
| `no-ui`              | 없음                                        | UI 라이브러리와 무관한 소비자 |

- **routing 근거** — platform resolver는 task의 gold가 아니라 fixture의 `dependencies`와 파일 목록만 봄(`runner/fixture-context.ts`)
- **import 경로** — published package 경로로만 import. monorepo 내부 source import는 `graders/public-import.ts`가 위반으로 판정
- **검증 workspace** — fixture를 `tmp/llm-evals/work/<run-id>/`로 복사하고 agent 변경 파일을 덮어쓴 뒤 `tsconfig.json` · `vitest.config.mts`를 생성(`verification/workspace.ts`). 원본 fixture는 건드리지 않음

## CI

| 시점                                                   | 실행 내용                                                            | 모델 호출            |
| ------------------------------------------------------ | -------------------------------------------------------------------- | -------------------- |
| 모든 PR(`pr-check.yml`의 `consumer-eval` job)          | `build:libs` → `tools:check` → `eval:consumer:smoke` → report 업로드 | 없음                 |
| 수동(`consumer-eval-heldout.yml`, `workflow_dispatch`) | 선택한 split · trial · variant, `--compare-baseline`                 | executor가 있을 때만 |

- **gate** — 결정적 불변식만(schema, 카탈로그 drift, harness 테스트, typecheck, smoke). exit code로 강제
- **stochastic metric** — 전부 report-only. baseline · 반복 시행 분산 확보 전에는 임계값 근거 없음
- **카탈로그 drift** — `dist`는 커밋하지 않아 `git diff` 검사 불가. `tools/scripts/generate-consumer-catalog/catalog.test.ts`가 빌드가 쓴 `llm-catalog.json`과 재생성 결과의 일치, source barrel ↔ 카탈로그 심볼 일치를 확인
- **schedule 없음** — executor 없이는 실제 metric을 만들지 못함

## 구성

| 폴더            | 역할                                                               |
| --------------- | ------------------------------------------------------------------ |
| `runner/`       | CLI(`run.ts`), dataset · trace schema, executor boundary, pipeline |
| `variants/`     | variant 정의와 컨텍스트 측정                                       |
| `graders/`      | 결정적 grader 5종                                                  |
| `verification/` | 임시 workspace, check 계획 · 실행, repair, failure fingerprint     |
| `reporters/`    | metric 집계, confusion matrix, `report.md` 렌더링                  |
| `ci/`           | baseline 읽기 · 쓰기, 조건 비교, smoke 고정 task                   |
| `datasets/`     | `dev.jsonl` · `test.jsonl`                                         |
| `fixtures/`     | 최소 consumer project. [Fixtures](#fixtures)                       |
| `tests/`        | harness 통합 테스트와 helper                                       |

테스트는 `tests/`와 각 폴더의 `*.test.ts`. `pnpm tools:check`가 실행. 토큰 계산은 `tools/lib/token-count.ts`를 공유.
