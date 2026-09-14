# consumer-retrieval

Consumer 관점 retrieval을 넓은 것에서 좁은 것으로 내려가게 만드는 결정적 resolver 모음.

```text
Task → Platform → Package → Component → Exact API / Token → Source (마지막)
```

Router LLM도, embedding도, vector DB도 쓰지 않는다. 관측 가능한 근거와 문자열 매칭뿐이다.

## 구성

| 파일          | 역할                                                                     |
| ------------- | ------------------------------------------------------------------------ |
| `platform.ts` | 근거 기반 platform 판정 (`web`/`react-native`/`both`/`none`/`ambiguous`) |
| `packages.ts` | platform → public package, 그리고 금지 package                           |
| `catalog.ts`  | `llm-catalog.json`에 대한 `discover` / `getApi` / `packageSummary`       |
| `tokens.ts`   | `tokens.json`에 대한 exact / prefix / category 조회                      |
| `levels.ts`   | L0~L4 레벨 정의, retrieval telemetry, source fallback 정책               |
| `cli.ts`      | Bash에서 쓰는 JSON 출력 CLI (`pnpm ui:lookup`)                           |

## CLI

```bash
pnpm ui:lookup --platform --prompt="RN 화면에 Box 추가" --deps=@berrypjh/react-native-ui
pnpm ui:lookup --summary  --package=@berrypjh/react-ui
pnpm ui:lookup --discover=search --package=@berrypjh/react-ui
pnpm ui:lookup --symbol=Button --package=@berrypjh/react-ui --detail=signature
pnpm ui:lookup --token=color.primary --limit=10
```

## 배포되는 CLI

`package-cli.ts`는 각 패키지의 build에서 `dist/cli.mjs`로 번들되어 npm에 함께 나간다.

```bash
npx @berrypjh/react-ui summary
npx @berrypjh/react-ui find button
npx @berrypjh/react-ui api Button [--signature]
npx @berrypjh/react-ui token color.primary [--limit=N]
```

- 데이터 파일을 **자기 자신과 같은 `dist/`에서** 읽는다. node_modules 레이아웃
  (pnpm 중첩·yarn PnP·호이스팅)에 의존하지 않는다
- 조회 로직은 `catalog.ts` / `tokens.ts`의 순수 함수를 그대로 번들한다 —
  `pnpm ui:lookup`과 같은 구현이고, 구현이 두 벌이 되지 않는다
- 저장소 절대 경로가 번들에 섞이지 않는지 `package-cli.test.ts`가 검사한다

같은 파일을 `exports` 서브패스로도 가리킨다 — 하드코딩 경로 대신 Node 해석을 쓰라는 뜻이다.

```js
require.resolve('@berrypjh/react-ui/catalog'); // → .../dist/llm-catalog.json
require.resolve('@berrypjh/react-ui/agents'); //  → .../dist/AGENTS.md
```

## Platform 근거 우선순위

1. 설치된 UI package (`dependencies`) — 프로젝트가 **할 수 있는** 것
2. 명시적 task wording — 사용자가 **요구한** 것
3. target file 경로
4. project source tree

1이 요구를 제한한다. 요구가 설치 상태와 충돌하면 조용히 한쪽을 고르지 않고 `ambiguous`를
반환하고, canonical class는 `null`로 남긴다 — resolver가 라우팅을 거부한다는 뜻이다.

보정되지 않은 확률(`confidence: 0.98`)을 쓰지 않는다. `high`/`medium`/`low` enum과
근거 목록만 낸다.

## 진단 class vs eval class

| 진단 (`platform`) | eval canonical (`canonical`) |
| ----------------- | ---------------------------- |
| `web`             | `web`                        |
| `react-native`    | `react-native`               |
| `both`            | `both`                       |
| `none`            | `none`                       |
| `ambiguous`       | `null` (라우팅 거부)         |

## Retrieval level

```text
L0 package summary      패키지 지형 (심볼 개수 · 컴포넌트 이름)
L1 symbol candidates    작은 후보 목록
L2 exact symbol api     심볼 하나의 계약
L3 related token / type 표적 토큰 조회
L4 source fallback      마지막 수단
```

L4는 L2가 `not-found`로 끝났거나, 질문 자체가 구현/디버깅일 때만 허용한다
(`canUseSourceFallback`).

## MCP를 만들지 않은 이유

`plugins/berry-commit`은 commit 도메인이다. UI retrieval을 섞지 않았고, 별도 UI plugin도
이번 단계에서는 만들지 않았다. 근거:

1. **효과를 측정할 수 없다.** live executor가 아직 없어서 MCP tool이 retrieval을
   개선하는지 보일 방법이 없다. 검증되지 않은 인프라를 먼저 만들지 않는다.
2. **D3의 이득은 이미 초기 컨텍스트에서 나온다.** full `.d.ts`와 full `tokens.json`을
   빼고 카탈로그를 넣는 것만으로 컨텍스트가 크게 줄었다 (`pnpm eval:consumer:context`).
   이건 tool surface가 아니라 "무엇을 읽히는가"의 문제다.
3. **소비자 배포 경로가 아직 미해결이다.** 소비자 repo에서는 이 디렉터리가 없고
   `node_modules/@berrypjh/*/dist/{llm-catalog,tokens}.json`만 있다. plugin이 그 경로를
   찾아내는 로직은 별도 작업이고, 현재 eval harness가 그 경로를 검증하지 않는다.
4. 지금 필요한 것은 Bash에서 부를 수 있는 CLI로 충분하다.

**MCP를 정당화할 증거**: live executor 실행에서 D3 agent가 안내에도 불구하고
full `tokens.json`이나 full catalog를 반복해서 읽어 들이는 것이 관측될 때.
그때 `plugins/berry-ui`를 별도 도메인으로 만든다 — `berry-commit`에 섞지 않는다.
