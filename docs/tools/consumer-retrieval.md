# consumer-retrieval

> **한 줄 요약** — 에이전트가 `@berrypjh` UI 패키지를 쓸 때, 소스나 전체 타입 선언을 통째로 읽지 않고 **플랫폼 → 패키지 → 심볼 → 토큰** 순으로 필요한 것만 찾아 주는 결정적 조회 도구.

대상 코드: `tools/consumer-retrieval/`

```text
Task → Platform → Package → Symbol (API) / Token → Source (마지막)
```

- **판정 근거** — 관측 가능한 근거와 문자열 매칭뿐. LLM · embedding · vector 검색 없음 — 같은 입력이면 같은 결과
- **모르면 모른다고 함** — 없는 심볼은 `not-found`. 후보를 지어내지 않음
- **MCP 도구 없음** — 패키지 동봉 CLI로 제공. 이유와 다시 검토할 조건은 [기록](../records/2026-09-04-no-ui-mcp.md)

## 쓰는 곳

같은 순수 함수를 세 곳이 나눠 씀. 조회 구현은 한 벌.

| 쓰는 곳                     | 진입점           | 읽는 데이터                                             |
| --------------------------- | ---------------- | ------------------------------------------------------- |
| 소비자 에이전트 · 사람      | `package-cli.ts` | 설치된 패키지의 `dist/llm-catalog.json` · `tokens.json` |
| 이 저장소의 개발 · 에이전트 | `cli.ts`         | 저장소의 빌드된 카탈로그(`repo-source.ts`)              |
| 소비자 평가 harness         | `platform.ts`    | 평가 task의 prompt · 의존성 · 파일 경로(플랫폼 판정만)  |

## 소비자 CLI

react-ui · react-native-ui build가 `package-cli.ts`를 `dist/cli.mjs`로 묶어 함께 배포. bin 이름은 `berry-react-ui` · `berry-react-native-ui`.

```bash
npx @berrypjh/react-ui summary                 # 패키지 지형
npx @berrypjh/react-ui find button             # 심볼 후보
npx @berrypjh/react-ui api Button [--signature] # 심볼 하나의 prop 계약
npx @berrypjh/react-ui token color.primary [--limit=N]
```

- **데이터 위치** — 자기 자신과 같은 `dist/`에서 읽음. node_modules 레이아웃(pnpm 중첩 · yarn PnP · 호이스팅)에 의존하지 않음
- **경로 검사** — 저장소 절대 경로가 번들에 섞이지 않는지 `package-cli.test.ts`가 검사
- **서브패스** — 같은 파일을 `exports`의 `./catalog` · `./tokens` · `./agents`로도 가리킴. 하드코딩 경로 대신 `require.resolve('@berrypjh/react-ui/catalog')` 같은 Node 해석을 씀

## 저장소 CLI

JSON을 출력하는 `pnpm ui:lookup`. 저장소의 빌드된 카탈로그를 읽으므로 라이브러리 build가 먼저 필요.

```bash
pnpm ui:lookup --platform --prompt="RN 화면에 Box 추가" --deps=@berrypjh/react-native-ui
pnpm ui:lookup --summary --package=@berrypjh/react-ui
pnpm ui:lookup --discover=search --package=@berrypjh/react-ui
pnpm ui:lookup --symbol=Button --package=@berrypjh/react-ui --detail=signature
pnpm ui:lookup --token=color.primary --limit=10
```

## 조회 순서

싼 것부터 비싼 것으로 내려감. 위 단계로 답이 나오면 아래로 가지 않음.

| 레벨 | 읽는 것                                | 소비자 CLI |
| ---- | -------------------------------------- | ---------- |
| L0   | 패키지 지형(심볼 개수 · 컴포넌트 이름) | `summary`  |
| L1   | 작은 후보 목록                         | `find`     |
| L2   | 심볼 하나의 계약                       | `api`      |
| L3   | 표적 토큰 · 타입                       | `token`    |
| L4   | 소스 직접 읽기 — 마지막 수단           | 없음       |

- **L4 허용 조건** — L2가 `not-found`로 끝났거나, 질문 자체가 구현 · 디버깅일 때만(`canUseSourceFallback`)
- **강제 방식** — `levels.ts`는 정책 정의와 테스트뿐. 두 CLI와 평가 harness는 import하지 않음. 소비자 에이전트가 이 순서를 따르게 하는 것은 패키지의 `AGENTS.consumer.md`(`dist/AGENTS.md`)의 "찾는 순서" 절

## 심볼 · 토큰 조회

- **심볼 매칭** — `exact` → `case-insensitive` → `normalized` → `lexical`(부분 문자열) 4단계. 앞 단계에서 맞으면 멈춤(`catalog.ts`)
- **토큰 조회** — 경로가 정확히 맞으면 `exact`. 아니면 그 아래 경로를 모아 `category`(카테고리 이름일 때) 또는 `prefix`, 없으면 `none`. 결과가 많으면 더 긴 prefix를 제안(`tokens.ts`)

## 플랫폼 판정

근거 우선순위(`platform.ts`).

1. 설치된 UI package(`dependencies`) — 프로젝트가 **할 수 있는** 것
2. 명시적 task wording — 사용자가 **요구한** 것
3. target file 경로
4. project source tree

- **설치 상태 우선** — 1이 요구를 제한
- **충돌 시** — 요구가 설치 상태와 충돌하면 한쪽을 고르지 않고 `ambiguous`. 평가의 canonical class로는 `null`(라우팅 거부), 나머지(`web` · `react-native` · `both` · `none`)는 그대로(`types.ts`의 `toCanonical`)
- **확률 미사용** — 보정되지 않은 확률 대신 `high` · `medium` · `low`와 근거 목록만 출력
- **패키지 라우팅** — 판정 결과를 공개 패키지로 바꾸고, 내부 패키지(`ui-core` · `design-tokens`)는 금지로 표시(`packages.ts`)

## 구성

| 파일             | 역할                                                                |
| ---------------- | ------------------------------------------------------------------- |
| `platform.ts`    | 근거 기반 플랫폼 판정                                               |
| `packages.ts`    | 플랫폼 → 공개 패키지, 내부 패키지 금지                              |
| `catalog.ts`     | 카탈로그 `discover` · `getApi` · `packageSummary`. 파일 시스템 모름 |
| `tokens.ts`      | `tokens.json` exact · prefix · category 조회                        |
| `levels.ts`      | L0~L4 정의, 조회 기록(telemetry), L4 허용 정책                      |
| `types.ts`       | 플랫폼 class · 근거 · 신뢰도 타입                                   |
| `repo-source.ts` | 저장소에서 카탈로그 · 토큰 읽기                                     |
| `cli.ts`         | 저장소 CLI(`pnpm ui:lookup`)                                        |
| `package-cli.ts` | 패키지 동봉 CLI(`dist/cli.mjs`)                                     |
| `index.ts`       | 위 모듈 재노출                                                      |

테스트는 같은 폴더의 `*.test.ts`. `pnpm tools:check`가 실행.
