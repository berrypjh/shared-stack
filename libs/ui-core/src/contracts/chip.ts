/**
 * Chip 의 시맨틱 계약.
 *
 * Chip 은 **compact label** 이다. 두 가지 모드만 가진다:
 *
 * 1. **passive** — 태그·라벨. 포커스 대상이 아니고 상태가 없다 (web `<span>`, RN `View`).
 * 2. **interactive** — 하나의 primary action 을 가진 toggle. web 은 native `<button>` +
 *    `aria-pressed`, RN 은 `ButtonBase`(Pressable) + `accessibilityState.selected`.
 *
 * `selected`·`disabled` 는 **interactive 모드에만** 존재한다. 누를 수 없는 것에 선택 상태를
 * 주면 시각만 있고 시맨틱이 없는 상태가 된다 — 각 렌더러가 판별 유니온으로 그것을 막는다.
 * 계약은 어휘를 갖고, 모드 제약은 렌더러가 조립한다.
 *
 * menu item·listbox option·checkbox 역할로 자동 전환하지 않는다. 그 셋은 각각 다른 ARIA 계약과
 * 키보드 모델을 요구하고, 이미 `Select`(listbox)·`Checkbox` 가 소유한다.
 *
 * 승격하지 않은 것:
 * - **`intent`** — V1 에 없다. 선택 강조가 이미 `selectionControl.checked`(= `{primary.pr700}`)
 *   이라서 `intent='primary'` 와 `selected` 가 같은 색으로 겹친다. 카테고리 색이 필요하면
 *   Badge 가 그 역할을 가진다.
 * - **라벨·leading 슬롯** — `ReactNode` 는 렌더러 타입이다.
 * - **이벤트** — web `MouseEvent`, RN `GestureResponderEvent`. 타입이 다르다.
 * - **접근성 이름·힌트** — web `aria-label`, RN `accessibilityLabel`/`accessibilityHint`.
 * - **remove/delete** — DEFER. 이유는 각 렌더러 구현의 docstring 참조.
 */
export type ChipSize = 'sm' | 'md';

/** `outlined` 는 테두리만, `filled` 는 옅은 면을 갖는다. 둘 다 라벨 색은 같다. */
export type ChipVariant = 'outlined' | 'filled';

export interface ChipSemanticProps {
  size?: ChipSize;
  variant?: ChipVariant;

  /**
   * toggle 선택 상태. **interactive 모드에만** 유효하다.
   *
   * 주지 않으면 toggle 이 아니라 단순 action chip 이다 — web 은 `aria-pressed` 를 달지 않고
   * RN 은 `accessibilityState.selected` 를 두지 않는다. 없는 토글 시맨틱을 지어내지 않는다.
   */
  selected?: boolean;

  /** **interactive 모드에만** 유효하다. 실제로 활성화를 차단한다. */
  disabled?: boolean;
}
