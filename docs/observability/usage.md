# 품질 관측 사용법

> **한 줄 요약** — bundle · context · AI 평가 결과를 Node CLI로 모아(`quality:collect`) 공개 JSON으로 내보내고(`quality:export`) DevHub "평가" 섹션(`/evaluation`)에서 보는 절차.

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

## 수집

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

| 화면    | 경로                  | 내용                                                     |
| ------- | --------------------- | -------------------------------------------------------- |
| 개요    | `/evaluation`         | 실행 하나의 번들 · 컨텍스트 · 평가를 독립 카드로         |
| 번들    | `/evaluation/bundles` | size-limit budget · treeshake 진단. `?base=`로 실행 비교 |
| AI 평가 | `/evaluation/ai`      | eval metric · 분자 · 분모 · n · executor 출처            |

- **실행 고르기** — `?run=<id>`. 번들 화면만 `?base=<id>`로 고른 실행과 report-only diff
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
