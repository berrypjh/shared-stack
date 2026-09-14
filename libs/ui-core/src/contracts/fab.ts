import type { ButtonColor, ButtonSize } from './button';

export type FabShape = 'circular' | 'extended';

export interface FabSemanticProps {
  color?: ButtonColor;
  size?: ButtonSize;
  shape?: FabShape;

  disabled?: boolean;
}
