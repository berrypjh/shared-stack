# quality-lab

## 왜 있나

shared-stack 의 test·check·bundle·context 수집 결과를 사람이 확인하는 화면이다. 수집은 Node
(`tools/scripts/observability`)가 하고, 이 앱은 export 된 JSON 을 **계약으로 검증한 뒤에만** 보여준다.
전체 구조는 `docs/quality-lab/architecture.md`, metric 의미는 `metrics.md`, 수집 입력은 `collectors.md`,
검증·제약은 `verification.md`·`limitations.md` (같은 폴더). 사용법은 `README.md`. 명령은 저장소 root 에서 실행한다.

## 절대 원칙

- **숫자를 만들지 않는다.** seed·예시 값 없음. 값이 없으면 dash 가 아니라 상태 이름과 이유를 보여준다.
- **명령을 실행하지 않는다.** 브라우저에서 수집·export 를 부르는 경로를 만들지 않는다.
- **소비자처럼 쓴다.** UI 는 `@berrypjh/react-ui` 공개 exports 만, 검증은
  `@berrypjh/observability-contracts` 만. `ui-core`·`design-tokens`·deep source import 금지
  (`src/boundary.spec.ts` 가 막는다).
- **라이브러리에 있는 것을 다시 만들지 않는다.** 표는 `Table` + `TableScroll`, 건너뛰기는 `SkipLink`.

## 파일

```
src/
  main.tsx               BrowserRouter
  styles.css             Tailwind entry (react-ui preset)
  global.d.ts            __QUALITY_LAB_SOURCE_SHA__ (vite define)
  app/
    app.tsx              라우트(화면별 lazy chunk). client 를 context 로 준다
    AppShell.tsx         header·nav·main (SkipLink 대상). nav 는 `?run=` 만 이어 간다
    nav.ts               정보 구조 한 벌. nav 라벨 = 페이지 h1 = 현재 항목
    ui.tsx               Page(이동해 왔을 때만 h1 포커스)·EmptyRuns
    data/
      client.ts             index → run 요약 → run 전체. 필요한 파일만 받고 계약으로 검증·캐시
      useRunData.ts         화면이 필요한 수준(index·summary·run)만 읽는 hook. 필터는 렌더에서
      query.ts              URL query 허용 목록 (run·base·package·variant·panel·platform·target·status·q·series)
      status.ts             Empty·Loading·Error·Partial·Unsupported·N/A·Stale·No-match 상태 모델 (+ not-run)
      labels.ts·format.ts   상태·값을 글로
      links.ts              실패 행 → 근거 화면 주소 (bundle·context·eval 은 도메인 화면)
      bundles.ts            size-limit budget 막대·baseline 비교(compareBundle)·treeshake 묶음
      comparison.ts         실행 비교·추세 글. 절대 차이·상대 차이·%p·median 을 구분하고 판정 문구를 만들지 않는다
      ai.ts                 metric 글(분자/분모·n)·4×5 confusion·retrieval N/A·verification kind×status
      designSystem.ts       state 격자(component × state·platform)·theme × 산출물
      loadObservability.ts  run 하나 전체 (실행 기록 상세가 쓴다)
    components/          StatusNotice·CopyCommand·DataTable·Evidence·RunBar 등 (react-ui 조립)
      BarChart.tsx          HTML+SVG 가로 막대. 값 글이 늘 보이고 null 은 막대를 그리지 않는다
      useHashFocus.ts       `#id` 근거 행으로 스크롤·포커스
    pages/
      overview/          독립 카드 4개·최근 실패·기준선(해당 없음)
      quality/           테스트·검증·패키지 표면
      bundles/           size-limit budget·baseline delta·tree-shaking (not-run 이면 이유)
      ai/                출처·primary scorecard·context panel·routing·retrieval·verification
      design-system/     테마·산출물·state 근거·component token·contrast guard·demo-web 링크
      accessibility/     Static/Test Results·Runtime Audit·수동 확인. 출처별로 나누고 점수를 만들지 않는다
      browser/           이 탭의 Environment·Capabilities·Performance (artifact 가 아니다)
      runs/              실행 목록(요약만)·명시 baseline 비교(RunsCompare)·실행 기록 추세·고른 실행 상세
  probes/                브라우저 API probe. detect·sample·subscribe(→dispose). 모든 읽기는 attempt 로 감싼다
    env.ts                  probe 가 읽는 API 표면. 실제 전역은 getter 로 늦게 읽고 test 는 가짜를 넣는다
    environment·media·device·storage·performance.ts   probe 한 벌씩
    useBrowserSession.ts    React state 에만 두는 세션. cleanup 에서 구독·observer 를 뗀다
    run/
      RunPanel.tsx          불러오기 상태·문제·마지막 검증 run 유지
      RunView.tsx           run 상세 표. section id(#bundles 등)가 다른 화면 링크의 대상
  test/                  test 전용 fixture·render (tsconfig.app 에서 제외)
public/observability/    export 산출물 (gitignore). run 마다 `<id>.json` + `<id>.summary.json`
```

- **개요·목록은 run 요약만 읽는다.** 요약 파일은 export 가 계약 함수 `summarizeRun` 으로 쓴다.
  요약이 없는 이전 export 는 run 전체를 몰래 받지 않고 다시 export 하라고 알린다.
- **필터는 표시만 바꾼다.** source·run 요약의 count 는 원본 전체 값이고, 필터 결과 수는 따로 알린다.
- **명령 버튼은 복사만 한다.** 브라우저가 실행하는 경로가 없다.
- **차트는 같은 데이터의 표와 함께 둔다.** chart 의존성 없이 HTML/SVG 로 그리고, 한 차트에는 같은
  조건·단위의 값만 둔다. 새 파생값(합산 점수·감소율 등)을 만들지 않는다 — delta 는 계약의
  `compareBundle` 조건이 모두 같을 때만.
- **브라우저 세션은 artifact 가 아니다.** 저장·전송하지 않고 새로 측정만 한다. 지원 상태
  (supported·unsupported·unavailable·permission-required·not-measured)와 값 상태
  (sampled·awaiting-sample·error·not-sampled)를 섞지 않는다 — false·0 은 측정값, 없는 API 는 값이 없다.
  performance entry 는 개별 관측이고 CLS·INP 같은 Web Vitals 를 계산하지 않는다 (의존성 결정 전).
  UA 문자열·high-entropy UA-CH·WebGL renderer·user-agent memory 측정을 쓰지 않고, COOP·COEP 를 바꾸지 않는다.
- **접근성 근거는 출처를 섞지 않는다.** axe(Storybook·quality-lab)·token 색 쌍 test·compiled CSS 텍스트
  검사·UI test·수동 확인은 서로 다른 근거다. incomplete·not-run·skip 은 통과가 아니고, 1.2:1 은 WCAG
  기준이 아니다. localhost audit 은 `pnpm quality --base-url=http://localhost:4300` (Node) 가 하고
  브라우저 화면은 실행하지 않는다 — axe 는 앱 bundle 에 없다.
- **비교는 명시한 기준만.** 최신 실행을 자동 baseline 으로 삼지 않는다. baseline 포인터(`baseline.json`,
  `pnpm quality --run-id=<id>`)는 보여주고 링크로만 고른다. 포인터 없음과 깨짐은 다른 글이다. 계약의
  `compareRuns` 가 조건이 같은 행에만 delta 를 주고 source SHA 차이는 막지 않는다. 추세는 요약의 `series` 로
  같은 profile·비교 키의 이웃한 점만 잇고 gap·측정 안 됨·조건 모름에서 끊는다. 모든 비교는 보고 전용이다.
- **요약으로 모르는 것은 말하지 않는다.** 요약에는 context scope·treeshake 여부가 없어서 그 대안
  실행은 `alternatives: null` 로 생략한다.

## 검증

```bash
pnpm nx test @berrypjh/quality-lab
pnpm nx typecheck @berrypjh/quality-lab   # app + spec
pnpm nx build @berrypjh/quality-lab
pnpm nx serve @berrypjh/quality-lab       # http://localhost:4300
pnpm nx e2e @berrypjh/quality-lab-e2e     # 실제 브라우저 (apps/quality-lab-e2e, 앱 소스를 import 하지 않음)
```

## Gotcha

- **root source alias 를 쓰지 않는다.** `tsconfig.app.json`·`tsconfig.spec.json` 이 `paths: {}` 로
  덮고, `vite.config.mts` 에 `nxViteTsPaths` 가 없다. 넣으면 `@berrypjh/react-ui` 가
  `libs/react-ui/src` 로 되돌아간다.
- **`^build` 가 먼저다.** 앱은 react-ui·계약 lib 의 `dist` 를 읽는다.
- **기준 SHA 는 build·serve 시점의 `git rev-parse HEAD` 다.** 모르면 `unknown` 이고 freshness 도 unknown.
- **SkipLink 대상 `<main>` 은 `tabIndex={-1}` 과 `scroll-mt-[52px]` 를 가진다.** 헤더 높이는 앱이 안다.
