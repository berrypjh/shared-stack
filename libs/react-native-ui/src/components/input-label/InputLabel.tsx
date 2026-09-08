import { Text } from 'react-native';

import { useTheme } from '../../theme';
import { useFormControl } from '../form-control/useFormControl';

import { resolveInputLabelStyle } from './InputLabel.styles';
import type { InputLabelProps } from './InputLabel.types';

/**
 * 필드 위 정적 라벨. 값 해석은 명시 prop → FormControl → 기본값.
 *
 * **보이는 라벨은 입력의 접근 가능한 이름이 아니다.** 형제 입력의 `accessibilityLabel`을
 * 건드리지 않는다. Android 한정으로 연결하려는 소비자를 위해 `nativeID`만 전달한다.
 */
export const InputLabel = ({
  color,
  size,
  disabled,
  error,
  focused,
  required,
  style,
  children,
  ...rest
}: InputLabelProps) => {
  const { tokens } = useTheme();
  const formControl = useFormControl();

  const resolved = {
    color: color ?? formControl?.color ?? 'primary',
    size: size ?? formControl?.size ?? 'md',
    disabled: disabled ?? formControl?.disabled ?? false,
    error: error ?? formControl?.error ?? false,
    focused: focused ?? formControl?.focused ?? false,
  };
  const resolvedRequired = required ?? formControl?.required ?? false;

  return (
    <Text {...rest} style={[resolveInputLabelStyle(tokens, resolved), style]}>
      {children}
      {/* web은 `aria-hidden`으로 감추지만 RN엔 중첩 Text를 접근성 트리에서 빼는 교차 플랫폼
          수단이 없다. 라벨 텍스트의 일부로 읽힌다 — 완전한 required 의미가 아니다. */}
      {resolvedRequired ? <Text>{' *'}</Text> : null}
    </Text>
  );
};
