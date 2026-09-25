# Quality Lab 사용법

shared-stack의 test · check · bundle · context · eval · 접근성 수집 결과를 보여 주는 private Vite 앱.

수집과 export는 Node CLI(`tools/scripts/observability`)가 하고, 앱은 export된 JSON을 `@berrypjh/observability-contracts`로 검증한 뒤에만 표시한다. **브라우저는 명령을 실행하지 않는다.**

| 문서                                                   | 내용                  |
| ------------------------------------------------------ | --------------------- |
| [architecture.md](architecture.md)                     | 구조                  |
| [metrics.md](metrics.md)                               | metric 카탈로그       |
| [collectors.md](collectors.md)                         | 수집기 · 입력         |
| [verification.md](verification.md)                     | 검증 gate · 최근 결과 |
| [limitations.md](limitations.md)                       | 알려진 제약           |
| [quality-lab rule](../../.claude/rules/quality-lab.md) | 작업 규칙             |

**모든 명령은 저장소 root에서 실행한다.** 하위 디렉터리에서 `nx`를 부르면 project graph 처리가 실패한다(`tools/evals/consumer/fixtures/*`의 이름 없는 package).

## 준비

```bash
git clone https://github.com/berrypjh/shared-stack.git
cd shared-stack
pnpm install                 # lockfile 그대로. 의존성 추가·갱신은 하지 않는다
pnpm build:libs:web          # design-tokens → ui-core → react-ui dist (앱은 react-ui dist 를 읽는다)
```

- `pnpm install` · `pnpm add` 등은 `.claude/settings.json`에서 확인을 받는 명령이다. 기존 정책을 따른다
- `quality*` script는 먼저 `@berrypjh/observability-contracts`를 build한다. `nx serve` · `build` · `test`는 `^build`로 contracts · react-ui를 먼저 build한다
- **core 수집의 size-limit · package 시나리오 token은 이미 있는 `dist`를 잰다.** 수집기는 lib를 다시 build하지 않으므로 core 전에 `pnpm build:libs`로 dist를 최신으로 만든다([제약](limitations.md))

## 수집 → export → 보기

| 단계            | 명령                                                                                                                      | 비용                                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 정의만 읽기     | `pnpm quality:collect --profile=static --run-id=<id>`                                                                     | 작음 (파일 · git 읽기, catalog 메모리 재생성)                                                                                       |
| 전체 측정       | `pnpm quality:collect --profile=core --run-id=<id>`                                                                       | **큼** — 6개 test source · lint · typecheck · contracts build · size-limit · treeshake를 실행(명령당 15분 제한), token은 in-process |
| report 가져오기 | `pnpm quality:collect --profile=core --run-id=<id> --only-imports --import=<command-id>:tmp/quality-lab/imports/<file>` … | 작음 — 명령을 실행하지 않고 준 report만 읽음. 없는 것은 not-run                                                                     |
| eval 가져오기   | `pnpm quality:collect --profile=eval --from=tmp/llm-evals/<dir> --run-id=<id>`                                            | 작음 — 이미 만든 `summary.json` · `traces.jsonl` · `routing.json` · `context.json`만 읽음                                           |
| 접근성          | `pnpm quality --base-url=http://localhost:4300 [--run-id=<id>]`                                                           | 중간 — quality-lab이 떠 있어야 하고 Playwright chromium + axe를 씀                                                                  |
| 공개            | `pnpm quality:export --run-id=<id>`                                                                                       | 작음 — `apps/quality-lab/public/observability`에 run · 요약 · index                                                                 |
| 보기            | `pnpm quality:lab` (= `pnpm nx serve @berrypjh/quality-lab`)                                                              | http://localhost:4300                                                                                                               |

- **run ID** — 소문자 kebab-case. **한 번 쓴 ID는 다시 쓸 수 없다**(store는 불변, export는 같은 ID의 다른 실행을 거부). 새로 측정하면 새 ID를 쓴다
- **eval 비용** — `pnpm eval:consumer:smoke`는 고정 입력 harness 확인이고, `eval:consumer:dev` · `eval:consumer:test`는 executor 설정에 따라 외부 호출이 생길 수 있다
- **token 측정** — `pnpm tokens:measure`는 API key가 있으면 외부 호출을 하므로 기본으로 쓰지 않는다. core 수집기는 로컬 tokenizer로 센다

### 가져올 report 만들기

| import                     | 만드는 명령 (root)                                                                                                                                                                                                       | 비용                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| `test.<project>` (core)    | 해당 project의 vitest · jest를 JSON reporter로 실행해 `tmp/quality-lab/imports/`에 저장                                                                                                                                  | project에 따라 중간~큼 |
| `bundle.size-limit` (core) | `pnpm size --json > tmp/quality-lab/imports/bundle.size-limit.json`                                                                                                                                                      | 중간 (dist 필요)       |
| a11y token · CSS · UI test | `pnpm exec vitest run --root <project> --config <config> --reporter=json --outputFile="$PWD/tmp/quality-lab/imports/a11y/<name>.vitest.json"` (정확한 조합은 `collectors/a11y.ts`의 `REPORT_COMMANDS`, 화면의 복사 버튼) | 중간                   |
| a11y Storybook             | `pnpm build-storybook` 뒤 `QUALITY_A11Y_RESULTS=tmp/quality-lab/imports/a11y/storybook.jsonl pnpm storybook:a11y`                                                                                                        | **큼**                 |
| a11y 수동                  | `tmp/quality-lab/imports/a11y/manual.json`에 관찰 기록                                                                                                                                                                   | 사람                   |

## 기록과 baseline

- **실행 기록 화면**(`/runs`) — index의 요약만 읽고, 고른 실행 상세만 run 전체를 받는다
- **비교** — 명시한 기준만 한다. `/runs?run=<현재>&base=<기준>`. 최신 실행이 자동으로 기준이 되지 않는다
- **baseline 포인터** — `pnpm quality --run-id=<export 한 id>`가 그 run의 profile에 대해 run ID만 가리키는 `baseline.json`을 store · public에 쓴다. 다른 run으로 바꾸려면 `--replace-baseline`. 화면은 포인터를 보여 주고 링크로만 고른다
- **추세** — `/runs?run=<id>&series=<metric id>`. 같은 profile · 비교 조건의 이웃한 점만 잇는다

## 산출물 위치

전부 commit하지 않는다.

| 경로                                          | 내용                                                                         | git            |
| --------------------------------------------- | ---------------------------------------------------------------------------- | -------------- |
| `tmp/quality-lab/runs/<id>/`                  | `run.json` · `manifest.json` · `raw/`(원본 report · 입력)                    | ignore (`tmp`) |
| `tmp/quality-lab/imports/`                    | 가져올 report                                                                | ignore         |
| `tmp/quality-lab/baseline.json`, `index.json` | store index · 포인터                                                         | ignore         |
| `apps/quality-lab/public/observability/`      | 공개 run · 요약 · index · 포인터 (raw · held-out · credential evidence 제외) | ignore         |

`pnpm nx build @berrypjh/quality-lab`은 public 디렉터리를 그대로 `dist/observability`로 복사한다. **build 결과를 배포하면 로컬 수집 결과도 함께 나간다.**

## 검증

```bash
pnpm nx test @berrypjh/quality-lab
pnpm nx typecheck @berrypjh/quality-lab
pnpm nx lint @berrypjh/quality-lab
pnpm nx build @berrypjh/quality-lab
pnpm nx typecheck @berrypjh/quality-lab-e2e
pnpm nx e2e @berrypjh/quality-lab-e2e     # dev 서버 + chromium. CI 에서는 기존 서버를 재사용하지 않음
pnpm tools:check                          # tools/ (Nx project 아님) typecheck + vitest
```

gate별 의미와 최근 실행 결과는 [verification.md](verification.md).
