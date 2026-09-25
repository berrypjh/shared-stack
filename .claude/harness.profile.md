# Harness profile

berry-dev의 generic rule · 절차(`repo-verify` 등)가 가리키는 shared-stack 사실이다. 명령을 실행하는 형식이 아니라 사람이 읽는 문서다. target 표는 두지 않는다 — target은 `nx show project <이름> --json`으로 확인한다.

## 검증

### 영향 범위

- Nx workspace다([nx.json](../nx.json)). 영향은 `nx show projects --affected --files=<파일>`로 묻는다
- **affected는 거의 비지 않는다.** Nx 프로젝트 밖 파일(`tools/**` · `.claude/**` · `.claude-plugin/**` · `plugins/berry-dev/**` · `docs/**`)은 root 프로젝트 `@berrypjh/shared-stack`로 잡히고, devhub의 test · build가 저장소 전체를 입력으로 두어 `@berrypjh/devhub` · `@berrypjh/devhub-e2e`가 함께 나온다([apps/devhub/AGENTS.md](../apps/devhub/AGENTS.md) Gotcha)
- root 프로젝트의 target은 `local-registry` 하나다(포트를 연다). 그래서 위 경로의 실제 검사는 아래 "프로젝트 밖 경로"다
- `nx affected -t <target>`은 target이 없는 프로젝트를 건너뛴다. 예: `commit-mcp`에는 `test`가 없다

### 프로젝트 밖 경로

| 바꾼 곳                                                        | 검사                                                                                         |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `tools/**` · `.claude/hooks/**` · `plugins/berry-dev/**`       | `pnpm tools:check` — contracts build → `tsc -p tools/tsconfig.json` → tools Vitest           |
| 위 경로의 테스트 하나                                          | `vitest run --config tools/vitest.tools.config.mts <tools 기준 경로>`                        |
| `plugins/berry-dev/**` 구조 · manifest                         | 위 테스트 + `claude plugin validate ./plugins/berry-dev --strict`(Claude Code CLI가 있을 때) |
| `plugins/berry-commit/src/**`                                  | `commit-mcp`의 lint · typecheck, `pnpm build:mcp:commit`로 `dist`를 다시 만들어 함께 커밋    |
| `docs/**` · README · AGENTS · 새 폴더(`tools/*` · `plugins/*`) | devhub 카탈로그 테스트(`@berrypjh/devhub`의 test) — 문서 · 도구 등록과 링크를 디스크와 대조  |

- `tools:check`의 tsc는 `tools/{lib,evals,scripts}`만 include한다. `tools/consumer-retrieval`은 import로 닿는 파일만 타입 검사된다([tools/tsconfig.json](../tools/tsconfig.json))
- `.claude/hooks/guard-bash.mjs`는 `plugins/berry-dev/scripts/secret-policy.mjs`를 import한다. 둘 중 하나를 바꾸면 `tools/scripts/claude-harness/guard.test.ts`
- `tools/`는 Nx 프로젝트가 아니다. PR에서는 `pr-check.yml`의 consumer-eval job이 `tools:check`를 돌린다([AGENTS.md](../AGENTS.md))

### 의존 순서

- tools 테스트 일부(카탈로그 drift · 패키지 경계)는 빌드된 libs의 `dist`를 읽는다. 먼저 `pnpm build:libs` (CI 순서와 같다 — [pr-check.yml](../.github/workflows/pr-check.yml) consumer-eval job)
- 앱 · devhub는 libs의 `dist`를 읽는다(`^build`). lib를 고쳤으면 그 lib를 build 한 뒤 앱을 검사한다
- lib 별 검증 순서는 각 lib의 `AGENTS.md`가 적는다(예: [libs/ui-core/AGENTS.md](../libs/ui-core/AGENTS.md))

### eval

- `pnpm eval:consumer:smoke`는 내장 scripted executor로 도는 결정적 확인이다. 모델 호출이 없고 모델 성능이 아니다
- `--replay=<traces.jsonl>`은 수집한 trace를 다시 채점한다
- `pnpm eval:consumer:dev` · `pnpm eval:consumer:test`는 live executor가 필요하다. 이 저장소에는 없어서(`unavailableExecutor`가 throw) replay 없이 돌리면 실패한다 — unsupported로 보고한다([tools/evals/consumer/README.md](../tools/evals/consumer/README.md))

### build 종류

실행 전에 `nx show project <이름> --json`으로 명령을 읽는다.

- `@berrypjh/demo-mobile`의 `build`는 로컬 `expo export`다. `submit`(`eas submit`)은 permissions가 막는다
- EAS 클라우드 빌드(`eas build`) · `pnpm release:npm*` · `nx release` · `npm publish`는 검증이 아니다. 실행하지 않는다 ([settings.json](./settings.json)의 deny · ask)

### AI 세션에서 실행할 수 없는 것

포트 바인딩이 막혀 멈추거나 실패한다. 사용자에게 실행을 요청하고, 결과를 받기 전에는 unsupported로 보고한다.

- dev 서버 · preview · Storybook · local registry — `serve` · `dev` · `start` · `preview` · `storybook` target, `pnpm start` · `pnpm devhub` · `pnpm quality:lab` · `pnpm storybook` · `pnpm local-registry`
- Playwright e2e — `@berrypjh/devhub-e2e` · `@berrypjh/quality-lab-e2e`의 `e2e`, `pnpm storybook:a11y`
- 판정 목록은 [hooks/guard-bash.mjs](./hooks/guard-bash.mjs)의 `PORT_BOUND`다. `pnpm devhub`는 그 목록에 없지만 `nx serve` 별칭이다

## UI

`frontend-quality`가 이 절을 읽는다. 컴포넌트 · prop · 토큰 목록은 두지 않는다 — 패키지 카탈로그가 정답이다.

### 역할

| 경로                                                                      | 역할       | 따를 문서                                                              |
| ------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------- |
| `libs/react-ui` · `libs/react-native-ui` · `libs/devhub-ui`               | maintainer | 각 패키지 `AGENTS.md`                                                  |
| `libs/ui-core`                                                            | UI 아님    | 플랫폼 중립 계약 — [libs/ui-core/AGENTS.md](../libs/ui-core/AGENTS.md) |
| `apps/demo-web` · `apps/demo-mobile` · `apps/quality-lab` · `apps/devhub` | consumer   | 각 앱 `AGENTS.md`의 "소비자처럼 쓴다"                                  |

- 한 작업이 lib와 앱을 함께 고치면 파일마다 역할을 따로 판정한다. lib 수정은 maintainer로, 앱 수정은 consumer로 본다

### consumer 조회

- 각 앱에 설치된 bin이 연결돼 있다 — `@berrypjh/react-ui`를 쓰는 앱은 `berry-react-ui`, `@berrypjh/react-native-ui`를 쓰는 앱은 `berry-react-native-ui` (`pnpm --dir <앱> exec <bin> find <query>`). bin은 lib의 `dist/cli.mjs`다 — lib를 build하지 않았으면 먼저 build한다
- `@berrypjh/devhub-ui`에는 bin이 없다. [libs/devhub-ui/AGENTS.md](../libs/devhub-ui/AGENTS.md)와 공개 export로 확인한다
- 사용 규칙 · 함정은 설치된 패키지의 `agents` export(`dist/AGENTS.md`)다

### locale 과 제품 정책

- 화면 문구 locale 정책 문서가 없다. `ko-ui` rule을 채택하지 않았다([standards-sources.md](../docs/claude-harness/standards-sources.md)) — 어미 · 형식을 강제하지 않는다
- 제품 셸 · 화면 폭 · 최소 터치 크기 · 완료 문구 정책이 없다. demo 앱은 패키지 통합을 확인하는 도구다. 기준이 필요하면 기준 없음으로 보고한다
- 라이브러리 접근성 규칙은 패키지 문서가 정한다 — [libs/react-ui/AGENTS.md](../libs/react-ui/AGENTS.md)의 accessibility · forced-colors, [libs/react-native-ui/AGENTS.consumer.md](../libs/react-native-ui/AGENTS.consumer.md)의 접근 가능한 이름 · 한계

### 확인 수단

| 방식      | 있는 것                                                                                                                                   | 이 세션에서                         |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| 자동      | `@berrypjh/react-ui` test(jsdom · conformance · forced-colors 규칙), `@berrypjh/react-native-ui` test(jest), devhub · quality-lab 앱 test | 실행 가능                           |
| 자동(axe) | `pnpm storybook:a11y` — Storybook을 띄워 axe 검사. PR에서는 `pr-check.yml`의 a11y job                                                     | 포트 — unsupported, CI · 사용자에게 |
| 실제 web  | `@berrypjh/devhub-e2e` · `@berrypjh/quality-lab-e2e` Playwright, Storybook                                                                | 포트 — unsupported, 사용자에게      |
| 실제 RN   | `apps/demo-mobile`을 사람이 기기 · 시뮬레이터에서 본다([apps/demo-mobile/AGENTS.md](../apps/demo-mobile/AGENTS.md))                       | 수단 없음 — unsupported             |
