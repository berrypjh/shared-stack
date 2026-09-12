/**
 * Divider 의 시맨틱 계약 — **가르는 축** 하나만 가집니다.
 *
 * 여기 있는 이유는 **두 렌더러가 같은 불변식을 실제로 구현하기 때문**입니다.
 * `react-ui/src/components/divider` 와 `react-native-ui/src/components/divider` 가 같은 축
 * 어휘를 각자의 스타일 시스템으로 옮깁니다. 렌더러별 prop(`className`·`style`·`HTMLAttributes`·
 * `ViewProps`)은 각 패키지가 덧붙입니다.
 *
 * 두 렌더러가 구현해야 하는 불변식:
 *
 * - **`orientation` 미지정은 `horizontal`**. 어느 플랫폼도 기본 구분선을 그리지 않으므로
 *   플랫폼 기본값이 갈리는 문제는 없지만, 기본값을 계약이 정해 두어야 두 렌더러가 같은
 *   모양에서 출발합니다.
 * - **축은 선이 무엇을 가르는지를 말합니다.** `horizontal` 은 위아래를 가르는 **가로** 선이고
 *   `vertical` 은 좌우를 가르는 **세로** 선입니다. 이것은 ARIA `aria-orientation` 과 같은
 *   어휘라서 web 렌더러가 그대로 옮깁니다.
 * - **두께와 색은 토큰이 정합니다.** `semanticBorder.divider`(1)와 `stroke.light` 를 두
 *   렌더러가 같이 씁니다. prop 으로 열지 않습니다 — 저장소에 굵기나 색을 바꾸는 사용처가
 *   없고, 열면 토큰 밖으로 나가는 길이 생깁니다.
 *
 * Divider 는 **비상호작용** 입니다. hover·pressed·focus·selected·disabled 가 없고 포커스를
 * 받지 않습니다.
 *
 * 승격하지 않은 것:
 * - **`decorative`**: web 은 `<hr>` 의 native separator 시맨틱을 끌 수 있지만 RN 은 그
 *   시맨틱을 **만들 수단이 없습니다** — `accessibilityRole` 유니온에 `separator` 가 없고,
 *   이 저장소는 bare `role` prop 을 쓰지 않습니다. 한쪽만 표현 가능한 키는 승격하지 않습니다.
 *   `react-ui` 의 `DividerProps` 가 가집니다.
 * - **`thickness`·`color`·`inset`**: 토큰이 정하거나 사용처가 없습니다.
 * - **주변 여백**: `Stack` 의 `gap` 이 가집니다. Divider 는 선 자체만 그립니다.
 * - **슬롯·스타일·접근성 prop**: `className`·`style`·`testID`·`role` 전부 렌더러 소유입니다.
 */

/**
 * 선이 가르는 축.
 *
 * Stack 의 `direction`(`column`·`row`)과 **일부러 다른 어휘입니다.** Stack 은 자식이 흐르는
 * 축을, Divider 는 선이 가르는 축을 말합니다. 같은 단어를 쓰면 "가로 구분선이 세로 목록을
 * 가른다"는 사실이 이름에서 뒤집혀 읽힙니다.
 */
export type DividerOrientation = 'horizontal' | 'vertical';

export interface DividerSemanticProps {
  /** 선이 가르는 축. 미지정은 `horizontal` 입니다. */
  orientation?: DividerOrientation;
}
