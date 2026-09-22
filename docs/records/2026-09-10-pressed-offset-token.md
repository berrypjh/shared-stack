# 눌림 상태는 색이 아니라 위치 — component.pressedOffset 토큰으로 승격

web 이 `button-base.scss` 에 하드코딩하던 1px 눌림을 base 토큰 `component.pressedOffset` 으로 옮김. `primaryBtn.pressed` 같은 색 토큰은 만들지 않음.

## 상황

- 웹 Button 계열은 눌림을 `translateY(1px)` 로 표현했는데 값이 SCSS 에 박혀 있었음
- RN Button · IconButton 은 눌림 표현이 없거나 제각각이었음
- 눌림을 색으로 표현하면 hover · focus · selected 색과 대비 검사 조합이 한 축 더 늘어남

## 판단

- **pressed 는 위치** — 색은 그대로 두고 `translateY(pressedOffset)` 만. Fab 만 elevation 을 한 단계 얹음(`shadow.lg` → `xl`)
- **base 토큰, 테마 델타 없음** — 눌림 깊이는 테마마다 달라질 이유가 없음
- **결정을 테스트로 고정** — pressed 색 토큰이 생기면 실패하는 검사를 둠
- 같은 커밋에서 Button 계열 대비 기준을 나눔 — hover 면 · hover 틴트 · outline 링은 AA, contained 면 · 비활성 라벨 · focus halo 는 가시성 바닥만

## 반영

- `libs/design-tokens/tokens/light/component.json` — `pressedOffset`
- `libs/react-ui/src/components/button-base/button-base.scss` — `var(--ds-component-pressed-offset)`
- RN Button · IconButton 눌림을 같은 토큰 오프셋으로
- `libs/design-tokens/AGENTS.md` 표와 "pressed는 색이 아니라 위치다"

## 검증

- `libs/design-tokens/src/lib/contrast.test.ts` 의 `describe('pressed 상태 어휘')`
- `pnpm nx test @berrypjh/design-tokens`
