# 품질 관측 사용법

shared-stack의 bundle · context · eval · 디자인 시스템 · 접근성 수집 결과를 모으고 보여 주는 체계. test와 lint · typecheck · build 결과는 CI가 보고하므로 모으지 않는다. 결과는 DevHub(`apps/devhub`)의 "평가" 섹션에서 본다.

수집과 export는 Node CLI(`tools/scripts/observability`)가 하고, 평가 섹션은 export된 JSON을 `@berrypjh/observability-contracts`로 검증한 뒤에만 표시한다. **브라우저는 명령을 실행하지 않는다.**

| 문서                                         | 내용                  |
| -------------------------------------------- | --------------------- |
| [architecture.md](architecture.md)           | 구조                  |
| [metrics.md](metrics.md)                     | metric 카탈로그       |
| [collectors.md](collectors.md)               | 수집기 · 입력         |
| [verification.md](verification.md)           | 검증 gate · 최근 결과 |
| [limitations.md](limitations.md)             | 알려진 제약           |
| [devhub rule](../../.claude/rules/devhub.md) | 평가 섹션 작업 규칙   |

**모든 명령은 저장소 root에서 실행한다.** 하위 디렉터리에서 `nx`를 부르면 project graph 처리가 실패한다(`tools/evals/consumer/fixtures/*`의 이름 없는 package).

## 준비

```bash
git clone https://github.com/berrypjh/shared-stack.git
cd shared-stack
pnpm install                 # lockfile 그대로. 의존성 추가·갱신은 하지 않는다
pnpm build:libs:web          # design-tokens → ui-core → react-ui dist (DevHub 는 react-ui dist 를 읽는다)
```

- `pnpm install` · `pnpm add` 등은 `.claude/settings.json`에서 확인을 받는 명령이다. 기존 정책을 따른다
- `quality*` script는 먼저 `@berrypjh/observability-contracts`를 build한다. `nx serve` · `build` · `test`는 `^build`로 contracts · react-ui · devhub-ui를 먼저 build한다
- **core 수집의 size-limit · package 시나리오 token은 이미 있는 `dist`를 잰다.** 수집기는 lib를 다시 build하지 않으므로 core 전에 `pnpm build:libs`로 dist를 최신으로 만든다([제약](limitations.md))

## 수집 → export → 보기

| 단계            | 명령                                                                                                                        | 비용                                                                                      |
| --------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 정의만 읽기     | `pnpm quality:collect --profile=static --run-id=<id>`                                                                       | 작음 (파일 · git 읽기, catalog 메모리 재생성)                                             |
| 전체 측정       | `pnpm quality:collect --profile=core --run-id=<id>`                                                                         | 중간 — size-limit · treeshake를 실행(명령당 15분 제한), token은 in-process                |
| report 가져오기 | `pnpm quality:collect --profile=core --run-id=<id> --only-imports --import=<command-id>:tmp/observability/imports/<file>` … | 작음 — 명령을 실행하지 않고 준 report만 읽음. 없는 것은 not-run                           |
| eval 가져오기   | `pnpm quality:collect --profile=eval --from=tmp/llm-evals/<dir> --run-id=<id>`                                              | 작음 — 이미 만든 `summary.json` · `traces.jsonl` · `routing.json` · `context.json`만 읽음 |
| 접근성          | `pnpm quality --base-url=http://localhost:4400 [--run-id=<id>]`                                                             | 중간 — DevHub가 떠 있어야 하고 Playwright chromium + axe로 평가 화면을 검사               |
| 공개            | `pnpm quality:export --run-id=<id>`                                                                                         | 작음 — `apps/devhub/public/observability`에 run · 요약 · index                            |
| 보기            | `pnpm dev:devhub` (= `pnpm nx serve @berrypjh/devhub`)                                                                      | http://localhost:4400/evaluation                                                          |

- **run ID** — 소문자 kebab-case. **한 번 쓴 ID는 다시 쓸 수 없다**(store는 불변, export는 같은 ID의 다른 실행을 거부). 새로 측정하면 새 ID를 쓴다
- **eval 비용** — `pnpm eval:consumer:smoke`는 고정 입력 harness 확인이고, `eval:consumer:dev` · `eval:consumer:test`는 executor 설정에 따라 외부 호출이 생길 수 있다
- **token 측정** — `pnpm tokens:measure`는 API key가 있으면 외부 호출을 하므로 기본으로 쓰지 않는다. core 수집기는 로컬 tokenizer로 센다

### 가져올 report 만들기

| import                     | 만드는 명령 (root)                                                    | 비용             |
| -------------------------- | --------------------------------------------------------------------- | ---------------- |
| `bundle.size-limit` (core) | `pnpm size --json > tmp/observability/imports/bundle.size-limit.json` | 중간 (dist 필요) |

## 비교

실행 목록 · baseline 포인터 · 추세 화면은 없다. 비교는 각 화면(번들 · 접근성)이 `?base=<다른 run id>`로 직접 고른 실행과의 report-only diff뿐이고, 최신 실행을 자동으로 기준 삼지 않는다.

## 산출물 위치

전부 commit하지 않는다.

| 경로                                | 내용                                                                | git            |
| ----------------------------------- | ------------------------------------------------------------------- | -------------- |
| `tmp/observability/runs/<id>/`      | `run.json` · `manifest.json` · `raw/`(원본 report · 입력)           | ignore (`tmp`) |
| `tmp/observability/imports/`        | 가져올 report                                                       | ignore         |
| `tmp/observability/index.json`      | store index                                                         | ignore         |
| `apps/devhub/public/observability/` | 공개 run · 요약 · index (raw · held-out · credential evidence 제외) | ignore         |

`pnpm nx build @berrypjh/devhub`은 public 디렉터리를 그대로 `dist/observability`로 복사한다. **build 결과를 배포하면 로컬 수집 결과도 함께 나간다.**

## 검증

```bash
pnpm nx test @berrypjh/devhub
pnpm nx typecheck @berrypjh/devhub
pnpm nx lint @berrypjh/devhub
pnpm nx build @berrypjh/devhub
pnpm nx typecheck @berrypjh/devhub-e2e
pnpm nx e2e @berrypjh/devhub-e2e     # dev 서버 + chromium. CI 에서는 기존 서버를 재사용하지 않음
pnpm tools:check                     # tools/ (Nx project 아님) typecheck + vitest
```

gate별 의미와 최근 실행 결과는 [verification.md](verification.md).
