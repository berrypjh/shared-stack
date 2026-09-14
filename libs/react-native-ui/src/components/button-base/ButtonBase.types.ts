import type { ReactNode, Ref } from 'react';
import type { PressableProps, StyleProp, View, ViewStyle } from 'react-native';

/** style·children 콜백이 받는 상태. disabled일 때 `pressed`는 참이 되지 않습니다. */
export interface ButtonBaseState {
  readonly pressed: boolean;
}

export type ButtonBaseStyle =
  | StyleProp<ViewStyle>
  | ((state: ButtonBaseState) => StyleProp<ViewStyle>);

export type ButtonBaseChildren = ReactNode | ((state: ButtonBaseState) => ReactNode);

/**
 * `PressableProps`에서 Base가 보장해야 하는 것만 제외합니다.
 *
 * - `accessibilityRole`: 항상 `button`입니다.
 * - `aria-disabled`: `disabled`와 같은 자리를 가리키는 두 번째 진실 공급원이라 막습니다.
 * - `children`·`style`: 콜백이 받는 `pressed`를 Base가 다시 계산하므로 자체 타입을 씁니다.
 */
export type ButtonBaseProps = Omit<
  PressableProps,
  'accessibilityRole' | 'aria-disabled' | 'children' | 'style'
> & {
  ref?: Ref<View>;
  children?: ButtonBaseChildren;
  style?: ButtonBaseStyle;
};
