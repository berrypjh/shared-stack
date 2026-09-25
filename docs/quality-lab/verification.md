# quality-lab 검증

## gate

저장소 root에서 실행한다.

| gate       | 명령                                                                                                           | 무엇을 막나                                                                                                        |
| ---------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 계약 build | `pnpm nx build @berrypjh/observability-contracts`                                                              | tools · 앱이 읽는 dist                                                                                             |
| 계약 type  | `pnpm nx typecheck @berrypjh/observability-contracts`                                                          | lib가 zod 외 의존(Node · DOM)을 쓰는 것                                                                            |
| 계약 test  | `pnpm nx test @berrypjh/observability-contracts`                                                               | schema refinement · 요약 · 비교 · 추세 의미                                                                        |
| tools      | `pnpm tools:check` (`tsc -p tools/tsconfig.json` + `vitest run --config tools/vitest.tools.config.mts`)        | collector · parser · normalizer · store · export · baseline. `tools/`는 Nx project가 아니라 affected가 닿지 않는다 |
| 앱 test    | `pnpm nx test @berrypjh/quality-lab`                                                                           | 화면 동작 · 상태 표시 · public package 경계(`src/boundary.spec.ts`)                                                |
| 앱 type    | `pnpm nx typecheck @berrypjh/quality-lab`                                                                      | app + spec                                                                                                         |
| 앱 lint    | `pnpm nx lint @berrypjh/quality-lab`                                                                           | jsx-a11y 포함                                                                                                      |
| 앱 build   | `pnpm nx build @berrypjh/quality-lab`                                                                          | production bundle (react-ui dist 해석)                                                                             |
| E2E type   | `pnpm nx typecheck @berrypjh/quality-lab-e2e`                                                                  |                                                                                                                    |
| E2E        | `pnpm nx e2e @berrypjh/quality-lab-e2e`                                                                        | 실제 chromium의 이동 · 필터 · 비교 · 포인터 · fallback · keyboard · 좁은 폭                                        |
| 구조       | `pnpm nx show project @berrypjh/quality-lab --json`, `pnpm nx graph --file=tmp/quality-lab/project-graph.json` | app → contracts · react-ui, e2e → app(implicit)                                                                    |

`pnpm tools`라는 script는 없다. `tools:check`가 그 역할이다.

## 경계 검사

- `src/boundary.spec.ts`: 앱 source의 workspace import는 `@berrypjh/observability-contracts` · `@berrypjh/react-ui` · `@berrypjh/react-ui/styles.css` 뿐, `libs/` 경로 · src 밖 상대 경로 없음, `tsconfig.app/spec`의 `paths`는 `{}`, 실제 vite 설정이 react-ui를 `libs/react-ui/dist`로 해석
- 앱 `package.json` 의존: contracts · react-ui · react · react-dom · react-router-dom · tailwindcss. ui-core · design-tokens · TypeScript · Style Dictionary · tokenizer는 없다
- 계약 lib는 `private: true`이고 `nx.json` `release.projects`에 없다

## 상태별 test 위치

| 상태                       | 대표 test                                                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| N/A · not-applicable       | `data/ai.spec.ts`, `pages/ai/AiPage.spec.tsx`, `pages/bundles/BundlesPage.spec.tsx`, `components/BarChart.spec.tsx`      |
| unsupported                | 각 page spec, `probes/*.spec.ts`, `pages/browser/BrowserPage.spec.tsx`                                                   |
| not-run                    | `pages/accessibility/AccessibilityPage.spec.tsx`, `pages/design-system/DesignSystemPage.spec.tsx`, `data/status.spec.ts` |
| timeout                    | `pages/quality/TestsPage.spec.tsx` (실행 timeout), `data/ai.spec.ts` (verification timeout)                              |
| invalid · missing          | `data/client.spec.ts`, `data/loadObservability.spec.ts`                                                                  |
| stale                      | `run/RunPanel.spec.tsx`, `pages/overview/OverviewPage.spec.tsx`, `data/client.spec.ts`                                   |
| partial                    | `run/RunPanel.spec.tsx`, `pages/quality/PackagesPage.spec.tsx`, `pages/accessibility/AccessibilityPage.spec.tsx`         |
| no-baseline · incompatible | `pages/runs/RunsCompare.spec.tsx`, 계약 `tests/comparison.test.ts`                                                       |
| not-measured               | `data/format.spec.ts`, 계약 `tests/comparison.test.ts`                                                                   |

## 최근 결과 — 2026-09-13

기준: HEAD `d73377b` + 커밋되지 않은 quality-lab 작업 트리. 확인 도중 HEAD가 `3b7efea`(사용자의 design-tokens 리팩터 — lib 빌드 범위 · 생성기 · 문서)로 올라가 tools gate를 그 HEAD에서 다시 실행했고 결과가 같았다. sandbox에서는 `pnpm exec`/`pnpm nx` 대신 같은 target을 `npx nx … --excludeTaskDependencies --skip-nx-cache`로 실행했다 (의존 build는 따로 먼저 실행).

| gate                        | 결과                                                                              |
| --------------------------- | --------------------------------------------------------------------------------- |
| 계약 build · typecheck      | exit 0                                                                            |
| 계약 test                   | 13 files / 265 tests                                                              |
| tools (`tsc` + vitest 전체) | exit 0 · 59 files / 605 tests                                                     |
| 앱 test                     | 33 files / 287 tests                                                              |
| 앱 typecheck · lint         | exit 0                                                                            |
| 앱 build                    | exit 0 · entry chunk 584.79 kB (gzip 176.60 kB) 500 kB 경고                       |
| E2E typecheck               | exit 0 · `playwright test --list` 4 files / 14 tests                              |
| E2E 실행                    | **실행 안 함** — sandbox가 localhost 포트 bind를 막는다 (`listen EPERM ::1:4300`) |
| show project · graph        | exit 0                                                                            |

### 실측 대조

| 대상         | 방법                                                                                               | 결과                                                                                                                                                                                    |
| ------------ | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| test count   | `local-quality-01`의 case 상태별 수 ↔ import report (`numTotalTests` · passed · failed · pending) | 6개 source 모두 일치 (150 · 28 · 1201 · 1043 · 518 · 444)                                                                                                                               |
| bundle       | size-limit 행 19개 ↔ `bundle.size-limit.json` (size · sizeLimit · passed)                         | 모두 일치. `react-native-ui — * (full)` 15,857 B > 15,100 B 한도는 원본대로 `fail`                                                                                                      |
| eval primary | `local-eval-01` · `02` 8 variant × 5 metric ↔ `summary.json` (value · 분자 · 분모 · n)            | 모두 일치. 원본 SHA `2af38d6`과 수집 SHA `c11c4b0`이 따로 남음                                                                                                                          |
| context      | 39행, 없는 입력 4행은 `missing-input` + `missingPaths`(`dist/AGENTS.md`)                           | 0으로 채우지 않음                                                                                                                                                                       |
| 재현         | 새 ID `local-static-12`(static collect → export), `local-core-12`(core `--only-imports` → export)  | 둘 다 exit 0. `local-core-12` ↔ `local-quality-01`: comparable, 54 행 비교(52 행 delta 0, context 2 행은 작업 트리의 문서 변경으로 감소), 4 행 not-measured, source SHA 차이는 informs |

### 수동 확인

브라우저 · 서버를 띄울 수 없는 환경이라 keyboard · 포커스 표시 · skip link · 표 스크롤 · 반응형 · light/dark · reduced motion · forced colors 수동 확인은 **실행하지 않았다**. 자동 근거는 jsdom test(역할 · 이름 · 포커스 이동)와 실행하지 않은 E2E spec 뿐이다.
