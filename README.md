# @berrypjh/shared-stack

> **Note**
> GitHub Packages 비공개 배포입니다. 설치 전 `.npmrc` 설정이 필요합니다.

디자인 토큰 하나로 웹(React)과 모바일(React Native)에서 같은 UI를 만드는 컴포넌트 라이브러리입니다.
공통 로직과 토큰을 두 플랫폼이 공유하므로 컴포넌트 API와 시각 언어가 양쪽에서 일치합니다.

## 패키지

| 패키지                                                            | 설명                  |
| ----------------------------------------------------------------- | --------------------- |
| [`@berrypjh/react-ui`](libs/react-ui/README.md)                   | React 웹 컴포넌트     |
| [`@berrypjh/react-native-ui`](libs/react-native-ui/README.md)     | React Native 컴포넌트 |
| [`@berrypjh/eslint-config`](libs/eslint-config/README.md)         | 공유 ESLint 설정      |
| [`@berrypjh/prettier-config`](libs/prettier-config/README.md)     | 공유 Prettier 설정    |
| [`@berrypjh/tsconfig`](libs/tsconfig/README.md)                   | 공유 TypeScript 설정  |
| [`@berrypjh/commitlint-config`](libs/commitlint-config/README.md) | 공유 commitlint 설정  |

`@berrypjh/ui-core`와 `@berrypjh/design-tokens`는 내부 패키지라 직접 설치하지 않습니다.
필요한 토큰과 유틸(`cx`, `getColor`, `createTheme`, `themes`, `Web`, `Native`)은 두 UI 패키지가 전부 re-export합니다.

## 설치

`.npmrc`에 레지스트리와 인증 토큰을 설정합니다.

```
@berrypjh:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

```bash
pnpm add @berrypjh/react-ui         # peer: react ^19, react-dom ^19
pnpm add @berrypjh/react-native-ui  # peer: react ^19, react-native ~0.81.5
```

## 공유 설정 패키지

```bash
pnpm add -D @berrypjh/eslint-config @berrypjh/prettier-config
pnpm add -D @berrypjh/tsconfig @berrypjh/commitlint-config
```

| 패키지                        | 사용                                                                    |
| ----------------------------- | ----------------------------------------------------------------------- |
| `@berrypjh/eslint-config`     | `eslint.config.mjs`에서 `/base` `/nx` `/react` 중 필요한 것 import      |
| `@berrypjh/prettier-config`   | `package.json`의 `"prettier"` 필드에 패키지 이름 지정                   |
| `@berrypjh/tsconfig`          | `tsconfig.json`의 `extends`에 `/base.json` `/library.json` `/next.json` |
| `@berrypjh/commitlint-config` | `commitlint.config.js`에서 `extends`로 지정                             |

## Claude Code 플러그인

`.claude-plugin/marketplace.json`이 이 저장소를 마켓플레이스 `berrypjh`로 노출합니다.
현재 `berry-commit` 플러그인(`/berry-commit:commit-scope` skill + `commit-mcp` MCP 서버)을 배포합니다.

소비하는 저장소의 `.claude/settings.json`에 두 키를 넣으면 팀원 전체가 같은 설정을 공유합니다.

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

설치 후 skill은 `/berry-commit:commit-scope`로 호출합니다.
인자와 메시지 규칙은 [plugins/berry-commit/README.md](plugins/berry-commit/README.md) 참조.

## 개발

이 저장소에 기여하거나 라이브러리를 직접 빌드할 때 필요한 내용입니다.

```bash
pnpm install
pnpm start          # 웹 데모 (React + Vite)
pnpm start:mobile   # 모바일 데모 (Expo)
pnpm storybook      # Storybook
```

### 저장소 구조

```text
libs/
├── ui-core/              # 프레임워크 독립적 공통 로직 (Pure TS, 내부)
├── design-tokens/        # 디자인 토큰 (CSS 변수, Tailwind, RN, 내부)
├── react-ui/             # React 컴포넌트 라이브러리 (Web)
├── react-native-ui/      # React Native 컴포넌트 라이브러리 (Mobile)
├── eslint-config/        # 공유 ESLint 설정
├── prettier-config/      # 공유 Prettier 설정
├── tsconfig/             # 공유 TypeScript 설정
└── commitlint-config/    # 공유 commitlint 설정

apps/
├── demo-web/             # 웹 라이브러리 데모 (React)
├── demo-web-e2e/         # 웹 E2E 테스트 (Playwright)
└── demo-mobile/          # 모바일 라이브러리 데모 (Expo)

plugins/
└── berry-commit/         # Claude Code 플러그인 (commit-scope skill + commit-mcp 서버)

tools/
├── lib/                  # 도구 공용 헬퍼
├── scripts/              # 측정·릴리즈·카탈로그 생성
├── consumer-retrieval/   # 조회 모듈
└── evals/consumer/       # 평가 도구
```

### 명령어

| 명령어               | 설명                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------ |
| `pnpm build`         | 전체 빌드                                                                                  |
| `pnpm build:libs`    | 라이브러리만 빌드 (`design-tokens`, `ui-core`, `react-ui`, `react-native-ui`)              |
| `pnpm tokens:build`  | 디자인 토큰 빌드                                                                           |
| `pnpm test`          | 전체 테스트 실행                                                                           |
| `pnpm lint`          | 전체 린트                                                                                  |
| `pnpm typecheck`     | 전체 타입 체크                                                                             |
| `pnpm release:local` | 로컬 레지스트리로 릴리즈                                                                   |
| `pnpm tools:check`   | `tools/` 타입 체크 + 테스트 (Nx affected가 닿지 않는 영역)                                 |
| `pnpm catalog:gen`   | 소비자 API 카탈로그(`dist/llm-catalog.json`) 생성 — 각 lib build가 자동 호출               |
| `pnpm ui:lookup`     | 플랫폼·심볼·토큰 조회 CLI ([tools/consumer-retrieval](tools/consumer-retrieval/README.md)) |

LLM 평가 도구 명령은 [tools/evals/consumer/README.md](tools/evals/consumer/README.md) 참조.

### 기술 스택

| 분류                 | 기술                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Monorepo & Build** | ![Nx](https://img.shields.io/badge/Nx-143055?style=flat-square&logo=nx&logoColor=white) ![pnpm](https://img.shields.io/badge/pnpm-F69220?style=flat-square&logo=pnpm&logoColor=white)                                                                                                                                                                                                                                                                     |
| **Core**             | ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)                                                                                                                                                                                                                                                                                                                                           |
| **Web Library**      | ![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black) ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white) ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)                                                                                                                                       |
| **Mobile Library**   | ![React Native](https://img.shields.io/badge/React_Native-61DAFB?style=flat-square&logo=react&logoColor=black) ![Expo](https://img.shields.io/badge/Expo-000020?style=flat-square&logo=expo&logoColor=white)                                                                                                                                                                                                                                              |
| **Testing & Docs**   | ![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white) ![Storybook](https://img.shields.io/badge/Storybook-FF4785?style=flat-square&logo=storybook&logoColor=white) ![Chromatic](https://img.shields.io/badge/Chromatic-FC521F?style=flat-square&logo=chromatic&logoColor=white) ![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat-square&logo=github-actions&logoColor=white) |

## 라이선스

MIT
