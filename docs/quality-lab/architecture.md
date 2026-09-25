# Quality Lab 아키텍처

shared-stack의 test · check · bundle · context 신호를 **실제 수집 결과로만** 보여준다. 숫자를 지어내지 않고, 측정하지 못한 값은 0이 아니라 이유가 있는 빈 값으로 남긴다.

## 경계

```
libs/observability-contracts   zod 계약 한 벌 (React·Node·DOM 의존 없음)
        ▲                ▲
        │                │ 같은 schema 로 검증
tools/scripts/observability     apps/quality-lab (Vite SPA)
  collect → tmp/quality-lab       fetch /observability/*.json
  export  → apps/quality-lab/public/observability
```

- 브라우저는 명령을 실행하지 않는다. 명령 endpoint가 없다
- 앱은 `@berrypjh/react-ui` 공개 exports와 계약 lib만 import한다
- `tmp/quality-lab`과 `apps/quality-lab/public/observability`는 gitignore 대상이다
- E2E는 `apps/quality-lab-e2e`(implicit dependency → quality-lab)가 따로 한다. 앱 소스를 import하지 않는다

같은 폴더의 문서: [metrics.md](./metrics.md) (metric · 단위 · 분모 · 호환) · [collectors.md](./collectors.md) (profile · 입력 · store) · [verification.md](./verification.md) (gate · 최근 결과) · [limitations.md](./limitations.md). 사용법은 [apps/quality-lab/README.md](../../apps/quality-lab/README.md).

## 실행 순서

저장소 root에서 실행한다.

```bash
pnpm build:libs                                           # core 는 lib 를 build 하지 않고 기존 dist 를 잰다
pnpm nx build @berrypjh/observability-contracts          # quality:* 스크립트가 먼저 한다
pnpm quality:collect --profile=static --run-id=local-static-01
pnpm quality:collect --profile=core --run-id=local-quality-01
pnpm quality:export --run-id=local-quality-01
pnpm quality:lab                                          # http://localhost:4300
```

이미 만든 runner report를 다시 실행하지 않고 쓰려면 `tmp/quality-lab/imports/`에 두고 `--import=<command-id>:tmp/quality-lab/imports/<file>`로 넘긴다. `--only-imports`는 import가 없는 명령을 실행하지 않고 이유와 함께 `not-run`으로 남긴다.

## Profile

| profile  | 하는 일                                                                                         |
| -------- | ----------------------------------------------------------------------------------------------- |
| `static` | manifest · exports · script 이름 · 등록 theme(parse-only) · workflow 해시만 읽는다. 명령 실행 0 |
| `core`   | registry의 test · verification · bundle 명령 실행(또는 import) + context in-process 측정        |

실행 가능한 명령은 `tools/scripts/observability/registry.ts`의 argv 뿐이다. CLI는 profile · run id · import만 받고 argv를 만들 방법이 없다. 실행은 `execFile` 계열(shell 없음)과 제한 시간으로 한다.

## 저장

- run id는 경로로 쓰는 kebab-case. 같은 id는 거부한다
- store 전역 `.lock` 디렉터리로 동시 writer를 막는다
- staging 디렉터리에 raw → `run.json` → `manifest.json` 순서로 쓰고 rename, index는 마지막. 실패하면 staging만 지우므로 기존 run · index가 남는다
- 읽기는 realpath root 기준, symlink · traversal 거부, 파일 크기 상한, JSON · schema 오류를 구분한다
- export는 raw · `tmp/` · held-out gold · credential 경로 evidence를 걷어내고 공개 schema로 다시 검증한다

## 의미 규칙

- **availability와 outcome은 다른 축이다.** `available`만 값을 갖고, 나머지 7상태는 `null` + 이유. verification은 eval harness의 원본 5상태를 그대로 둔다
- **count는 출처를 가진다.** runner report · report에서 파생 · source scan · 수집기 시계. source test 파일 수를 case 수로 쓰지 않는다
- **Nx cache 복원은 새 측정이 아니다.** 대상 task 줄의 cache 표시를 보고, report 경로는 실행 전에 지운다
- **size-limit 값은 size-limit 의미 그대로다.** 기본 brotli, esbuild 빈 프로젝트 상수 차감, `KB` = 1000 B (설치된 `bytes-iec`). headroom = limit − current, 같으면 pass, 초과는 음수 headroom
- **treeshake는 보고 전용 진단이다.** raw · gzip을 따로 남기고 한도 · 비율 게이트를 두지 않는다
- **비교는 조건이 같을 때만.** bundle은 방법 · 압축 · 보정 · entry · import · target · externals · 도구 · config 해시, context는 scope · provider · model · tokenizer 버전 · 내용 구성이 같아야 delta를 준다
- **실행 비교는 명시한 두 run만.** Level 1 현재 run, Level 2 사람이 고른 baseline(`baseline.json`은 profile마다 run ID 포인터 — `pnpm quality --run-id=<id>`가 store · public에 같은 내용으로 쓰고, 다른 run으로 바꾸려면 `--replace-baseline`, history는 쌓기만 한다), Level 3 불변 run + index 요약의 `series`. 최신 run을 자동 baseline으로 삼지 않는다. source SHA 차이는 비교 대상이라 막지 않고, 방법 · 압축 · tokenizer · scope · eval 조건(K · task 수 · model 설정 · timeout)은 metric 별 `comparableKey`에 넣는다. 모르는 조건은 unknown, 함께 가진 지표가 없으면 incompatible이다. delta는 부호 있는 절대 차이, 기준 0의 상대 차이는 N/A, 비율은 %p이고, median 차이는 통계 검정이 아니며 threshold를 만들지 않는다
- **evaluator 원래 비교를 따로 둔다.** summary의 `comparison`(warnings 포함)을 그대로 옮기고, 없으면 baseline 파일이 없음(no-baseline) · 깨짐(corrupt-baseline) · 있지만 요청 안 함을 나눈다 — evaluator의 `readBaseline`은 모든 오류를 없음으로 돌리므로 importer가 먼저 읽는다
- **export는 같은 ID의 다른 run을 덮어쓰지 않는다.** 공개 run의 metadata가 다르면 거부한다
- **E2E는 별도 프로젝트다.** `apps/quality-lab-e2e`는 앱 소스를 import하지 않고, 계약으로 만든 fixture를 `page.route`로만 주입한다 (public export에 쓰지 않는다)
- **context scope를 나눈다.** `package-scenario`(measure-tokens 등록부), `variant-initial` · `variant-routed`(consumer eval `measureVariantContext`), `agent-input`. 입력이 하나라도 없으면 `missing-input`으로 부분 합계를 두지 않는다
- `.size-limit.cjs` 주석과 README의 과거 숫자는 observation이 아니다

## 알려진 제약

- `@nx/vitest:test` executor는 forwarded `--reporter`로 report를 쓴 뒤 끝나지 않는다. 그 executor를 쓰는 project(react-ui)는 target과 같은 config로 vitest를 직접 실행한다
- treeshake는 `pnpm exec esbuild`를 쓴다. pnpm을 쓸 수 없는 환경에서는 not-run이다
- `workingTreeHash`는 untracked 파일 내용을 포함하지 않는다
- Playwright adapter는 있지만 등록된 browser 명령이 없다
- coverage는 계약(`not-measured` + 이유)만 있고 수집기는 아직 없다
- `agent-input` context는 executor trace가 있을 때만 의미가 있어 아직 수집하지 않는다
