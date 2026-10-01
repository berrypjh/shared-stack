# @berrypjh/shared-stack

디자인 토큰 하나로 웹(React)과 모바일(React Native)에서 같은 UI를 만드는 컴포넌트 라이브러리. 두 플랫폼이 공통 로직과 토큰을 함께 써서 컴포넌트 API와 시각 언어가 같다.

## 패키지

| 패키지                                                                 | 내용                                |
| ---------------------------------------------------------------------- | ----------------------------------- |
| [`@berrypjh/react-ui`](libs/react-ui/README.md)                        | React 웹 컴포넌트                   |
| [`@berrypjh/react-native-ui`](libs/react-native-ui/README.md)          | React Native 컴포넌트               |
| [`@berrypjh/devhub-ui`](libs/devhub-ui/README.md)                      | DevHub 공용 화면                    |
| `@berrypjh/{eslint,prettier,commitlint}-config` · `@berrypjh/tsconfig` | 공유 개발 설정 — [연결 지점](#설치) |

`@berrypjh/ui-core`와 `@berrypjh/design-tokens`는 내부 패키지라 직접 설치하지 않는다. 토큰과 유틸(`cx` · `getColor` · `createTheme` · `themes` · `Web` · `Native`)은 두 UI 패키지가 re-export한다.

## 설치

**GitHub Packages 비공개 배포**라 `.npmrc`에 레지스트리와 인증 토큰이 필요하다. 토큰이 없으면 설치가 401로 실패한다.

```
@berrypjh:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

```bash
pnpm add @berrypjh/react-ui         # peer: react ^19, react-dom ^19
pnpm add @berrypjh/react-native-ui  # peer: react ^19, react-native ~0.85.3
pnpm add -D @berrypjh/eslint-config @berrypjh/prettier-config @berrypjh/tsconfig @berrypjh/commitlint-config
```

| 공유 설정                                                         | 연결 지점                                                                   |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [`@berrypjh/eslint-config`](libs/eslint-config/README.md)         | `eslint.config.mjs`에서 `/base` · `/nx` · `/react` 중 필요한 것을 import    |
| [`@berrypjh/prettier-config`](libs/prettier-config/README.md)     | `package.json`의 `"prettier"` 필드에 패키지 이름                            |
| [`@berrypjh/tsconfig`](libs/tsconfig/README.md)                   | `tsconfig.json`의 `extends`에 `/base.json` · `/library.json` · `/next.json` |
| [`@berrypjh/commitlint-config`](libs/commitlint-config/README.md) | `commitlint.config.js`의 `extends`                                          |

## Claude Code plugin

`.claude-plugin/marketplace.json`이 이 저장소를 마켓플레이스 `berrypjh`로 노출한다. 설치 방법은 각 README에 있다.

| plugin                                           | 내용                                                                       |
| ------------------------------------------------ | -------------------------------------------------------------------------- |
| [`berry-dev`](plugins/berry-dev/README.md)       | 공통 rule 원본과 `sync` · `check` CLI, 검증 · 화면 검수 skill, secret hook |
| [`berry-commit`](plugins/berry-commit/README.md) | `/berry-commit:commit-scope` skill + `commit-mcp` MCP 서버                 |

## 구조

```
libs/
├── design-tokens            토큰 원본 · 변환 · 생성물 (내부)
├── ui-core                  플랫폼 중립 prop 계약 · 토큰 facade (내부)
├── react-ui                 웹 컴포넌트 라이브러리
├── react-native-ui          모바일 컴포넌트 라이브러리
├── devhub-ui                DevHub 셸 · 그림 · 차트 · 표 · markdown · 검색
├── observability-contracts  품질 관측 수집기 · DevHub 평가 화면의 계약, zod (내부)
└── *-config · tsconfig      공유 개발 설정
apps/
├── demo-web                 웹 데모 (Vite)
├── demo-mobile              모바일 데모 (Expo)
├── devhub                   저장소 구조 · 근거 탐색기 · 품질 평가 화면
└── devhub-e2e               DevHub E2E (Playwright)
plugins/
├── berry-dev                Claude Code plugin — 공통 rule · 검증 skill
└── berry-commit             Claude Code plugin — scope별 커밋
tools/                       측정 · 릴리스 · 카탈로그 생성 · 조회 · 평가 · 품질 수집
docs/                        품질 관측 · 개발 기록
```

## 개발

```bash
pnpm install
pnpm start          # demo-web — http://localhost:4200
pnpm start:mobile   # demo-mobile — QR로 기기 연결, 또는 i · a로 시뮬레이터
pnpm storybook      # Storybook
pnpm dev:devhub     # DevHub (평가 화면 포함)
```

### DevHub 평가 데이터

"평가"에 보일 데이터는 커밋되지 않아 로컬에서 만든다.

```bash
pnpm quality:core                                          # 번들 · 컨텍스트
pnpm quality:eval                                          # 소비자 평가 — 모델 없이 평가 도구만 확인
pnpm quality:eval:live --provider=local --model=qwen3:14b  # 소비자 평가 — 모델로 실제로 (claude · openai · local)
```

## 검증

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm build:libs      # 라이브러리만 빌드 (design-tokens · ui-core · react-ui · react-native-ui · devhub-ui)
pnpm tokens:build    # 디자인 토큰 빌드
pnpm tools:check     # tools/ 타입 검사 + 테스트 — Nx affected가 닿지 않는 영역
pnpm harness:check   # 커밋된 생성 rule이 원본과 같은지
pnpm size            # 번들 크기 검사 (size-limit). build:libs가 먼저 필요
pnpm release:local   # 로컬 레지스트리로 릴리스
```

## 라이선스

MIT
