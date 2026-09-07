import type { ButtonColor, ButtonSize } from './button';

/**
 * Fab의 시맨틱 계약. Button 계열의 `color`·`size` 어휘를 그대로 씁니다.
 *
 * `shape`는 양쪽이 같은 뜻으로 구현합니다 — circular은 지름이 같은 원, extended는 라벨을
 * 담아 폭이 늘어나는 알약. 아이콘·라벨 슬롯과 `accessibilityLabel`은 렌더러가 가집니다.
 */
export type FabShape = 'circular' | 'extended';

export interface FabSemanticProps {
  color?: ButtonColor;
  size?: ButtonSize;
  shape?: FabShape;

  disabled?: boolean;
}
