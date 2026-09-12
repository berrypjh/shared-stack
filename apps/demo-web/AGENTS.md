# demo-web

## 왜 있나

`@berrypjh/react-ui` 를 **실제 앱으로 통합했을 때** 무엇이 살아 있는지 확인하는 도구다.
개별 컴포넌트의 상태 탐색과 시각 회귀는 Storybook 이 담당한다. 여기서 보는 것은 그쪽이
보여줄 수 없는 것 — 테마 전환, CSS 캐스케이드, Tailwind preset, 패키지 경계다.

그래서 컴포넌트 페이지 목록이 짧다. **라이브러리 전 컴포넌트를 페이지로 만들지 않는다** —
대표 세트만 둔다.

묶음은 작업 단위다 — 검증 / Foundation / 컴포넌트 / Layout / Overlay. 컴포넌트 묶음 밖으로
나온 것은 **종류가 다른 것**이고, 이름은 Storybook 분류(`Components/Layout/…`,
`Components/Overlay/…`)를 그대로 쓴다 — 같은 컴포넌트를 두 곳에서 다른 이름으로 부르지 않는다.
demo-mobile 목록 구조는 여기와 다르다 — 이유는 `apps/demo-mobile/AGENTS.md` 에 있다.

대표 세트라는 말이 "아무거나 몇 개"라는 뜻은 아니다. **Storybook 이 구조적으로 볼 수 없는
것은 여기 있어야 한다.** `Popover` 가 그래서 있다 — portal 을 쓰지 않아 패널이 DOM 상 그
자리에 그려지므로 겹침이 앱의 stacking context 안에서 결정되고(이 앱은 topbar `z-10`, 드로어
`z-20`), 고립된 캔버스에는 그 층이 아예 없다.

---

## 절대 원칙

- **라이브러리를 고치지 않는다.** `libs/react-ui` 수정이 필요하면 그 패키지에서 한다.
- **소비자처럼 쓴다.** import 는 `@berrypjh/react-ui` 하나, CSS 는 `@berrypjh/react-ui/styles.css`,
  Tailwind 는 `@berrypjh/react-ui/tailwind` preset. `@berrypjh/ui-core`·`@berrypjh/design-tokens`
  를 직접 import 하지 않는다 — 소비자에게 그 경로가 없다.
- **prop 은 실제 타입에서 확인한다.** 추측하지 않는다. `Select` 는 `FormControl` + `InputLabel` +
  `Select` 조합이다 — 독립 `label` prop 이 없다.
- **크롬까지 semantic 토큰을 쓴다.** 사이드바·배경색을 하드코딩하면 테마를 바꿨을 때 화면
  절반만 움직여서, 이 앱이 확인하려는 것 자체가 깨진다.
- **라이브러리에 있는 것을 손으로 다시 만들지 않는다.** 페이지든 크롬이든 마찬가지다 —
  표는 `Table` + `TableScroll`, 목록은 `List`/`ListItem`, 독립 토글은 `Checkbox`, 상호배타
  토글은 `Chip selected`, 검색은 `SearchField`, 건너뛰기 링크는 `SkipLink` 다. 손으로 만든
  대체물은 접근성을 조용히 빠뜨린다: 예전 토큰 표의 `overflow-x-auto` 에는 `TableScroll` 이
  주는 키보드 스크롤(WCAG 2.1.1)이 없었고, 열 토글은 checkbox 시맨틱 없이 `aria-pressed` 만
  있었다.

---

## 파일

```
src/
  main.tsx                 진입점 (BrowserRouter)
  styles.css               Tailwind entry + demo 전용 변수(--demo-canvas)
  app/
    app.tsx                라우트 테이블. AppShell 로 감싼다
    shell/
      nav.ts               정보 구조(NAV) + titleFor. `end` 는 경로에서 유도한다
      AppShell.tsx         사이드바·topbar·테마 셀렉터
      ui.tsx               페이지 primitive — Page · Section · Panel · Preview · Mono · Swatch
      controls.tsx         데모 전용 컨트롤 — SelectControl(네이티브 select) · StatusDot · StatusRow
    pages/
      {Name}Page.tsx       컴포넌트 페이지. Page/Section/Preview 를 조립만 한다
      TokensPage.tsx       토큰 검색·조회
      TokenPreview.tsx     토큰 값의 시각 미리보기
      FoundationPage.tsx   타이포·간격 등 foundation
      OverviewPage.tsx     첫 화면
      VerifyPage.tsx       Runtime 검증 화면
    verification/
      checks.ts            integration contract 판정 로직
      RuntimeVerification.tsx  판정 결과 UI
      useProbes.tsx        테마별 probe 트리
      contrast.ts          대비 계산
      useCurrentTheme.ts   현재 테마 조회
```

레이아웃은 `shell/ui.tsx` 의 primitive 가 소유하고 Tailwind 클래스로 쓴다. 컴포넌트 페이지는
자기 레이아웃을 들고 있지 않는다 — `Page` · `Section` · `Preview` 를 조립할 뿐이다. inline
`style` 은 토큰 값을 그대로 그려 보여야 하는 곳(`TokenPreview`, swatch)에만 쓴다.

---

## 작업 매트릭스

| 작업                 | 수정 파일                                                            |
| -------------------- | -------------------------------------------------------------------- |
| 컴포넌트 페이지 추가 | `pages/{Name}Page.tsx` + `app.tsx` 라우트 + `shell/nav.ts` 의 SOURCE |
| 정보 구조 변경       | `shell/nav.ts` (`end` 는 손으로 적지 않는다 — 경로에서 유도된다)     |
| 페이지 primitive     | `shell/ui.tsx` — 반복이 **실제로** 생긴 것만 올린다                  |
| 검증 항목 추가       | `verification/checks.ts`                                             |

경로 규칙: `/components/{kebab-case-name}`.

---

## 검증

```bash
pnpm nx test @berrypjh/demo-web        # vitest — 라우팅 스모크 · 정보 구조 · 검증 로직
pnpm nx typecheck @berrypjh/demo-web   # tsc (의존 패키지를 먼저 빌드한다)
pnpm nx build @berrypjh/demo-web
pnpm nx e2e @berrypjh/demo-web-e2e     # Playwright (dev 서버를 자동으로 띄운다)
```

E2E 쪽 규칙은 `apps/demo-web-e2e/AGENTS.md` 가 가진다.

| 변경           | 최소 검증                          |
| -------------- | ---------------------------------- |
| 페이지 추가    | `test` (라우트 스모크가 자동 포함) |
| 정보 구조 변경 | `test` + `e2e`                     |
| prop 사용 변경 | `typecheck` + 브라우저 확인        |
| 검증 로직 변경 | `test`                             |

---

## Gotcha

- **정보 구조를 테스트에 다시 적지 않는다.** `pages.spec.tsx` 의 라우트 스모크와 묶음 단언은
  `NAV` 에서, E2E 이동 테스트는 **렌더된 사이드바**에서 목적지를 읽는다 (Nx 프로젝트 경계 때문에
  E2E 는 demo-web 소스를 import 할 수 없고, 어차피 확인해야 할 것은 브라우저에 그려진
  목록이다). 페이지를 `nav.ts` 에 등록하면 두 테스트가 자동으로 덮는다.
- **사이드바 라벨과 페이지 h1 은 같은 문장이다.** 두 테스트가 이 규칙으로 도착지를 확인한다.
  다르게 두면 누른 이름과 도착한 화면의 이름이 갈린다.
- **`end` 를 손으로 적지 않는다.** 다른 항목의 상위 경로인지로 계산한다. 박아 두면 하위 경로가
  생길 때 함께 낡는다.
- **아이콘만 있는 컨트롤은 이름을 잃기 쉽다.** 실제로 IconButton 이 전부 이름 없이 렌더된 적이
  있다(WCAG 4.1.2). `pages.spec.tsx` 가 렌더 결과에서 접근 가능한 이름을 확인한다.
- **`ch` 로 최대 폭을 걸지 않는다.** `ch` 는 라틴 `0` 폭 기준이라 한글에서는 의도한 글자 수의
  절반에서 줄이 꺾인다. `break-keep` 만 쓴다.
- **E2E 는 픽셀을 단언하지 않는다.** 동작과 가시성까지만 본다.
- **테마 셀렉터만 네이티브 `select` 로 남긴다** (`shell/controls.tsx`). 크롬이 검사 대상에
  의존하면 그 컴포넌트가 깨질 때 테마 전환 자체가 죽고, 이 앱이 무엇을 확인하려 했는지까지
  같이 사라진다. `Select` 의 통합 확인은 `/components/select` 페이지가 맡는다.
- **`SkipLink` 의 대상은 앱이 소유한다.** `<main>` 에 `tabIndex={-1}` 이 없으면 fragment
  이동이 포커스를 옮기지 않고, `scroll-mt` 가 없으면 52px sticky 헤더가 대상을 덮는다
  (WCAG 2.4.11). 라이브러리는 헤더 높이를 모른다.
- **`IconButton` 색은 primary·secondary 뿐이다.** 중립 아이콘 버튼이 없어서 토프바 메뉴
  버튼이 `text-primary` 로 그려진다 — 손으로 만든 버튼의 `text-text-default` 와 달라진
  부분이고, 라이브러리 쪽 표면이 좁다는 신호다.
