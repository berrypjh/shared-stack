# devhub-ui

## 왜 있나

저장소마다 있는 DevHub 앱(shared-stack `apps/devhub`, snapdone `apps/devhub`)이 같은 셸 · 그림 · 문서 화면을 쓰기 위한 공개 패키지다. **무엇을 보여 줄지(카탈로그 · 도메인 모델 · 검색 항목 · 링크 정책)는 앱이 갖고, 여기는 어떻게 보여 줄지만 있다.** 두 번째 DevHub 가 실제로 생긴 뒤에 만들었다(`libs.md` 의 "두 번째 사용처" 규칙).

## 절대 원칙

- **라우터를 모른다.** `next/link` · `react-router-dom` 을 import 하지 않는다. 링크 · 현재 위치 · 이동은 `DevHubProvider` 로 받는다(`provider/devhub-provider.tsx`). 새 컴포넌트가 링크를 그리면 `useDevHubLink()` 를 쓴다.
- **저장소 사실을 모른다.** 경로 · 카탈로그 · 스냅샷 · 명령을 import 하지 않는다. 글자(라벨 · 빈 이유)는 prop 으로 받는다 — `RecordMeta` 의 `kind`, `GlobalSearch` 의 `placeholder` 처럼.
- **react-ui 위에 선다.** UI 는 `@berrypjh/react-ui` 공개 exports 만. `ui-core` · `design-tokens` 를 import 하지 않는다. 색 · 간격은 토큰 클래스와 `--ds-*` 변수만.
- **서버 컴포넌트에서 import 될 수 있다.** hook · context · 브라우저 API 를 쓰는 파일은 첫 줄에 `'use client'` 를 둔다. tsc 가 그대로 내보낸다.
- **접근성 동작은 셸의 계약이다.** 건너뛰기 링크 대상 id(`MAIN_CONTENT_ID` · `INSPECTOR_ID`), 서랍은 모달 아님, 그림은 목록과 짝, `#id` 대상은 `tabIndex={-1}`. 바꾸면 앱의 테스트가 잡는다.

## 파일

```
src/
  index.ts              공개 표면 전부. 새 export 는 여기에만 더한다
  styles.css            typo-* · devhub-code · devhub-grid 유틸, color-scheme, body, :focus-visible — 앱의 Tailwind entry 가 @import
  provider/             DevHubProvider · useDevHub* · isCurrentPath — 라우터 접점
  ui/icon.tsx           선 아이콘 전부(aria-hidden). 두 DevHub 가 쓰는 이름의 합집합
  theme/                theme.ts(키 · head 스크립트 · 적용 · 구독) · theme-switch
  shell/                devhub-shell(3칸 틀) · top-bar · explorer(+drawer) · workspace(main · ids) · inspector(aside) · use-route-focus · use-document-title
  canvas/               viewport(계산) · use-pan-zoom · canvas-viewport(이동 · 확대 · 크게 보기) · canvas-edges · view-switch
  markdown/             inline · parse · slug · outline — 의존성 없는 부분 집합 파서
  doc/                  doc-content(renderLink 로 링크 위임) · doc-toc · document-layout · copy-button
  entity/               pager · record-meta · inspector-section(InspectorSection · Empty)
  search/               rank(등급 · 종류 순서는 앱이 줌) · text · shortcut · global-search(결과 함수는 앱이 줌)
```

## 검증

```bash
pnpm nx typecheck @berrypjh/devhub-ui
pnpm nx lint @berrypjh/devhub-ui
pnpm nx test @berrypjh/devhub-ui        # 순수 함수(그림 계산 · markdown · 검색 순위 · 단축키)
pnpm nx build @berrypjh/devhub-ui       # tsc → dist, styles.css 복사
```

컴포넌트를 그리는 계약(셸 랜드마크 · 서랍 · 검색 combobox · 문서 화면)은 `apps/devhub` 의 vitest 와 `apps/devhub-e2e` 가 실제 카탈로그와 함께 본다. 여기서 셸을 바꾸면 그 둘을 돌린다.

## Gotcha

- **`paths: {}`.** react-ui 를 소스가 아니라 패키지(`dist`)로 읽는다. `^build` 가 먼저다.
- **빌드는 tsc 다.** 번들하지 않는다 — 모듈당 파일 하나라 `'use client'` 가 파일마다 남고, 소비자의 Tailwind 가 `dist` 를 `@source` 로 훑는다. 번들러를 넣으면 둘 다 다시 확인한다.
- **`styles.css` 는 Tailwind 가 해석한다.** `@utility` 가 있어 vite 가 일반 CSS 로 불러오면 깨진다. 앱은 Tailwind entry 안에서 `@import` 한다.
- **`GlobalSearch` 의 `results` 는 안정된 참조여야 한다.** `useMemo` 의존성이라 렌더마다 새 함수를 넘기면 매번 다시 검색한다.
