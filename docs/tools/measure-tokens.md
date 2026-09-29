# measure-tokens

> **한 줄 요약** — 에이전트가 UI 패키지를 파악하려고 README · 타입 선언 · `AGENTS.md` · 카탈로그 같은 파일을 읽을 때 드는 input 토큰 수를, 읽는 파일 조합(시나리오)별로 세어 baseline과 비교하는 도구.

대상 코드: `tools/scripts/measure-tokens/`

- **비교 방식** — 시나리오마다 파일을 이어 붙여 토큰 수를 세고, 첫 시나리오(`baseline`) 대비 증감률(`Δ`) 출력. `−`면 절약, `+`면 증가
- **두 provider** — OpenAI는 tiktoken 로컬 인코딩(키 불필요). Anthropic은 `count_tokens` API(`ANTHROPIC_API_KEY` 필요)
- **등록부 한 벌** — target · 시나리오는 `registry.ts`의 `MEASURE_TARGETS` 하나. 품질 관측 수집기의 context 측정도 같은 등록부 사용([품질 관측 아키텍처](../observability/architecture.md))
- **토큰 카운팅 공유** — 구현은 `tools/lib/token-count.ts`. `tools/evals/consumer`도 같은 모듈 사용

## 사용

```bash
pnpm build:libs                 # 선행: 대상 패키지 dist 필요
pnpm react-ui:measure           # MEASURE_TARGET=react-ui
pnpm react-native-ui:measure    # MEASURE_TARGET=react-native-ui
pnpm ui-core:measure            # MEASURE_TARGET=ui-core
pnpm tokens:measure             # MEASURE_TARGET 미지정 → design-tokens
```

- **실행 파일** — 네 스크립트 모두 `all.ts` 실행. 한 표에 두 provider 칸(`anthropic` · `openai`)과 각 `Δ`
- **Anthropic 칸** — `ANTHROPIC_API_KEY`가 없으면 `—`. 스크립트가 루트 `.env`를 읽음(`--env-file-if-exists=.env`, 예시는 `.env.example`)
- **단일 provider** — `package.json` 스크립트 없음. 직접 호출. `claude.ts`는 키가 없으면 종료

```bash
MEASURE_TARGET=react-ui npx tsx tools/scripts/measure-tokens/openai.ts
MEASURE_TARGET=react-ui npx tsx --env-file-if-exists=.env tools/scripts/measure-tokens/claude.ts
```

| 변수                      | 기본                | 설명                                      |
| ------------------------- | ------------------- | ----------------------------------------- |
| `MEASURE_TARGET`          | `design-tokens`     | `MEASURE_TARGETS`의 key. 모르는 값은 종료 |
| `ANTHROPIC_API_KEY`       | —                   | Anthropic 측정에만 필요                   |
| `MEASURE_ANTHROPIC_MODEL` | `claude-sonnet-4-6` | Anthropic 모델 ID                         |
| `MEASURE_OPENAI_MODEL`    | `gpt-4o`            | tiktoken 인코딩 매핑 대상 모델            |

## target과 시나리오

- **목록의 출처** — `registry.ts`의 `MEASURE_TARGETS`. 현재 target은 `design-tokens` · `ui-core` · `react-ui` · `react-native-ui`
- **시나리오 이름** — 읽는 파일 조합을 나타냄. `baseline`(package.json + README + 타입 선언), `agents-only`(`dist/AGENTS.md`), `tokens-only`(`dist/tokens.json`), `api-catalog-only`(`dist/llm-catalog.json`), `agents+*`(조합) 등
- **내용 구성** — 파일마다 `=== 상대경로 ===` 머리를 붙여 빈 줄로 이어 붙임(`readScenarioFiles`). 토큰 수는 이 구성에 달려 있음
- **읽는 법** — 첫 행이 기준. 같은 target 안에서만 비교. 소스가 바뀌면 값도 바뀌므로 숫자를 문서에 고정하지 않음

## 알려진 제약

- **`design-tokens` · `ui-core` target은 실패** — 두 target의 시나리오가 `dist/AGENTS.md`를 읽지만 두 패키지 build는 그 파일을 만들지 않음
- **원인** — `dist/AGENTS.md`는 `react-ui` · `react-native-ui`의 build(`project.json`)가 `AGENTS.consumer.md`를 복사해 생성. 두 패키지에는 `AGENTS.consumer.md`가 없음
- **실패 범위** — 파일 하나라도 없으면 target 전체가 표 출력 없이 종료

```text
Error: missing file dist/AGENTS.md — build the target package first.
```

- **해결 방법(미적용)** — 해당 패키지에 `AGENTS.consumer.md`와 build 복사 단계 추가, 또는 `registry.ts`에서 그 시나리오 제거

## 정적 측정 vs task 단위 측정

- **여기서 재는 것** — 파일을 통째로 읽었을 때의 정적 토큰 수
- **task 단위** — task 하나가 실제로 소비하는 컨텍스트는 `pnpm eval:consumer:context`가 측정([consumer-eval.md](consumer-eval.md))
- **비교 불가** — 목적이 달라 두 숫자를 직접 비교하지 않음

## target 추가

`registry.ts`의 `MEASURE_TARGETS`에 항목 하나 추가. 형태는 `MeasureTarget`(`{ dir: string; scenarios: Record<string, string[]> }`).

```ts
'my-pkg': {
  dir: 'libs/my-pkg',
  scenarios: {
    baseline: ['package.json', 'README.md', 'dist/index.d.ts'],
    'agents-only': ['dist/AGENTS.md'],
  } as Record<string, string[]>,
},
```

- **첫 시나리오가 기준** — `Δ`는 첫 항목 대비. `baseline`을 맨 앞에 둠
- **파일 경로** — `dir` 기준 상대경로. build가 실제로 만드는 파일만 넣음. 없는 파일은 target 전체 실패
- **등록부 테스트** — `registry.test.ts`가 target과 `dir` 목록을 고정. 추가하면 기대값도 함께 갱신
- **스크립트** — 필요하면 `package.json`에 `MEASURE_TARGET=my-pkg` 스크립트 추가. 없으면 직접 호출

## 구성

| 파일               | 역할                                                                            |
| ------------------ | ------------------------------------------------------------------------------- |
| `registry.ts`      | `MEASURE_TARGETS` 등록부, 파일 이어 붙이기(`readScenarioFiles`), 없는 파일 찾기 |
| `registry.test.ts` | 등록부 · 이어 붙이기 형식 · 없는 파일 메시지 검사                               |
| `shared.ts`        | `MEASURE_TARGET`으로 target 선택, 표 출력 헬퍼                                  |
| `all.ts`           | Anthropic + OpenAI 한 표 측정. `*:measure` 스크립트의 진입점                    |
| `claude.ts`        | Anthropic `count_tokens` 단독 측정                                              |
| `openai.ts`        | OpenAI tiktoken 단독 측정                                                       |

테스트는 `registry.test.ts`. `pnpm tools:check`가 실행.
