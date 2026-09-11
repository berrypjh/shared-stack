import type { ComponentRef, Ref } from 'react';
import type { Switch as NativeSwitch, SwitchProps as NativeSwitchProps } from 'react-native';

/**
 * core `Switch` 의 얇은 래퍼. 역할·상태·누름·애니메이션은 core Switch(native)가 소유한다.
 *
 * - **controlled 전용**이다 — core Switch 가 그렇고, `SegmentControl` 과 같은 선례다.
 *   `value`·`onValueChange` 가 필수이고 `defaultValue` 는 없다.
 * - 색은 토큰이 소유한다: `trackColor`·`thumbColor`·`ios_backgroundColor`(와 deprecated iOS
 *   별칭)를 받지 않는다.
 * - `accessibilityLabel` 은 필수다. RN 에는 보이는 라벨을 컨트롤에 잇는 교차 플랫폼 수단이 없다.
 */
export type SwitchProps = Omit<
  NativeSwitchProps,
  | 'value'
  | 'onValueChange'
  | 'disabled'
  | 'accessibilityLabel'
  | 'trackColor'
  | 'thumbColor'
  | 'ios_backgroundColor'
  | 'onTintColor'
  | 'tintColor'
  | 'thumbTintColor'
> & {
  ref?: Ref<ComponentRef<typeof NativeSwitch>>;

  accessibilityLabel: string;

  value: boolean;
  onValueChange: (value: boolean) => void;

  disabled?: boolean;
};
