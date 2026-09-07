import type { ButtonColor, ButtonSize } from './button';

/** Fab 의 시맨틱 계약. Button 계열의 `color`·`size` 어휘를 그대로 쓴다. */
export type FabShape = 'circular' | 'extended';

export interface FabProps {
  color?: ButtonColor;
  size?: ButtonSize;
  shape?: FabShape;

  disabled?: boolean;
}
