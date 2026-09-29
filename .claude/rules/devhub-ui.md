---
paths:
  - 'libs/devhub-ui/**'
---

# devhub-ui (`libs/devhub-ui`)

React. DevHub 앱의 셸 · 그림 · 문서 · 검색 · 테마를 담은 UI 컴포넌트 라이브러리로, 다른 저장소의 DevHub도 쓸 수 있게 npm에 공개한다. 지금 소비자는 `apps/devhub`뿐이다. 공개 표면은 `src/index.ts`가 원본이다.

**무엇을 보여 줄지(카탈로그 · 도메인 · 검색 항목 · 링크 정책)는 앱이 갖고, 여기는 어떻게 보여 줄지만 갖는다.**

## 규칙

- **공개 API는 더하는 방향으로만 넓힌다.** 배포되는 패키지라 기존 이름 · 타입을 바꾸지 않고 선택 prop · 필드로 늘린다
- **라우터를 모른다.** `next/link` · `react-router-dom`을 import하지 않고 `DevHubProvider`로 받는다. 링크를 그리면 `useDevHubLink()`를 쓴다 — Vite · Next DevHub가 같은 컴포넌트를 쓰기 위해서다
- **저장소 사실을 모른다.** 경로 · 카탈로그 · 명령을 import하지 않고, 글자는 prop으로 받는다
- **UI는 `@berrypjh/react-ui` 공개 exports 위에 선다.** 색 · 간격은 토큰 클래스와 `--ds-*` 변수만 쓴다
- **hook · context · 브라우저 API를 쓰는 파일은 첫 줄에 `'use client'`를 둔다.** 서버 컴포넌트에서 import될 수 있다
- **셸의 접근성 계약을 유지한다.** 건너뛰기 대상 id(`MAIN_CONTENT_ID` · `INSPECTOR_ID`), 모달이 아닌 서랍, `tabIndex={-1}`인 `#id` 대상. 바꾸면 앱 테스트가 잡는다

## 검증

```bash
pnpm nx typecheck @berrypjh/devhub-ui
pnpm nx lint @berrypjh/devhub-ui
pnpm nx test @berrypjh/devhub-ui    # 순수 함수만
pnpm nx build @berrypjh/devhub-ui
pnpm storybook:devhub-ui:a11y       # static storybook + axe
```

컴포넌트를 그리는 계약은 `apps/devhub`의 vitest와 `apps/devhub-e2e`가 본다. 셸을 바꾸면 이 패키지를 build한 뒤 그 둘을 돌린다.

## Storybook

- **라우터와 Tailwind는 이야기 전용으로 흉내 낸다.** `DevHubProvider`는 `.storybook/StoryRouter.tsx`가 채우고, 이야기마다 `parameters.router`로 현재 주소를 바꾼다
- **창 폭에 매인 요소는 `parameters.viewport.value`로 검사한다.** addon-viewport는 test-runner에 적용되지 않는다
- **처음 드러난 기존 위반은 `parameters.a11y.disable = true`와 이유 주석으로 baseline 처리한다**

## Gotcha

- **react-ui를 소스가 아니라 `dist`로 읽는다**(`paths: {}`). react-ui를 고쳤으면 먼저 build한다
- **typecheck의 buildinfo는 `out-tsc/`에 둔다.** build와 같은 파일에 쓰면 나란히 돌 때 `dist`에서 `index.js`가 빠진다
- **빌드는 번들하지 않는 tsc다.** 파일마다 `'use client'`가 남고 소비자 Tailwind가 `dist`를 `@source`로 훑는다. 번들러를 넣으면 둘 다 다시 확인한다
- **`styles.css`는 Tailwind entry 안에서 `@import`한다.** `@utility`가 있어 일반 CSS로 불러오면 깨진다
- **`devhub-*` 훅 클래스를 지우지 않는다.** 스타일 없는 이름이지만 ivory · charcoal 테마가 여기에 모양을 건다. 지우면 그 테마 모양이 조용히 빠진다
- **`GlobalSearch`의 `results`는 안정된 참조로 넘긴다.** 렌더마다 새 함수면 매번 다시 검색한다
