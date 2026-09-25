# @berrypjh/shared-stack

디자인 토큰 하나로 웹(React)과 모바일(React Native)에서 같은 UI를 만드는 컴포넌트 라이브러리.

공통 로직과 토큰을 두 플랫폼이 함께 쓰므로 컴포넌트 API와 시각 언어가 양쪽에서 같다. 패키지는 **GitHub Packages 비공개 배포**라 설치 전에 `.npmrc` 설정이 필요하다.

## 패키지

| 패키지                                                            | 내용                  |
| ----------------------------------------------------------------- | --------------------- |
| [`@berrypjh/react-ui`](libs/react-ui/README.md)                   | React 웹 컴포넌트     |
| [`@berrypjh/react-native-ui`](libs/react-native-ui/README.md)     | React Native 컴포넌트 |
| [`@berrypjh/devhub-ui`](libs/devhub-ui/README.md)                 | DevHub 공용 화면      |
| [`@berrypjh/eslint-config`](libs/eslint-config/README.md)         | 공유 ESLint 설정      |
| [`@berrypjh/prettier-config`](libs/prettier-config/README.md)     | 공유 Prettier 설정    |
| [`@berrypjh/tsconfig`](libs/tsconfig/README.md)                   | 공유 TypeScript 설정  |
| [`@berrypjh/commitlint-config`](libs/commitlint-config/README.md) | 공유 commitlint 설정  |

`@berrypjh/ui-core`와 `@berrypjh/design-tokens`는 내부 패키지라 직접 설치하지 않는다. 필요한 토큰과 유틸(`cx` · `getColor` · `createTheme` · `themes` · `Web` · `Native`)은 두 UI 패키지가 전부 re-export한다.

## 설치

`.npmrc`에 레지스트리와 인증 토큰을 둔다. **토큰이 없으면 설치가 401로 실패한다.**

```
@berrypjh:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

```bash
pnpm add @berrypjh/react-ui         # peer: react ^19, react-dom ^19
pnpm add @berrypjh/react-native-ui  # peer: react ^19, react-native ~0.85.3
```

공유 설정 패키지는 개발 의존성으로 넣는다.

```bash
pnpm add -D @berrypjh/eslint-config @berrypjh/prettier-config
pnpm add -D @berrypjh/tsconfig @berrypjh/commitlint-config
```

| 패키지                        | 연결 지점                                                                   |
| ----------------------------- | --------------------------------------------------------------------------- |
| `@berrypjh/eslint-config`     | `eslint.config.mjs`에서 `/base` · `/nx` · `/react` 중 필요한 것을 import    |
| `@berrypjh/prettier-config`   | `package.json`의 `"prettier"` 필드에 패키지 이름                            |
| `@berrypjh/tsconfig`          | `tsconfig.json`의 `extends`에 `/base.json` · `/library.json` · `/next.json` |
| `@berrypjh/commitlint-config` | `commitlint.config.js`의 `extends`                                          |

## Claude Code plugin

`.claude-plugin/marketplace.json`이 이 저장소를 마켓플레이스 `berrypjh`로 노출한다.

| plugin         | 내용                                                                       | 문서                                                                         |
| -------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `berry-commit` | `/berry-commit:commit-scope` skill + `commit-mcp` MCP 서버                 | [README](plugins/berry-commit/README.md)                                     |
| `berry-dev`    | 공통 rule 원본과 `sync` · `check` CLI, 검증 · 화면 검수 skill, secret hook | [README](plugins/berry-dev/README.md) · [도입](docs/claude-harness/setup.md) |

팀 전체가 쓰려면 소비 저장소의 `.claude/settings.json`에 두 키를 넣는다.

```json
{
  "extraKnownMarketplaces": {
    "berrypjh": {
      "source": { "source": "github", "repo": "berrypjh/shared-stack" }
    }
  },
  "enabledPlugins": {
    "berry-commit@berrypjh": true
  }
}
```

개인 환경에만 넣으려면:

```bash
claude plugin marketplace add berrypjh/shared-stack
claude plugin install berry-commit@berrypjh
```

## 구조

| 위치                                                | 스택                    | 역할                                                       |
| --------------------------------------------------- | ----------------------- | ---------------------------------------------------------- |
| `libs/design-tokens`                                | TypeScript              | 토큰 원본 · 변환 · 생성물 (CSS 변수 · Tailwind · RN). 내부 |
| `libs/ui-core`                                      | TypeScript              | 플랫폼 중립 계약 · 공통 로직. 내부                         |
| `libs/react-ui`                                     | React · Vite · Tailwind | 웹 컴포넌트 라이브러리                                     |
| `libs/react-native-ui`                              | React Native            | 모바일 컴포넌트 라이브러리                                 |
| `libs/devhub-ui`                                    | React                   | DevHub 셸 · 그림 · markdown · 검색                         |
| `libs/{eslint,prettier,tsconfig,commitlint}-config` | —                       | 공유 설정                                                  |
| `libs/observability-contracts`                      | zod                     | quality-lab 수집기 · 화면이 함께 쓰는 계약. 내부           |
| `apps/demo-web`                                     | React · Vite            | 웹 라이브러리 데모                                         |
| `apps/demo-mobile`                                  | Expo                    | 모바일 라이브러리 데모                                     |
| `apps/devhub`                                       | Vite                    | 저장소 구조 · 근거 탐색기                                  |
| `apps/quality-lab`                                  | Vite                    | 품질 수집 결과 뷰어                                        |
| `apps/*-e2e`                                        | Playwright              | devhub · quality-lab E2E                                   |
| `plugins/`                                          | Node                    | Claude Code plugin (`berry-commit` · `berry-dev`)          |
| `tools/`                                            | TypeScript              | 측정 · 릴리스 · 카탈로그 생성 · 조회 · 평가 · 품질 수집    |

Nx가 작업 orchestration을 담당한다. 테스트는 Vitest · Jest · Playwright, 문서는 Storybook · Chromatic, CI는 GitHub Actions다.

## 시작하기

```bash
pnpm install
pnpm start          # 웹 데모 (React + Vite)
pnpm start:mobile   # 모바일 데모 (Expo)
pnpm storybook      # Storybook
pnpm devhub         # DevHub
pnpm quality:lab    # quality-lab
```

## 검증

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

| 명령                 | 하는 일                                                                          |
| -------------------- | -------------------------------------------------------------------------------- |
| `pnpm build:libs`    | 라이브러리만 빌드 (`design-tokens` · `ui-core` · `react-ui` · `react-native-ui`) |
| `pnpm tokens:build`  | 디자인 토큰 빌드                                                                 |
| `pnpm tools:check`   | `tools/` 타입 검사 + 테스트. **Nx affected가 닿지 않는 영역**                    |
| `pnpm harness:check` | 커밋된 생성 rule이 원본과 같은지                                                 |
| `pnpm catalog:gen`   | 소비자 API 카탈로그(`dist/llm-catalog.json`) 생성. 두 UI lib build가 자동 호출   |
| `pnpm ui:lookup`     | 플랫폼 · 심볼 · 토큰 조회 CLI                                                    |
| `pnpm size`          | 번들 크기 검사 (size-limit). `build:libs`가 먼저 필요                            |
| `pnpm release:local` | 로컬 레지스트리로 릴리스                                                         |

PR에서 무엇이 도는지와 AI 세션에서 실행할 수 없는 것은 [.claude/harness.profile.md](.claude/harness.profile.md).

## 라이선스

MIT
