# 품질 관측 사용법

> **한 줄 요약** — bundle · context · AI 평가 결과를 Node CLI로 모아 공개 JSON으로 내보내고 DevHub "평가" 섹션(`/evaluation`)에서 보는 절차. 보통은 `pnpm quality:core` · `pnpm quality:eval` 한 줄이면 된다. 모델을 실제로 호출하는 평가는 `pnpm quality:eval:live`(키 · 비용 필요).

- **구조 · 수집기 · 검증 · 제약** — [architecture.md](architecture.md)
- **metric 의미 · 단위 · 비교 조건** — [metrics.md](metrics.md)
- **평가 섹션 작업 규칙** — [devhub rule](../../.claude/rules/devhub.md)
- **모으지 않는 것** — test · lint · typecheck · build 결과(CI가 보고). 접근성은 Storybook test-runner(라이브러리)와 `apps/devhub-e2e/src/a11y.spec.ts`(DevHub 화면)가 검사

**모든 명령은 저장소 root에서 실행.** 하위 디렉터리에서 `nx`를 부르면 project graph 처리 실패(`tools/evals/consumer/fixtures/*`의 이름 없는 package).

## 준비

```bash
pnpm install        # lockfile 그대로. 의존성 추가·갱신은 하지 않는다
pnpm build:libs     # design-tokens · ui-core · react-ui · react-native-ui dist. core 수집이 이 dist 를 잰다
```

- **선행 build** — `quality:collect` · `quality:export`는 먼저 `@berrypjh/observability-contracts`를 build. `nx serve` · `build` · `test`는 `^build`로 contracts · react-ui · devhub-ui를 먼저 build
- **dist 최신화** — core 수집기는 lib를 다시 build하지 않음. dist가 오래되면 오래된 값을 잼

## 한 줄로 수집하기

| DevHub 묶음             | 명령                     | 하는 일                                                                                                       |
| ----------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| 번들 · 컨텍스트         | `pnpm quality:core`      | core 수집 → DevHub로 내보내기                                                                                 |
| 소비자 평가             | `pnpm quality:eval`      | smoke 평가(고정 입력, 외부 호출 없음) → eval 수집 → DevHub로 내보내기                                         |
| 소비자 평가 · 실제 입력 | `pnpm quality:eval:live` | 모델을 실제로 호출하는 live 평가 → eval 수집 → DevHub로 내보내기. 컨텍스트 토큰의 "실제 입력"이 여기서만 생김 |

- **run ID** — `<profile>-<날짜>-<시각>`(이 컴퓨터 시각)으로 자동. 이름을 정하려면 `pnpm quality:core --run-id=<id>`
- **smoke만** — `quality:eval`은 smoke 평가만 돌림. dev · test 평가 결과는 아래 세부 명령으로 가져옴
- **live** — `quality:eval:live --provider=<제공자> --model=<모델>`. 제공자 · 모델은 기본값 없이 늘 고름
  - 기본: smoke 과제 × 모든 variant × trial 1, 과제당 최대 12턴. 주소는 `--base-url`, 한도는 `--context-limit`
  - 실행 전에 첫 메시지를 세어 한도를 넘는 variant는 실행하지 않고 `live-skipped.json`에 이유를 남김
  - 로컬(Ollama)은 컨텍스트를 넘는 입력을 오류 없이 자름. 첫 턴 입력이 추정보다 크게 작으면 실행을 멈추고 이유를 알림 — Ollama를 `OLLAMA_CONTEXT_LENGTH`를 한도 이상으로 해서 띄워야 함

| 제공자   | `--provider` | 키                  | 모델                                     | 기본 한도 | 실행 전 점검                |
| -------- | ------------ | ------------------- | ---------------------------------------- | --------- | --------------------------- |
| Claude   | `claude`     | `ANTHROPIC_API_KEY` | `--model` 필수 (예: `claude-sonnet-5-5`) | 200,000   | count_tokens(무료)로 정확히 |
| OpenAI   | `openai`     | `OPENAI_API_KEY`    | `--model` 필수                           | 128,000   | tiktoken 추정               |
| 로컬 LLM | `local`      | 없음                | `--model` 필수 (예: `qwen3:14b`)         | 32,768    | tiktoken 추정 · 잘림 감지   |

- 도구는 variant가 허용한 capability만(파일 읽기 · 플랫폼 판정 · 심볼 조회 · 토큰 조회 · 파일 쓰기 · 끝내기). `grep-workspace` 도구와 repair 단계는 아직 없음
- 과제 전체는 harness를 `--live --all-tasks`로 돌린 뒤 `quality:collect --profile=eval --from=...`

## 수집 (세부 옵션)

| profile  | 명령                                                                           | 비용                                                                |
| -------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| `static` | `pnpm quality:collect --profile=static --run-id=<id>`                          | 작음 — 파일 · git 읽기. 명령 실행 없음                              |
| `core`   | `pnpm quality:collect --profile=core --run-id=<id>`                            | 중간 — size-limit · treeshake 실행(명령당 15분 제한), token 계산    |
| `eval`   | `pnpm quality:collect --profile=eval --from=tmp/llm-evals/<dir> --run-id=<id>` | 작음 — 이미 만든 eval 산출물만 읽음. harness · executor 재실행 없음 |

- **run ID** — 소문자 kebab-case, 63자 이하. **한 번 쓴 ID는 재사용 불가**(store가 거부). 새로 측정하면 새 ID
- **run state** — 값 하나라도 빠지면 `partial`
- **eval 입력** — `tmp/llm-evals/<dir>`의 `summary.json` · `traces.jsonl` · `routing.json` · `context.json`. 먼저 consumer eval 실행 필요(아래)

### eval 산출물 만들기

| 명령                         | 내용                                           |
| ---------------------------- | ---------------------------------------------- |
| `pnpm eval:consumer:smoke`   | 고정 입력 harness 확인 (`--run-id=pr-smoke`)   |
| `pnpm eval:consumer:dev`     | dev split. executor 설정에 따라 외부 호출 가능 |
| `pnpm eval:consumer:test`    | held-out split. 〃                             |
| `pnpm eval:consumer:routing` | routing만                                      |
| `pnpm eval:consumer:context` | context만                                      |

자세한 옵션은 DevHub 작업 흐름 "소비자 평가"와 [tools](../../tools/README.md).

## report 가져오기

이미 만든 bundle report를 다시 실행하지 않고 core run에 넣는 방법.

```bash
pnpm size --json > tmp/observability/imports/bundle.size-limit.json
pnpm treeshake react-ui cx Box Stack Button TextField --json > tmp/observability/imports/bundle.treeshake.react-ui.json

pnpm quality:collect --profile=core --run-id=<id> --only-imports \
  --import=bundle.size-limit:tmp/observability/imports/bundle.size-limit.json \
  --import=bundle.treeshake.react-ui:tmp/observability/imports/bundle.treeshake.react-ui.json
```

- **`--import=<command-id>:<path>`** — core 명령 ID(`bundle.size-limit` · `bundle.treeshake.react-ui`)와 `tmp/observability/imports/` 안의 경로만 받음. 같은 ID 두 번은 거부
- **`--only-imports`** — 명령을 하나도 실행하지 않음. import하지 않은 bundle은 이유와 함께 `not-run`
- **core 전용** — `static` · `eval`에 `--import` · `--only-imports`를 주면 거부
- **token 측정** — `pnpm tokens:measure`는 API key가 있으면 외부 호출을 하므로 기본으로 쓰지 않음. core는 로컬 tokenizer로 in-process 계산

## export

```bash
pnpm quality:export --run-id=<id>
```

- **출력** — `apps/devhub/public/observability`에 공개 run · 요약 · index
- **걷어내는 것** — raw · `tmp/` · held-out gold · credential 경로 evidence
- **같은 ID** — 공개 run의 metadata가 같을 때만 다시 씀. 다르면 거부

## DevHub에서 보기

```bash
pnpm dev:devhub     # nx serve @berrypjh/devhub → http://localhost:4400/evaluation
```

| 묶음        | 항목            | 경로                            | 내용                                                |
| ----------- | --------------- | ------------------------------- | --------------------------------------------------- |
| 번들        | 번들 budget     | `/evaluation/bundle-budget`     | size-limit 크기 · 한도. `?base=`로 실행 비교        |
| 번들        | 트리셰이킹 진단 | `/evaluation/treeshake`         | 심볼 하나만 import 한 번들의 raw · gzip 크기        |
| 컨텍스트    | 컨텍스트 토큰   | `/evaluation/context-tokens`    | 소비자가 읽는 입력의 토큰 수. `?panel=`로 범위 고름 |
| 소비자 평가 | 성적표          | `/evaluation/eval-scorecard`    | executor 출처 · variant × primary metric            |
| 소비자 평가 | 라우팅          | `/evaluation/eval-routing`      | 플랫폼 판단 정확도 · expected × predicted 표        |
| 소비자 평가 | 검색            | `/evaluation/eval-retrieval`    | required evidence recall · trace 별 hit             |
| 소비자 평가 | 검증            | `/evaluation/eval-verification` | 검증된 성공률 · 거짓 성공률 · kind × status         |

- **항목 목록** — `apps/devhub/src/data/evaluations.ts`. `/evaluation`은 항목 목록, 옆 칸은 고른 실행의 상태 · source · 스냅샷 비교
- **실행 고르기** — `?run=<id>`. 목록에는 그 항목의 영역이 있는 실행만 오고 기본은 그중 마지막. 같은 묶음의 항목으로만 이어 감. 번들 budget만 `?base=<id>`로 고른 실행과 report-only diff
- **명령 없음** — 브라우저는 명령을 실행하지 않음. 명령 버튼은 복사만

## 산출물 위치

전부 gitignore — commit 대상 아님.

| 경로                                | 내용                                                      |
| ----------------------------------- | --------------------------------------------------------- |
| `tmp/observability/runs/<id>/`      | `run.json` · `manifest.json` · `raw/`(원본 report · 입력) |
| `tmp/observability/imports/`        | 가져올 report                                             |
| `tmp/observability/index.json`      | store index                                               |
| `apps/devhub/public/observability/` | 공개 run · 요약 · index                                   |

`pnpm nx build @berrypjh/devhub`은 public 디렉터리를 그대로 `dist/observability`로 복사. **build 결과를 배포하면 로컬 수집 결과도 함께 나감.**
