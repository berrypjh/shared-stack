import { Switch as NativeSwitch } from 'react-native';

import { useTheme } from '../../theme';
import { useFormControl } from '../form-control/useFormControl';

import type { SwitchProps } from './Switch.types';

/**
 * 켜짐/꺼짐 설정. core `Switch` 에 토큰 색만 입힌다 — Pressable 로 트랙·thumb 을 다시 만들지
 * 않고, 접근성 트리를 감싸지도 않는다. switch 역할과 value 상태는 core 가 알린다.
 *
 * - `disabled` 는 native prop 과 `accessibilityState.disabled` 로 함께 준다. core 의 iOS 분기는
 *   접근성 상태를 건드리지 않고 Android 분기만 합친다 — 두 플랫폼을 같게 맞춘다.
 * - `thumbColor` 를 준다. 기본 흰 thumb 은 dark 계열의 켜진 트랙과 3:1 이 안 된다. 대가로 iOS
 *   thumb 은 그림자를 잃는다(core Switch 문서).
 * - 애니메이션은 native 것이다. reduced-motion 을 끄는 API 는 core Switch 에 없다.
 *
 * FormControl 에서는 `disabled` 만 상속한다.
 */
export const Switch = ({ disabled, accessibilityState, ...rest }: SwitchProps) => {
  const { tokens } = useTheme();
  const formControl = useFormControl();

  const disabledValue = disabled ?? formControl?.disabled ?? false;
  const { selectionControl } = tokens.color;

  return (
    <NativeSwitch
      {...rest}
      disabled={disabledValue}
      accessibilityState={{ ...accessibilityState, disabled: disabledValue }}
      trackColor={{ false: selectionControl.trackOff, true: selectionControl.checked }}
      ios_backgroundColor={selectionControl.trackOff}
      thumbColor={selectionControl.indicator}
    />
  );
};
