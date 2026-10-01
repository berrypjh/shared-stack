# tools

저장소를 측정 · 검사 · 릴리스하는 Node 스크립트 모음. Nx 프로젝트가 아니라서 `nx affected`에 걸리지 않고, 검사는 `pnpm tools:check`로 따로 돌린다.

## 구성

| 위치                                 | 내용                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------ |
| `consumer-retrieval/`                | 플랫폼 → 패키지 → 심볼 → 토큰으로 좁히는 결정적 조회. UI 패키지의 CLI로도 배포 |
| `evals/consumer/`                    | 소비자 평가 harness — dataset · variant · grader · 검증 · 보고                 |
| `lib/`                               | 토큰 수 계산 · `exports` 해석 같은 공용 헬퍼                                   |
| `scripts/generate-consumer-catalog/` | 빌드된 선언으로 UI 패키지의 `dist/llm-catalog.json` 생성                       |
| `scripts/measure-tokens/`            | 에이전트가 패키지 파일을 읽을 때 드는 input 토큰 측정                          |
| `scripts/treeshake/`                 | 심볼 몇 개만 import한 번들과 전체 export 번들의 byte 비교                      |
| `scripts/observability/`             | 품질 관측 수집 · export. DevHub "평가"가 읽는다                                |
| `scripts/release/`                   | 버전 · changelog · 배포                                                        |
| `scripts/claude-harness/`            | `plugins/berry-dev` 계약 테스트 — sync · check, 생성 rule, secret hook, 구조   |
| `scripts/build-react-ui-css.mjs`     | react-ui SCSS → `dist/index.css`                                               |
| `scripts/eas-build-post-install.mjs` | demo-mobile EAS 빌드의 설치 후 단계                                            |

## 사용

대부분 빌드된 라이브러리를 읽으므로 먼저 `pnpm build:libs`를 돌린다.

| 명령                                                                                                      | 하는 일                                                                                                                          |
| --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm ui:lookup`                                                                                          | 플랫폼 · 심볼 · 토큰 조회                                                                                                        |
| `pnpm catalog:gen`                                                                                        | 소비자 API 카탈로그 생성. 두 UI 패키지 build가 자동 호출                                                                         |
| `pnpm eval:consumer:context` · `pnpm eval:consumer:routing`                                               | executor 없이 컨텍스트 · routing만 측정                                                                                          |
| `pnpm eval:consumer:smoke`                                                                                | 모델 호출 없는 결정적 smoke (PR CI)                                                                                              |
| `pnpm eval:consumer:dev` · `pnpm eval:consumer:test`                                                      | 전체 평가. `--live --provider=...`(Claude · OpenAI · 로컬) 또는 `--replay=<traces.jsonl>`이 필요                                 |
| `pnpm react-ui:measure` · `pnpm react-native-ui:measure` · `pnpm ui-core:measure` · `pnpm tokens:measure` | 토큰 측정                                                                                                                        |
| `pnpm treeshake <target> [symbol...]`                                                                     | tree-shaking 진단                                                                                                                |
| `pnpm quality:core` · `pnpm quality:eval` · `pnpm quality:eval:live`                                      | 품질 관측 수집 → DevHub로 내보내기 한 번에 (run id 자동). `:live`는 모델을 실제로 호출 (`--provider` 로 claude · openai · local) |
| `pnpm quality:collect` · `pnpm quality:export`                                                            | 수집 · 내보내기를 옵션과 함께 따로                                                                                               |
| `pnpm release:local`                                                                                      | 로컬 레지스트리로 릴리스                                                                                                         |

Anthropic 토큰 수는 `ANTHROPIC_API_KEY`가 있을 때만 잰다. 측정 스크립트가 루트 `.env`를 읽는다(예시는 `.env.example`).

## 검사

```bash
pnpm tools:check   # observability-contracts build → tsc -p tools/tsconfig.json → vitest
pnpm harness:test  # berry-dev 계약 테스트(scripts/claude-harness)만
```

테스트는 각 폴더의 `*.test.ts`이고 설정은 `vitest.tools.config.mts`다. PR에서는 `pr-check.yml`의 consumer-eval job이 돌린다.

## 더 보기

단계별 동작 · 옵션 · 알려진 제약은 DevHub의 **작업 흐름**(`pnpm dev:devhub`)에 있다 — 소비자 조회 · 토큰 측정 · 트리셰이킹 진단 · 소비자 평가. 품질 관측은 [docs/observability](../docs/observability/usage.md).
