# 품질 관측 검증

## gate

저장소 root에서 실행한다.

| gate         | 명령                                                                                                        | 무엇을 막나                                                                                             |
| ------------ | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 계약 build   | `pnpm nx build @berrypjh/observability-contracts`                                                           | tools · DevHub가 읽는 dist                                                                              |
| 계약 type    | `pnpm nx typecheck @berrypjh/observability-contracts`                                                       | lib가 zod 외 의존(Node · DOM)을 쓰는 것                                                                 |
| 계약 test    | `pnpm nx test @berrypjh/observability-contracts`                                                            | schema refinement · 요약 의미                                                                           |
| tools        | `pnpm tools:check` (`tsc -p tools/tsconfig.json` + `vitest run --config tools/vitest.tools.config.mts`)     | collector · parser · normalizer · store · export. `tools/`는 Nx project가 아니라 affected가 닿지 않는다 |
| DevHub test  | `pnpm nx test @berrypjh/devhub`                                                                             | 평가 화면 동작 · 상태 표시 · 평가 섹션의 탐색기 · 오른쪽 칸(`app/evaluation-shell.spec.tsx`)            |
| DevHub type  | `pnpm nx typecheck @berrypjh/devhub`                                                                        | app + spec                                                                                              |
| DevHub lint  | `pnpm nx lint @berrypjh/devhub`                                                                             | jsx-a11y 포함                                                                                           |
| DevHub build | `pnpm nx build @berrypjh/devhub`                                                                            | production bundle (react-ui · devhub-ui dist 해석)                                                      |
| E2E type     | `pnpm nx typecheck @berrypjh/devhub-e2e`                                                                    |                                                                                                         |
| E2E          | `pnpm nx e2e @berrypjh/devhub-e2e` (`evaluation*.spec.ts`, `responsive.spec.ts`)                            | 실제 chromium의 하위 메뉴 이동 · 실행 유지 · keyboard · 좁은 폭                                         |
| 구조         | `pnpm nx show project @berrypjh/devhub --json`, `pnpm nx graph --file=tmp/observability/project-graph.json` | devhub → contracts · react-ui · devhub-ui, e2e → devhub(implicit)                                       |

`pnpm tools`라는 script는 없다. `tools:check`가 그 역할이다.

## 경계 검사

- 평가 섹션의 workspace import는 `@berrypjh/observability-contracts` · `@berrypjh/react-ui` · `@berrypjh/devhub-ui` 뿐이다. DevHub `vite.config.mts`는 `nxViteTsPaths`를 두지 않아 react-ui를 package exports(dist)로 읽는다. 옛 앱의 `boundary.spec.ts`에 해당하는 전용 test는 DevHub에 없다
- DevHub `package.json` 의존: devhub-ui · contracts · react-ui · react · react-dom · react-router-dom · tailwindcss. ui-core · design-tokens · TypeScript · Style Dictionary · tokenizer는 없다
- 계약 lib는 `private: true`이고 `nx.json` `release.projects`에 없다

## 상태별 test 위치

경로는 `apps/devhub/src/` 기준이다.

| 상태                 | 대표 test                                                                                                                                          |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| N/A · not-applicable | `lib/evaluation/ai.spec.ts`, `app/evaluation-ai-page.spec.tsx`, `app/evaluation-bundles-page.spec.tsx`, `components/evaluation/bar-chart.spec.tsx` |
| unsupported          | 개요를 뺀 `app/evaluation-*-page.spec.tsx`                                                                                                         |
| not-run              | `app/evaluation-accessibility-page.spec.tsx`, `app/evaluation-design-system-page.spec.tsx`, `lib/evaluation/status.spec.ts`                        |
| timeout              | `lib/evaluation/ai.spec.ts` (eval trace 검증 timeout)                                                                                              |
| invalid · missing    | `lib/evaluation/client.spec.ts`                                                                                                                    |
| stale                | `app/evaluation-overview-page.spec.tsx`, `lib/evaluation/client.spec.ts`                                                                           |
| partial              | `app/evaluation-accessibility-page.spec.tsx`                                                                                                       |
| not-measured         | `lib/evaluation/format.spec.ts`                                                                                                                    |

## 실측 대조 — 2026-09-13

로컬 공개 run 을 원본 report 와 대조한 결과다.

| 대상         | 방법                                                                                              | 결과                                                                                                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| bundle       | size-limit 행 19개 ↔ `bundle.size-limit.json` (size · sizeLimit · passed)                        | 모두 일치. `react-native-ui — * (full)` 15,857 B > 15,100 B 한도는 원본대로 `fail`                                                                                                      |
| eval primary | `local-eval-01` · `02` 8 variant × 5 metric ↔ `summary.json` (value · 분자 · 분모 · n)           | 모두 일치. 원본 SHA `2af38d6`과 수집 SHA `c11c4b0`이 따로 남음                                                                                                                          |
| context      | 39행, 없는 입력 4행은 `missing-input` + `missingPaths`(`dist/AGENTS.md`)                          | 0으로 채우지 않음                                                                                                                                                                       |
| 재현         | 새 ID `local-static-12`(static collect → export), `local-core-12`(core `--only-imports` → export) | 둘 다 exit 0. `local-core-12` ↔ `local-quality-01`: comparable, 54 행 비교(52 행 delta 0, context 2 행은 작업 트리의 문서 변경으로 감소), 4 행 not-measured, source SHA 차이는 informs |

## 수동 확인

브라우저 · 서버를 띄울 수 없는 환경이라 keyboard · 포커스 표시 · skip link · 표 스크롤 · 반응형 · light/dark · reduced motion · forced colors 수동 확인은 **실행하지 않았다**. 자동 근거는 jsdom test(역할 · 이름 · 포커스 이동)와 실행하지 않은 E2E spec 뿐이다.
