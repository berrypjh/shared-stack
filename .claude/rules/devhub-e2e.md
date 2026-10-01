---
paths:
  - 'apps/devhub-e2e/**'
---

# devhub-e2e (`apps/devhub-e2e`)

Playwright. `devhub`에서 jsdom이 볼 수 없는 것(레이아웃 · 넘침 · CSS 전환 · 포커스 복귀 · 단축키 · 새로고침 뒤 저장)을 실제 브라우저에서 확인한다. 시나리오는 `src/*.spec.ts`, 공용 헬퍼는 `src/support/`에 있다.

## 규칙

- **앱 소스를 import하지 않는다.** 확인할 것은 렌더된 화면이다
- **평가 데이터는 `page.route`로 주입만 한다.** `support/observability.ts`의 fixture를 쓰고 `public/observability`에 쓰지 않는다 — 수집기의 실제 export를 덮지 않기 위해서다
- **역할 · 이름으로 찾는다.** 역할이 없는 자리(그림 노드 · `#id` 대상)만 `href` · `id`로 찾는다
- **키보드 경로는 `support/keyboard.ts`의 `tabTo` · `enterMain`으로 닿는다.** `locator.focus()`는 사용자가 실제로 닿는 경로를 확인하지 못한다
- **픽셀 · 정확한 시간을 단언하지 않는다.** 동작 · 주소 · 포커스 · 보이는 글 · 순서까지다
- **접근성 동작을 테스트에 맞춰 빼지 않는다.** 실패하면 앱을 고친다
- **DevHub 화면의 axe 검사는 `a11y.spec.ts`가 맡는다.** 평가 화면도 `page.route`로 데이터를 주입해 함께 검사한다

## 검증

```bash
pnpm nx typecheck @berrypjh/devhub-e2e
pnpm nx e2e @berrypjh/devhub-e2e
```

`e2e`는 포트를 연다(`.claude/harness.profile.md`). CI workflow는 `e2e` target을 돌리지 않는다.

## Gotcha

- **로컬에서는 4400에 떠 있는 서버를 재사용한다.** 다른 앱이 떠 있으면 첫 단언부터 실패한다
- **"이 페이지에서"의 위치는 화면이 아니라 작업 영역 폭(`@3xl`)이 정한다.** 넓은 쪽 테스트는 1920px로 연다
- **단축키는 `ControlOrMeta`가 아니라 앱이 알린 키로 누른다.** `Desktop Chrome`은 Windows UA라 앱은 Ctrl+K를 기다리는데 `ControlOrMeta`는 macOS에서 ⌘를 보낸다. 검색 칸의 `aria-keyshortcuts`를 읽어 누른다
- **닫힌 서랍은 역할로 찾히지 않는다.** 닫힌 채로 읽으려면 `includeHidden: true`
