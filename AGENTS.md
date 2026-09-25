# shared-stack — 크로스 플랫폼 UI 시스템

> `CLAUDE.md`가 `@AGENTS.md`로 이 파일을 불러온다. 에이전트 지침의 단일 출처는 이 파일이다. 하위 프로젝트의 `CLAUDE.md`도 같은 방식이며, 지침은 `CLAUDE.md`가 아니라 `AGENTS.md`에 쓴다.

디자인 토큰 하나로 웹과 모바일에서 같은 UI를 만드는 Nx monorepo.

`design-tokens → ui-core → 플랫폼 UI 라이브러리 → demo 앱` 순서로 흐른다. 판단 기준은 **유지보수성 · 패키지 간 일관성 · 작고 검증 가능한 변경**이고, 작업이 허락하지 않는 한 **공개 API를 깨지 않는다.**

## Repository Overview

Nx monorepo. package manager는 **pnpm**이고, target이 있으면 Nx target으로 실행한다.

| project                                                  | 위치                           | 스택                | 역할                                                                                                                |
| -------------------------------------------------------- | ------------------------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `@berrypjh/design-tokens`                                | `libs/design-tokens`           | TypeScript          | 토큰 원본 · 변환 · 생성물                                                                                           |
| `@berrypjh/ui-core`                                      | `libs/ui-core`                 | TypeScript          | 플랫폼 중립 계약 · 공통 로직 · 기반 유틸                                                                            |
| `@berrypjh/react-ui`                                     | `libs/react-ui`                | React               | 웹 UI 컴포넌트                                                                                                      |
| `@berrypjh/react-native-ui`                              | `libs/react-native-ui`         | React Native        | 모바일 UI 컴포넌트                                                                                                  |
| `@berrypjh/devhub-ui`                                    | `libs/devhub-ui`               | React               | 이 저장소와 다른 저장소의 DevHub가 함께 쓰는 셸 · 캔버스 · markdown · 검색 · 테마. `DevHubProvider`로 router와 분리 |
| `@berrypjh/observability-contracts`                      | `libs/observability-contracts` | zod                 | quality-lab 수집기와 앱이 함께 쓰는 schema. 비공개 · 릴리스하지 않음                                                |
| `@berrypjh/{eslint,prettier,tsconfig,commitlint}-config` | `libs/*-config`                | —                   | 다른 저장소가 쓰는 공유 설정                                                                                        |
| `@berrypjh/demo-web`                                     | `apps/demo-web`                | React · Vite        | 웹 데모                                                                                                             |
| `@berrypjh/demo-mobile`                                  | `apps/demo-mobile`             | Expo · React Native | 모바일 데모                                                                                                         |
| `@berrypjh/devhub`                                       | `apps/devhub`                  | Vite                | 저장소 구조와 근거를 탐색하는 비공개 앱. `quality-lab`과 별개                                                       |
| `@berrypjh/quality-lab`                                  | `apps/quality-lab`             | Vite                | export된 품질 수집 결과를 `observability-contracts`로 검증한 뒤 보여 주는 비공개 앱                                 |
| `@berrypjh/{devhub,quality-lab}-e2e`                     | `apps/*-e2e`                   | Playwright          | 두 앱의 E2E                                                                                                         |
| `commit-mcp`                                             | `plugins/berry-commit`         | Node                | Claude Code plugin `berry-commit`의 MCP 서버                                                                        |

Nx 프로젝트가 아닌 곳도 있다.

| 위치                       | 내용                                                                                                                                                  |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugins/berry-dev`        | Claude Code plugin — 공통 rule 원본과 `sync` · `check` CLI, `repo-verify` · `frontend-quality` skill, secret guard hook. 설계는 `docs/claude-harness` |
| `.claude/rules/_generated` | `pnpm harness:sync`가 `plugins/berry-dev/standards`에서 만든 rule. **손으로 고치지 않는다** — `.claude/standards.json`이나 원본을 고친다              |
| `tools/lib`                | 도구 공용 헬퍼 (토큰 수 계산 등)                                                                                                                      |
| `tools/scripts`            | 토큰 측정 · tree-shaking 검사 · 릴리스 · 소비자 카탈로그 생성 · quality-lab 수집기(`tools/scripts/observability`)                                     |
| `tools/consumer-retrieval` | 플랫폼 → 패키지 → 심볼 → 토큰으로 조회를 좁히는 결정적 resolver (`pnpm ui:lookup`)                                                                    |
| `tools/evals/consumer`     | 소비자 평가 harness — dataset · variant · grader · 검증 · 보고                                                                                        |
| `docs/`                    | quality-lab 설계(`docs/quality-lab`), harness 설계(`docs/claude-harness`), 개발 기록(`docs/records`)                                                  |

품질 관측은 별도 흐름이다 — `observability-contracts → tools/scripts/observability (collect · export) → apps/quality-lab`.

**대부분의 앱과 lib에 자기 `AGENTS.md`가 있다.** 그 안을 고치기 전에 가장 가까운 것을 읽는다.

**`tools/`는 Nx 프로젝트가 아니라 `nx affected`가 닿지 않는다.** 타입 검사와 테스트는 `pnpm tools:check`로 돌고, PR에서는 `pr-check.yml`의 consumer-eval job이 실행한다.

## Working Principles

탐색 · 재사용 · 작은 변경 · 기존 변경 보존 · 의존성 검토 · 검증 정직성은 `.claude/rules/_generated/core.md`에 있다. 여기에는 이 저장소 고유의 것만 적는다.

- 요구가 모호하면 주변 코드와 문서를 먼저 본다. 그래도 모르면 무엇을 모르는지 정확히 말한다
- **큰 architecture 가정을 조용히 하지 않는다**
- 모듈과 함수는 짧게, 이름은 분명하게. 영리함보다 명확함을 고른다
- 주석은 드물고 쓸모 있게. 줄 주석보다 docstring · API 문서를 쓴다
- JavaScript · TypeScript 함수는 **arrow function**을 기본으로 한다. 일반 함수가 분명히 나은 경우만 예외다

### Package boundary

- **`ui-core`에 플랫폼 가정을 넣지 않는다.** DOM · React Native · CSS에 닿는 코드는 플랫폼 lib에 둔다
- **토큰 값을 패키지 사이에 복제하지 않는다.** 값의 출처는 `design-tokens` 하나다
- build 산출물을 손으로 고치지 않는다. 원본을 고치고 다시 만든다
- 이미 있는 Nx target을 우회하지 않는다
- 집중된 작업에 큰 refactor를 섞지 않는다

### Plugin

- plugin을 고칠 때는 `claude --plugin-dir ./plugins/<이름>`으로 띄운다. 로컬 디렉터리가 설치본보다 우선한다
- **`plugins/*/dist`는 커밋되는 build 산출물이다.** `src/`를 바꾸면 `pnpm build:mcp:commit`으로 다시 만들어 함께 커밋한다

## Validation

- **의미 있는 동작 변경은 전부 검증한다**
- 로직을 바꿨으면 test, 공개 타입을 바꿨으면 typecheck, export · build 동작을 바꿨으면 build를 돌린다
- UI 동작을 바꿨으면 가능한 범위에서 story · demo가 덮는지 본다
- 토큰 출력을 바꿨으면 그 값에 기대는 하위 소비자까지 검증한다

이 저장소에 어떤 검사가 있고, 무엇을 **AI 세션에서 실행할 수 없는지**는 `.claude/harness.profile.md`에 있다. 실행하지 못한 검사는 그렇게 보고한다.

## Git Safety

명시적 요청 없이 하지 않는다.

- commit · push · force push · merge · branch 삭제 · tag
- **릴리스와 배포** — `pnpm release:npm*` · `nx release` · `npm publish` · EAS 빌드 · 스토어 제출
- `git reset --hard` · `git checkout --` · `git stash` · `git clean` — 사용자 변경을 지운다
- **CI · 릴리스 · workflow 파일 수정** — 작업이 자동화 · 배포 자체일 때만 고친다

금지와 확인 대상은 `.claude/settings.json`의 permissions가 강제한다. 커밋은 공용 plugin `berry-commit`의 `/berry-commit:commit-scope`로 하고, scope별로 사용자 승인을 받은 뒤에만 커밋한다.

## Memory

| 어디에                                                                         | 무엇을                                                        |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| **committed** — `AGENTS.md` · `.claude/` · `docs/` · 각 프로젝트의 `AGENTS.md` | architecture · 안정적인 convention · 명령 · 팀 정책           |
| **auto memory**                                                                | 이 머신에서 반복되는 사실 (막히는 경로, 우회 방법, 개인 선호) |

architecture를 auto memory에만 두지 않는다. **secret과 credential은 어디에도 저장하지 않는다.**

## 문서

| 문서                                                       | 내용                                                            |
| ---------------------------------------------------------- | --------------------------------------------------------------- |
| [README.md](README.md)                                     | 패키지 · 설치 · 명령                                            |
| [.claude/harness.profile.md](.claude/harness.profile.md)   | 검증 명령 · 영향 범위 · AI 세션 제약 · UI 역할                  |
| [docs/quality-lab](docs/quality-lab/architecture.md)       | quality-lab 구조 · metric · 수집기 · 검증 · 제약                |
| [docs/claude-harness](docs/claude-harness/architecture.md) | berry-dev plugin 설계 · 계약 · 도입 · 검증                      |
| [docs/records](docs/records/)                              | 날짜별 개발 기록(결정 · 수정 · 구현). devhub "기록" 화면에 등록 |
