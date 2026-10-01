---
paths:
  - 'apps/demo-web/**'
---

# demo-web (`apps/demo-web`)

`@berrypjh/react-ui`를 **실제 앱으로 통합했을 때** 무엇이 살아 있는지 확인하는 React + Vite 앱이다. 컴포넌트 상태 탐색과 시각 회귀는 Storybook이 맡고, 여기서는 Storybook이 보여 줄 수 없는 테마 전환 · CSS 캐스케이드 · Tailwind preset · 앱의 stacking context를 본다.

## 규칙

- **컴포넌트 예시는 `presentation/components/<name>.tsx` 한 곳에 둔다.** 페이지(`pages/<Name>Page.tsx`)는 `<DeveloperComponentPage presentation={…} />`만 렌더한다. 두 곳에 두면 한쪽만 고쳐진 채 갈라진다
- **묶음 이름은 Storybook 분류를 그대로 쓴다.** 원본은 `presentation/model.ts`의 `PRESENTATION_GROUPS`다
- **앱 크롬까지 semantic 토큰을 쓴다.** 사이드바 · 배경을 하드코딩하면 테마를 바꿨을 때 화면 절반만 움직인다
- **라이브러리에 있는 것을 손으로 다시 만들지 않는다.** 표는 `Table` + `TableScroll`, 목록은 `List`, 검색은 `SearchField`, 건너뛰기는 `SkipLink`다. 손으로 만든 대체물은 접근성을 빠뜨린다
- **테마 셀렉터만 네이티브 `select`로 남긴다.** 크롬이 검사 대상에 의존하면 그 컴포넌트가 깨질 때 테마 전환도 죽는다

### 컴포넌트 페이지 추가

1. `presentation/components/<name>.tsx` — `WebPresentation`
2. `presentation/registry.ts`의 `REGISTERED` — 사이드바는 여기서 파생되므로 `shell/nav.ts`는 고치지 않는다
3. `pages/<Name>Page.tsx` — `DeveloperComponentPage` 래퍼
4. `app/app.tsx`의 `COMPONENT_ROUTES`와 `<Route>` — 경로는 `/components/<kebab-case>`

## 검증

```bash
pnpm nx test @berrypjh/demo-web
pnpm nx typecheck @berrypjh/demo-web
pnpm nx build @berrypjh/demo-web
```

prop 사용을 바꿨으면 브라우저 확인도 필요하다(dev 서버는 AI 세션에서 실행할 수 없다).

## Gotcha

- **정보 구조를 테스트에 다시 적지 않는다.** `pages.spec.tsx`는 `NAV`에서, `presentation.spec.tsx`는 route ↔ registry ↔ `NAV`에서 목적지를 읽는다
- **사이드바 라벨과 페이지 h1은 같은 문장이다.** 라우트 스모크가 이것으로 도착지를 확인한다
- **`end`를 손으로 적지 않는다.** `shell/nav.ts`가 하위 경로 여부로 계산한다
- **presentation 계약 테스트는 react-ui의 build 산출물을 읽는다.** react-ui를 고친 뒤에는 react-ui를 다시 build해야 결과가 맞다
- **아이콘만 있는 컨트롤에는 접근 가능한 이름을 준다.** `pages.spec.tsx`가 렌더 결과에서 확인한다
- **`ch`로 최대 폭을 걸지 않는다.** 라틴 `0` 폭 기준이라 한글에서는 절반에서 줄이 꺾인다
- **`SkipLink` 대상 `<main>`에는 `tabIndex={-1}`과 `scroll-mt`를 둔다.** 없으면 포커스가 옮지 않거나 sticky 헤더가 대상을 덮는다
