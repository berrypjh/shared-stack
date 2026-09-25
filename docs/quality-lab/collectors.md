# quality-lab 수집기

`tools/scripts/observability`의 Node CLI. 입력은 저장소 파일 · 등록된 명령 · 이미 만든 report 뿐이고, 결과는 계약(`@berrypjh/observability-contracts`)으로 검증한 뒤 store에 쓴다. 명령 argv는 `registry.ts`에만 있고 CLI는 profile · run ID · import 경로만 고른다. 실행은 `execFile`(shell 없음)이다.

## profile

| profile  | 명령                                                                          | 읽는 것                                                                                                                   | 쓰는 영역                                                                         | 실행                                         |
| -------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------- |
| `static` | `quality:collect --profile=static --run-id=<id>`                              | inventory(test 설정 · workflow · lockfile 해시), design-tokens 산출물 · 문서, package 표면, catalog 메모리 재생성         | `inventory` · `designSystem` · `packageSurfaces`, 등록 명령은 전부 `not-run` 관측 | 명령 실행 없음                               |
| `core`   | `quality:collect --profile=core --run-id=<id> [--import=…]… [--only-imports]` | 등록 명령 출력 또는 import report, `.size-limit.cjs`, token 입력 파일                                                     | `tests` · verification 관측 · `bundles` · `contexts`                              | registry의 test · verification · bundle 명령 |
| `eval`   | `quality:collect --profile=eval --from=tmp/llm-evals/<dir> --run-id=<id>`     | `summary.json` · `traces.jsonl` · `routing.json` · `context.json`, `tools/evals/consumer/baseline/<split>.json` 존재 여부 | `evals`                                                                           | 없음 (harness · executor를 다시 돌리지 않음) |
| `a11y`   | `quality --base-url=http://localhost:<port> [--run-id=<id>]`                  | localhost quality-lab (axe-playwright), `tmp/quality-lab/imports/a11y/*`                                                  | `accessibility`                                                                   | 브라우저 audit만. 등록 명령 없음             |

`quality:collect --profile=a11y`는 거부한다 — a11y는 `pnpm quality`가 모은다.

## core 실행 순서와 snapshot 시점

`collectCore`는 한 run 안에서 다음 순서로 진행한다.

1. verification 명령 (`lint.quality-lab`, `typecheck.*`, `build.observability-contracts`)
2. test source 6개 (`test.observability-contracts` · `test.quality-lab` · `test.react-ui` · `test.react-native-ui` · `test.demo-web` · `test.tools`)
3. `bundle.size-limit` (`pnpm size --json`)
4. `bundle.treeshake.react-ui` (`pnpm treeshake react-ui …`)
5. context — `measure-tokens` 등록부의 package 시나리오와 eval variant context를 로컬 tokenizer로 in-process 계산

**react-ui · react-native-ui · design-tokens를 build하지 않는다.** 3 · 5는 그 시점의 `dist`를 읽는다. dist가 source보다 오래되었어도 수집기는 알 수 없고 source SHA는 현재 HEAD로 기록된다. 그래서 core 전에 `pnpm build:libs`를 끝내야 한다.

하나라도 값이 없으면(`not-run` · `unavailable` · report 없음 · treeshake 실패) run state는 `partial`이다.

## import

`--import=<command-id>:tmp/quality-lab/imports/<file>` — core 명령 ID와 imports 디렉터리 안의 경로만 받는다. `--only-imports`는 명령을 하나도 실행하지 않고, import하지 않은 test · bundle은 `not-run`, verification은 skip이다. test summary의 `execution.status`는 `imported`이고 report의 sha256이 남는다.

import report에는 **그 report를 만든 commit이 기록되지 않는다.** run의 source SHA는 수집 시점의 HEAD다.

| command ID                  | 형식                     |
| --------------------------- | ------------------------ |
| `test.<project>` (vitest)   | vitest `--reporter=json` |
| `test.react-native-ui`      | jest `--json`            |
| `bundle.size-limit`         | `size-limit --json`      |
| `bundle.treeshake.react-ui` | `treeshake --json`       |

## eval import

- `sourceId`는 `eval:<디렉터리 이름>`이다. 다른 디렉터리의 eval은 다른 series로 본다
- 원본 run 조건(`origin`: runId · createdAt · gitSha · executor · model · K · task 수 · trials · conditions)은 수집기 metadata와 섞지 않는다. 원본 SHA와 수집 SHA가 다를 수 있다
- trace 합계가 summary와 어긋나면 trace를 invalid로 두고 `partial-import` notice를 단다
- 변경 파일 내용은 `redacted`, held-out(`test` split) trace의 gold evidence · 발췌는 공개하지 않는다
- evaluator 원래 비교(`originalComparison`): summary의 `comparison`을 warnings까지 옮긴다. 없으면 baseline 파일을 직접 읽어 없음(`no-baseline`) · 깨짐(`corrupt-baseline` + 이유)을 나누고, 있지만 비교를 요청하지 않은 run은 `null` + `baseline-not-requested` notice

## a11y import

| 출처                     | 파일                                                                                           | 없을 때                      |
| ------------------------ | ---------------------------------------------------------------------------------------------- | ---------------------------- |
| Storybook axe            | `tmp/quality-lab/imports/a11y/storybook.jsonl` (+ `libs/react-ui/storybook-static/index.json`) | `not-run`                    |
| token 대비 test          | `design-tokens.vitest.json`                                                                    | check `unknown`/`not-run`    |
| compiled CSS 텍스트 검사 | `react-ui.vitest.json`                                                                         | 〃                           |
| UI test                  | `react-ui` · `demo-web` · `quality-lab` `.vitest.json`                                         | 〃                           |
| 수동 확인                | `manual.json`                                                                                  | `not-run`                    |
| quality-lab audit        | `--base-url`에 연결                                                                            | 연결 불가면 `not-run` + 이유 |

## store · export

```
tmp/quality-lab/
  index.json                 store index (중복 ID·경로 불일치 거부)
  baseline.json              profile 별 baseline run ID 포인터 + history
  runs/<id>/run.json         계약 검증된 artifact
  runs/<id>/manifest.json    파일별 sha256·bytes (읽을 때 대조)
  runs/<id>/raw/             원본 report·입력 (공개하지 않음)
apps/quality-lab/public/observability/
  index.json                 공개 index (run·summary 경로)
  runs/<id>.json             공개 artifact
  runs/<id>.summary.json     summarizeRun 결과 (목록·추세용)
  baseline.json              store 와 같은 포인터
```

- `writeRun`은 staging에 쓰고 manifest를 만든 뒤 rename한다. 같은 ID는 `DuplicateRunError`
- `exportRun`은 raw · `tmp/` · held-out · credential 경로 evidence를 걷어내고 공개 schema로 다시 검증한다. 같은 ID의 공개 run이 있으면 metadata가 같을 때만 다시 쓰고, 다르면 `ExportCollisionError`
- 쓰기는 디렉터리 lock(`.lock`)을 잡는다. lock이 남아 있으면 기다리거나 지우지 않고 실패한다
