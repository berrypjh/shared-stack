import type { BoxSpacingValue } from './box';

export type StackDirection = 'column' | 'row';

export type StackAlign = 'start' | 'center' | 'end' | 'stretch';

export type StackJustify = 'start' | 'center' | 'end' | 'between';

export interface StackSemanticProps {
  direction?: StackDirection;
  gap?: BoxSpacingValue;
  align?: StackAlign;
  justify?: StackJustify;
  wrap?: boolean;
}
