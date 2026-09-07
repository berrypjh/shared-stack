/**
 * Button 계열의 시맨틱 계약.
 *
 * 두 렌더러가 같은 불변식을 실제로 구현한다는 근거가 있어서 공유합니다:
 * `variant`·`size`·`color`는 양쪽이 같은 세 값을 각각 토큰으로 풀고, `disabled`·`loading`은
 * 양쪽 모두 "활성화 불가 + 상태 고지"입니다. `fullWidth`는 뜻이 같고 수단만 다릅니다
 * (web `width: 100%`, RN `alignSelf: 'stretch'`).
 *
 * 렌더러 prop(`href`·`component`·`className`·이벤트·접근성 prop·`ReactNode` 슬롯·style)은
 * 각 렌더러의 `*.types.ts`가 덧붙입니다.
 */
export type ButtonVariant = 'contained' | 'outlined' | 'text';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonColor = 'primary' | 'secondary';
export type ButtonLoadingPosition = 'start' | 'center' | 'end';

export interface ButtonSemanticProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  color?: ButtonColor;

  disabled?: boolean;
  fullWidth?: boolean;

  loading?: boolean;
  loadingPosition?: ButtonLoadingPosition;
}
