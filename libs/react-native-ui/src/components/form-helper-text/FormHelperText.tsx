import { Text } from 'react-native';

import { useTheme } from '../../theme';
import { useFormControl } from '../form-control/useFormControl';

import { resolveFormHelperTextStyle } from './FormHelperText.styles';
import type { FormHelperTextProps } from './FormHelperText.types';

/**
 * 필드 아래 보조/오류 텍스트. 값 해석은 명시 prop → FormControl → 기본값.
 *
 * 보이는 텍스트를 그릴 뿐 입력의 설명이 되지 않고, error여도 자동으로 고지하지 않는다 —
 * 모든 헬퍼를 live region으로 만들면 화면의 오류가 서로를 덮어쓰고
 * `accessibilityLiveRegion`은 Android 전용이라 교차 플랫폼 답도 아니다.
 *
 * web의 `children === ' '` → zero-width-space도 옮기지 않았다. 줄 높이를 예약하려는 web
 * 관용구인데 RN에 그 규약이 없고 저장소에 사용처도 없다.
 */
export const FormHelperText = ({
  disabled,
  error,
  style,
  children,
  ...rest
}: FormHelperTextProps) => {
  const { tokens } = useTheme();
  const formControl = useFormControl();

  const resolved = {
    disabled: disabled ?? formControl?.disabled ?? false,
    error: error ?? formControl?.error ?? false,
  };

  return (
    <Text {...rest} style={[resolveFormHelperTextStyle(tokens, resolved), style]}>
      {children}
    </Text>
  );
};
