# 품질 관측 아키텍처

> **한 줄 요약** — zod 계약 한 벌을 수집기(Node)와 DevHub(브라우저)가 함께 써서, bundle · context · AI 평가 신호를 **실제 수집 결과로만** 보여 주는 체계. 측정하지 못한 값은 0이 아니라 이유가 있는 빈 값.

사용법은 [usage.md](usage.md), metric 의미는 [metrics.md](metrics.md).

## 흐름

```text
libs/observability-contracts   zod 계약 (React · Node · DOM 의존 없음)
        │ 같은 schema 로 검증
        ├── tools/scripts/observability   collect → tmp/observability (store)
        │                                 export  → apps/devhub/public/observability
        └── apps/devhub "평가" 섹션       fetch /observability/*.json → 검증 → 표시
```

- **CI 결과 제외** — test · lint · typecheck · build 결과는 CI가 보고하므로 모으지 않음
- **접근성 별도** — 라이브러리는 Storybook test-runner(CI), DevHub 화면(평가 포함)은 `apps/devhub-e2e/src/a11y.spec.ts`
- **명령 실행 없음** — 브라우저에 명령 endpoint 없음
- **평가 섹션 workspace import** — `@berrypjh/observability-contracts` · `@berrypjh/react-ui` · `@berrypjh/devhub-ui` 뿐
- **계약 lib 릴리스 제외** — `private: true`, `nx.json` `release.projects`에 없음

## Profile

| profile  | 읽는 것                                                                                                                 | 쓰는 영역                                    | 실행                                         |
| -------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | -------------------------------------------- |
| `static` | manifest · exports · script 이름 · 등록 theme(parse-only) · 등록 명령 · workflow · lockfile 해시                        | `inventory`, 등록 명령은 전부 `not-run` 관측 | 없음                                         |
| `core`   | 등록 명령 출력 또는 import report, `.size-limit.cjs`, token 입력 파일                                                   | `bundles` · `contexts`                       | registry의 bundle 명령                       |
| `eval`   | `tmp/llm-evals/<dir>`의 `summary.json` · `traces.jsonl` · `routing.json` · `context.json`, eval baseline 파일 존재 여부 | `evals`                                      | 없음 (harness · executor를 다시 돌리지 않음) |

## 수집기

`tools/scripts/observability`의 Node CLI(`cli.ts`).

- **입력** — 저장소 파일 · 등록된 명령 · 이미 만든 report 뿐
- **CLI 입력** — subcommand(`collect` · `export`) · profile · run ID · import 경로 · eval 디렉터리만. argv를 만들 방법 없음
- **실행 가능한 명령** — `registry.ts`의 `COMMANDS` 뿐. `execFile`(shell 없음) + 제한 시간
- **출력** — 계약으로 검증한 뒤 store에 씀

### 등록 명령

| command ID                  | argv                                                           | domain  | 실행하는 profile              |
| --------------------------- | -------------------------------------------------------------- | ------- | ----------------------------- |
| `bundle.size-limit`         | `pnpm size --json`                                             | bundle  | core                          |
| `bundle.treeshake.react-ui` | `pnpm treeshake react-ui cx Box Stack Button TextField --json` | bundle  | core                          |
| `context.tokens-measure`    | `pnpm tokens:measure`                                          | context | 없음 (core가 in-process 계산) |
| `eval.consumer-smoke`       | `pnpm eval:consumer:smoke`                                     | eval    | 없음 (eval은 산출물만 읽음)   |

### core 진행 순서

1. `bundle.size-limit`
2. `bundle.treeshake.react-ui`
3. context — `measure-tokens` 등록부(`MEASURE_TARGETS`)의 package 시나리오와 consumer eval variant context를 로컬 tokenizer로 in-process 계산

- **lib build 없음** — react-ui · react-native-ui · design-tokens를 build하지 않음. 1 · 3은 그 시점의 `dist`를 읽음
- **source SHA** — 현재 HEAD. dist가 source보다 오래되었어도 수집기는 알 수 없음
- **partial** — `not-run` · `unavailable` · report 없음 · treeshake 실패 중 하나라도 있으면 run state `partial`

### import

- **원문 보존** — import한 report 원문은 sha256과 함께 raw로 남음
- **생성 commit 없음** — report를 만든 commit은 기록되지 않음. run source SHA는 수집 시점 HEAD

| command ID                  | 형식                |
| --------------------------- | ------------------- |
| `bundle.size-limit`         | `size-limit --json` |
| `bundle.treeshake.react-ui` | `treeshake --json`  |

### eval import

- **`sourceId`** — `eval:<디렉터리 이름>`. 다른 디렉터리의 eval은 다른 출처
- **원본 run 조건** — `origin`(runId · createdAt · gitSha · executor · model · K · task 수 · trials · conditions)은 수집기 metadata와 섞지 않음. 원본 SHA와 수집 SHA가 다를 수 있음
- **trace 불일치** — trace 합계가 summary와 어긋나면 trace를 invalid로 두고 `partial-import` notice
- **비공개** — 변경 파일 내용은 `redacted`. held-out(`test` split) trace의 gold evidence · 발췌는 공개하지 않음
- **evaluator 원래 비교** — summary의 `comparison`을 warnings까지 옮김. 없으면 baseline 파일을 직접 읽어 없음(`no-baseline`) · 깨짐(`corrupt-baseline`)으로 구분. evaluator의 `readBaseline`은 모든 오류를 없음으로 돌리므로 importer가 먼저 읽음

## 저장 · export

```text
tmp/observability/
  index.json                 store index (중복 ID · 경로 불일치 거부)
  runs/<id>/run.json         계약 검증된 artifact
  runs/<id>/manifest.json    파일별 sha256 · bytes (읽을 때 대조)
  runs/<id>/raw/             원본 report · 입력 (공개하지 않음)
apps/devhub/public/observability/
  index.json                 공개 index (run · summary 경로)
  runs/<id>.json             공개 artifact
  runs/<id>.summary.json     summarizeRun 결과
```

- **`writeRun`** — lock을 쥔 채 staging에 raw → `run.json` → `manifest.json` 순서로 쓰고 rename, index는 마지막. 실패하면 staging만 지우므로 기존 run · index 유지. 같은 ID는 `DuplicateRunError`
- **lock** — store 전역 `.lock` 디렉터리. 남아 있으면 기다리거나 지우지 않고 실패
- **읽기** — realpath root 기준, symlink · traversal 거부, 파일 크기 상한, JSON · schema 오류 구분
- **`exportRun`** — raw · `tmp/` · held-out · credential 경로 evidence를 걷어내고 공개 schema로 재검증. 같은 ID의 공개 run은 metadata가 같을 때만 다시 씀. 다르면 `ExportCollisionError`
- **gitignore** — `tmp/observability` · `apps/devhub/public/observability`

## 의미 규칙

- **availability와 outcome은 다른 축** — `available`만 값을 가짐. 나머지 7상태는 `null` + 이유
- **size-limit 값은 size-limit 의미 그대로** — 기본 brotli, esbuild 빈 프로젝트 상수 차감, `KB` = 1000 B. headroom = limit − current
- **treeshake는 보고 전용 진단** — raw · gzip을 따로. 한도 · 비율 gate 없음
- **비교는 조건이 같을 때만** — 조건이 다르면 delta 없이 이유만. 조건 목록은 [metrics.md](metrics.md)
- **실행 비교** — 번들 화면에서 고른 `?base=` 실행과의 report-only diff뿐. 최신 실행을 자동 baseline으로 삼지 않음
- **과거 숫자** — `.size-limit.cjs` 주석과 README의 과거 숫자는 observation이 아님

## 검증 gate

저장소 root에서 실행.

| gate         | 명령                                                  | 무엇을 막나                                                                                             |
| ------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 계약 build   | `pnpm nx build @berrypjh/observability-contracts`     | tools · DevHub가 읽는 dist                                                                              |
| 계약 type    | `pnpm nx typecheck @berrypjh/observability-contracts` | lib가 zod 외 의존(Node · DOM)을 쓰는 것                                                                 |
| 계약 test    | `pnpm nx test @berrypjh/observability-contracts`      | schema refinement · 요약 의미                                                                           |
| tools        | `pnpm tools:check`                                    | collector · adapter · normalizer · store · export. `tools/`는 Nx project가 아니라 affected가 닿지 않음  |
| DevHub test  | `pnpm nx test @berrypjh/devhub`                       | 평가 화면 동작 · 상태 표시 · 탐색기                                                                     |
| DevHub type  | `pnpm nx typecheck @berrypjh/devhub`                  | app + spec                                                                                              |
| DevHub lint  | `pnpm nx lint @berrypjh/devhub`                       | jsx-a11y 포함                                                                                           |
| DevHub build | `pnpm nx build @berrypjh/devhub`                      | production bundle (react-ui · devhub-ui dist 해석)                                                      |
| E2E type     | `pnpm nx typecheck @berrypjh/devhub-e2e`              |                                                                                                         |
| E2E          | `pnpm nx e2e @berrypjh/devhub-e2e`                    | `evaluation.spec.ts`(하위 화면 이동 · 포커스 · `?run=` 유지), `a11y.spec.ts`(axe), `responsive.spec.ts` |

- **E2E 데이터** — `apps/devhub-e2e`는 앱 소스를 import하지 않음. 계약으로 만든 fixture를 `page.route`로만 주입
- **react-ui 해석** — DevHub `vite.config.mts`는 `nxViteTsPaths`를 두지 않아 react-ui를 package exports(dist)로 읽음
- **전용 경계 test 없음** — 평가 섹션 import 경계를 따로 검사하는 test 없음

### 상태별 test 위치

경로는 `apps/devhub/src/` 기준.

| 상태                                   | 대표 test                                                                                       |
| -------------------------------------- | ----------------------------------------------------------------------------------------------- |
| not-applicable · unsupported · not-run | `lib/evaluation/status.spec.ts`, `lib/evaluation/ai.spec.ts`, `app/evaluation-ai-page.spec.tsx` |
| unsupported (번들)                     | `app/evaluation-bundles-page.spec.tsx`                                                          |
| timeout                                | `lib/evaluation/ai.spec.ts` (eval trace 검증 timeout)                                           |
| invalid · missing                      | `lib/evaluation/client.spec.ts`                                                                 |
| stale · partial                        | `app/evaluation-overview-page.spec.tsx`, `lib/evaluation/status.spec.ts`                        |
| not-measured                           | `lib/evaluation/format.spec.ts`                                                                 |

## 알려진 제약

측정 의미를 바꾸지 않고 남긴 제약. 해결하면 목록에서 삭제.

### 수집

- **core는 lib를 build하지 않음** — dist가 오래되어도 현재 source SHA로 기록. core 전에 `pnpm build:libs` 필요
- **import report에 생성 commit 없음** — `--only-imports` run의 bundle 값은 report를 만든 시점의 결과
- **treeshake** — `pnpm exec esbuild` 사용. pnpm을 쓸 수 없는 환경에서는 not-run
- **`workingTreeHash`** — untracked 파일 내용 미포함 (status의 경로 목록만)
- **`agent-input` context** — executor trace가 있을 때만 의미가 있어 수집하지 않음
- **`dist/AGENTS.md` 시나리오** — `design-tokens` · `ui-core` 일부 시나리오는 `dist/AGENTS.md`를 읽는데 두 lib는 그 파일을 만들지 않음. `missing-input`(0으로 두지 않음)

### eval

- **`local-*` eval run** — `smoke-scripted`(harness 확인용 고정 입력) 결과. 모델 성능 아님
- **task 부분집합** — `taskCount < datasetTaskCount`로만 판별. 같은 개수의 다른 task 조합은 구분 불가
- **`originalComparison` 이전 run** — 이 필드 이전에 수집한 eval run은 `null`. 다시 수집해야 채워짐

### 비교 · 기록

- **목록 · 추세 없음** — 실행 목록 · baseline 포인터 · 추세 화면 없음
- **보고 전용 비교** — threshold · 통계 검정 · 신뢰구간 없음
- **공개 run 충돌 검사** — metadata만 비교
- **실측 core run 없음** — 지금 계약을 통과하는 실측 core run 없음. 서로 다른 측정 사이의 실제 bundle 회귀 비교도 아직 없음

### DevHub · 빌드 · E2E

- **DevHub 성능 미측정** — build 크기와 rendering 시간
- **public 디렉터리 복사** — `vite build`가 `apps/devhub/public/observability`의 모든 파일(편집 도구가 만든 숨김 디렉터리 포함)을 `dist`에 포함
- **root 밖 `nx` 실행** — project graph 처리 실패 (`tools/evals/consumer/fixtures/*`의 이름 없는 package)
- **`apps/devhub-e2e`에 `package.json` 없음** — lockfile을 바꾸지 않기 위해. Playwright · 계약 lib은 root `node_modules`에서 해석
- **서버 재사용** — 로컬에서는 4400에 떠 있는 서버를 재사용(CI 제외). 다른 앱이 떠 있으면 그 앱을 대상으로 실행
- **수동 확인 미실행** — keyboard · 포커스 표시 · 반응형 · light/dark · reduced motion · forced colors. 자동 근거는 jsdom test와 E2E spec
