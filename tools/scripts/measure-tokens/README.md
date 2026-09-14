# measure-tokens

패키지를 AI 에이전트가 분석할 때 소비하는 input 토큰 수를 시나리오별로 측정한다.
Anthropic·OpenAI 두 모델군을 같은 시나리오로 비교해 문서·카탈로그 변경의 효과를 수치로 검증.

## 측정 대상 (target)

`MEASURE_TARGET` 환경변수로 선택. 기본 `design-tokens` (후방 호환).

| target                 | 패키지                 | 시나리오                                                                                                   |
| ---------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| `design-tokens` (기본) | `libs/design-tokens`   | baseline / with-catalog / catalog-only / agents+catalog                                                    |
| `ui-core`              | `libs/ui-core`         | baseline / with-agents / agents-only / agents+tokens / tokens-only                                         |
| `react-ui`             | `libs/react-ui`        | baseline / with-agents / agents-only / agents+tokens / tokens-only / agents+api-catalog / api-catalog-only |
| `react-native-ui`      | `libs/react-native-ui` | baseline / with-agents / agents-only / agents+tokens / tokens-only / agents+api-catalog / api-catalog-only |

시나리오 이름의 뜻:

| 이름               | 읽는 파일                                        |
| ------------------ | ------------------------------------------------ |
| `baseline`         | package.json + README + 번들 declaration         |
| `with-agents`      | package.json + `dist/AGENTS.md`                  |
| `agents-only`      | `dist/AGENTS.md`                                 |
| `tokens-only`      | `dist/tokens.json` (토큰 인벤토리)               |
| `api-catalog-only` | `dist/llm-catalog.json` (생성된 public API 사실) |
| `agents+*`         | 위 둘의 조합                                     |

## ⚠️ 알려진 제약

`design-tokens`와 `ui-core` target은 **현재 실패한다.** 두 시나리오 모두 `dist/AGENTS.md`를
읽는데, 그 파일을 만드는 단계가 없기 때문이다 — `dist/AGENTS.md`는 `react-ui`/`react-native-ui`
build가 각자의 `AGENTS.consumer.md`를 복사해 만들고, 두 private 패키지에는 소비자 문서 자체가 없다.

```
Error: missing file dist/AGENTS.md — build the target package first.
```

고치려면 둘 중 하나가 필요하다: 해당 패키지에 `AGENTS.consumer.md`를 두고 build에 복사 단계를
추가하거나, `shared.ts`에서 그 시나리오를 빼는 것. 어느 쪽도 아직 하지 않았다.

`react-ui` / `react-native-ui` target은 정상 동작한다.

## 스크립트

| 명령                           | 측정 방식          | target          |
| ------------------------------ | ------------------ | --------------- |
| `pnpm tokens:measure`          | Anthropic + OpenAI | design-tokens   |
| `pnpm ui-core:measure`         | Anthropic + OpenAI | ui-core         |
| `pnpm react-ui:measure`        | Anthropic + OpenAI | react-ui        |
| `pnpm react-native-ui:measure` | Anthropic + OpenAI | react-native-ui |

네 스크립트 모두 `all.ts`(두 provider 동시)를 실행한다. Anthropic 칸은 `ANTHROPIC_API_KEY`가
있을 때만 채워지고, 없으면 `—`로 표시된다.

단일 provider 스크립트는 `package.json`에 등록되어 있지 않다. 필요하면 직접 호출한다:

```bash
MEASURE_TARGET=react-ui pnpm exec tsx tools/scripts/measure-tokens/openai.ts   # OpenAI 단독
MEASURE_TARGET=react-ui pnpm exec tsx tools/scripts/measure-tokens/claude.ts   # Anthropic 단독
```

## 사용

```bash
# 선행: 대상 패키지 dist 필요 (declaration·tokens.json·llm-catalog.json)
pnpm build:libs

# 한 번만: ANTHROPIC_API_KEY 설정 (선택)
cp .env.example .env

pnpm react-ui:measure
pnpm react-native-ui:measure
```

## 환경변수

| 변수                      | 기본                | 설명                                                         |
| ------------------------- | ------------------- | ------------------------------------------------------------ |
| `MEASURE_TARGET`          | `design-tokens`     | `design-tokens` / `ui-core` / `react-ui` / `react-native-ui` |
| `ANTHROPIC_API_KEY`       | —                   | Anthropic 측정에만 필요. 없으면 그 칸은 `—`                  |
| `MEASURE_ANTHROPIC_MODEL` | `claude-sonnet-4-6` | Anthropic 모델 ID                                            |
| `MEASURE_OPENAI_MODEL`    | `gpt-4o`            | OpenAI 모델 ID (tiktoken 인코딩 매핑)                        |

## 출력 예시

실측값이며 소스가 바뀌면 달라진다.

react-ui:

```
target:   react-ui
provider: OpenAI gpt-4o (tiktoken local)

scenario            files      chars     tokens        Δ
--------------------------------------------------------
baseline                3    145,381     46,895        —
with-agents             2      6,279      2,036   −95.7%
agents-only             1      5,491      1,779   −96.2%
agents+tokens           2     53,422     18,069   −61.5%
tokens-only             1     47,929     16,290   −65.3%
agents+api-catalog      2     39,708     10,612   −77.4%
api-catalog-only        1     34,215      8,833   −81.2%
```

react-native-ui:

```
target:   react-native-ui
provider: OpenAI gpt-4o (tiktoken local)

scenario            files      chars     tokens        Δ
--------------------------------------------------------
baseline                3    144,486     47,106        —
agents-only             1      5,237      1,695   −96.4%
agents+api-catalog      2     14,535      4,293   −90.9%
api-catalog-only        1      9,296      2,598   −94.5%
```

`Δ`는 baseline 대비 증감률. `−`면 토큰 절약, `+`면 증가.

## 디렉토리

```
measure-tokens/
  README.md       이 문서
  shared.ts       타깃 등록부·시나리오·읽기 헬퍼·포맷 함수
  all.ts          Anthropic + OpenAI 동시 측정 (단일 표)
  claude.ts       Anthropic count_tokens API 호출
  openai.ts       OpenAI tiktoken 로컬 인코딩
```

토큰 카운팅 구현은 `tools/lib/token-count.ts` 하나를 공유한다. `tools/evals/consumer`도
같은 모듈을 쓴다 — 중복 구현 없음.

## 정적 측정 vs task 단위 측정

여기서 재는 것은 **파일을 통째로 읽었을 때의 정적 토큰 수**다.
실제 task 하나가 소비하는 컨텍스트는 `pnpm eval:consumer:context`가 따로 잰다
(`tools/evals/consumer` 참조). 두 숫자는 목적이 달라 직접 비교하지 않는다.

## 새 패키지 추가

`shared.ts`의 `TARGETS` 객체에 항목 한 개 추가:

```ts
'my-pkg': {
  pkg: path.resolve('libs/my-pkg'),
  scenarios: {
    baseline: ['package.json', 'README.md', 'dist/index.d.ts'],
    'with-something': [...],
  },
},
```

시나리오가 참조하는 파일은 **실제로 build가 만드는 것**이어야 한다. 없는 파일을 넣으면
그 target 전체가 실패한다 (위 "알려진 제약" 참조).

`package.json` 스크립트도 추가 (또는 `MEASURE_TARGET=my-pkg`로 직접 호출).
