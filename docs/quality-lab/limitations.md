# quality-lab 알려진 제약

측정 의미를 바꾸지 않고 남긴 제약이다. 해결하면 이 목록에서 지운다.

## 수집

- **core 는 lib 를 build 하지 않는다.** size-limit·package 시나리오 token 은 그 시점의 `dist` 를 읽는다. dist 가
  source 보다 오래되었어도 run 에는 현재 source SHA 가 기록된다. core 전에 `pnpm build:libs` 가 필요하다.
- **import report 에는 생성 commit 이 없다.** `--only-imports` run 의 test·bundle 값은 report 를 만든 시점의
  결과이고, run source SHA 는 수집 시점 HEAD 다. report sha256 은 남는다.
- `@nx/vitest:test` executor 는 forwarded `--reporter` 로 report 를 쓴 뒤 끝나지 않는다. 그 executor 를 쓰는
  project(react-ui)는 같은 config 로 vitest 를 직접 실행한다. Nx cache 복원은 새 report 를 만들지 않는다.
- treeshake 는 `pnpm exec esbuild` 를 쓴다. pnpm 을 쓸 수 없는 환경에서는 not-run 이다.
- `workingTreeHash` 는 untracked 파일 내용을 포함하지 않는다.
- coverage 는 계약(`not-measured` + 이유)만 있고 수집기는 없다.
- `agent-input` context scope 는 executor trace 가 있을 때만 의미가 있어 수집하지 않는다.
- `measure-tokens` 의 `design-tokens`·`ui-core` 일부 시나리오는 `dist/AGENTS.md` 를 읽는데 그 파일을 만들지
  않으므로 `missing-input` 이다 (값을 0 으로 두지 않음).
- Playwright test adapter 는 있지만 등록된 browser 명령이 없다.

## eval

- `local-*` eval run 은 `smoke-scripted`(harness 확인용 고정 입력) 결과다. 모델 성능이 아니다.
- eval series ID 에 `sourceId`(출력 디렉터리 이름)가 들어가서 다른 디렉터리에서 만든 eval 끼리는 짝이
  되지 않는다 (비교하면 added/removed 만 있고 `metrics.shared` 로 incompatible).
- task 부분집합은 `taskCount < datasetTaskCount` 로만 안다. 같은 개수의 다른 task 조합은 구분하지 못한다.
- `originalComparison` 필드 이전에 수집한 eval run 은 `null`(가져오지 않음)이다. 다시 수집해야 채워진다.
- eval 비교·추세는 primary 5개 metric 만 다룬다. secondary·diagnostic 은 화면 표에만 있다.

## 비교·기록

- 비교는 보고 전용이다. threshold·통계 검정·신뢰구간이 없고 median 차이는 검정이 아니다.
- toolchain·lockfile·dirty 차이는 실행 단위에서 `informs` 로만 알린다 (비교를 막지 않음).
- `series` 필드 이전 요약은 `null` 이라 추세에서 gap 이다. `pnpm quality:export` 로 다시 export 하면 채워진다.
- 추세는 표로만 보여준다 (chart dependency 없음).
- 공개 run 충돌 검사는 metadata 만 비교한다. baseline 포인터 삭제 명령은 없다.
- 실측 core run 은 `local-quality-01`(full core)과 `local-core-12`(`--only-imports`, 같은 report) 둘이고,
  test·bundle 값이 같은 report 에서 왔다. 서로 다른 측정 사이의 실제 test·bundle 회귀 비교는 아직 없다.

## 접근성·브라우저

- Storybook axe·수동 확인·quality-lab localhost audit 은 실측 run(`local-a11y-01`)에서 `not-run` 이다.
- axe 결과는 자동 검사 범위일 뿐 WCAG 적합성 판정이 아니다. 점수를 만들지 않는다.
- 브라우저 세션 화면은 artifact 가 아니다. 저장·전송하지 않고 CLS·INP 같은 Web Vitals 를 계산하지 않는다.
- Chrome 외 브라우저, forced colors, reduced motion 은 자동 검증이 없다.

## 앱·빌드

- production build 의 entry chunk 가 500 kB(minified) 를 넘어 Vite 경고가 난다 (react-ui·zod 계약·router 포함).
  rendering 시간은 측정하지 않았다.
- `vite build` 는 `public/observability` 를 그대로 복사한다. 그 디렉터리에 있는 모든 파일(로컬 run 과 편집
  도구가 만든 숨김 디렉터리 포함)이 `dist` 에 들어간다.
- 저장소 root 가 아닌 디렉터리에서 `nx` 를 실행하면 project graph 처리가 실패한다
  (`tools/evals/consumer/fixtures/*` 의 이름 없는 package).

## E2E

- `apps/quality-lab-e2e` 에는 `package.json` 이 없다 (lockfile 을 바꾸지 않기 위해). Playwright·계약 lib 은
  root `node_modules` 에서 해석된다. `eslint-plugin-playwright` 는 설치돼 있지 않다.
- 로컬에서는 4300 에 떠 있는 서버를 재사용한다. 다른 앱이면 navigation spec 의 title 단언이 먼저 실패한다.
- keyboard 비교 시나리오는 native select 에 Playwright `selectOption` 을 쓴다 (화살표 키 조작이 아님).
