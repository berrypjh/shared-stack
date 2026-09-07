/**
 * Button 계열의 시맨틱 계약.
 *
 * `ButtonBase`·`Button`·`Fab`·`IconButton`이 공유한다. 렌더러 prop(`component`·`href`·
 * DOM 이벤트·`ReactNode` 슬롯)은 각 컴포넌트의 `*.types.ts`가 덧붙인다.
 *
 * ui-core가 아니라 여기 있는 이유: RN 구현이 없다. 계약을 공유 계층에 두려면 두 렌더러가
 * 같은 불변식을 **실제로** 구현하고 있어야 한다.
 */
export type ButtonVariant = 'contained' | 'outlined' | 'text';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonColor = 'primary' | 'secondary';
export type ButtonLoadingPosition = 'start' | 'center' | 'end';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  color?: ButtonColor;

  disabled?: boolean;
  fullWidth?: boolean;

  loading?: boolean;
  loadingPosition?: ButtonLoadingPosition;
}
