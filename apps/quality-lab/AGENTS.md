# quality-lab

## 왜 있나

shared-stack 의 test·check·bundle·context 수집 결과를 사람이 확인하는 화면이다. 수집은 Node
(`tools/scripts/observability`)가 하고, 이 앱은 export 된 JSON 을 **계약으로 검증한 뒤에만** 보여준다.
전체 구조는 `docs/quality-lab/architecture.md`.

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
    app.tsx              라우트. fetcher·기준 SHA 를 받는다
    AppShell.tsx         header·nav·main (SkipLink 대상)
    nav.ts               정보 구조. nav 라벨 = 페이지 h1
    pages.tsx            Page·Mono·EmptyRuns·OverviewPage·RunsPage
    data/
      loadObservability.ts  index → run 순서로 읽고 공개 계약으로 검증
      format.ts             상태·바이트·headroom·이유 문장
    run/
      RunPanel.tsx          불러오기 상태·문제·마지막 검증 run 유지
  test/fixtures.ts       test 전용 (tsconfig.app 에서 제외)
public/observability/    export 산출물 (gitignore)
```

## 검증

```bash
pnpm nx test @berrypjh/quality-lab
pnpm nx typecheck @berrypjh/quality-lab   # app + spec
pnpm nx build @berrypjh/quality-lab
pnpm nx serve @berrypjh/quality-lab       # http://localhost:4300
```

## Gotcha

- **root source alias 를 쓰지 않는다.** `tsconfig.app.json`·`tsconfig.spec.json` 이 `paths: {}` 로
  덮고, `vite.config.mts` 에 `nxViteTsPaths` 가 없다. 넣으면 `@berrypjh/react-ui` 가
  `libs/react-ui/src` 로 되돌아간다.
- **`^build` 가 먼저다.** 앱은 react-ui·계약 lib 의 `dist` 를 읽는다.
- **기준 SHA 는 build·serve 시점의 `git rev-parse HEAD` 다.** 모르면 `unknown` 이고 freshness 도 unknown.
- **SkipLink 대상 `<main>` 은 `tabIndex={-1}` 과 `scroll-mt-[52px]` 를 가진다.** 헤더 높이는 앱이 안다.
