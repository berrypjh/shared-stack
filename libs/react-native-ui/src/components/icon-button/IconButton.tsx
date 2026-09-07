import { ActivityIndicator, View } from 'react-native';

import { useTheme } from '../../theme';
import { ButtonBase } from '../button-base/ButtonBase';

import { resolveIconButtonStyles } from './IconButton.styles';
import type { IconButtonProps } from './IconButton.types';

/**
 * RN IconButton.
 *
 * Fab과 같은 두 겹 구조입니다. 시각 글리프는 작지만(sm은 18) 모바일 최소 터치 타깃은 48이라,
 * 루트(`ButtonBase`)가 48 하한을 지키고 면·아이콘은 그 안에서 토큰 크기대로 그립니다.
 *
 * loading은 아이콘 자리를 스피너로 교체합니다. 접근 가능한 이름이 `accessibilityLabel`이라
 * 아이콘이 사라져도 이름은 유지됩니다.
 */
export const IconButton = ({
  size = 'md',
  color = 'primary',
  disabled,
  loading = false,
  loadingIndicator,
  icon,
  accessibilityLabel,
  style,
  accessibilityState,
  ...rest
}: IconButtonProps) => {
  const { tokens } = useTheme();
  // RN은 `disabled?: boolean | null`입니다. `null`을 넘기면 Pressable의 non-null 분기가 풀려
  // 접근성 상태를 소비자가 덮을 수 있게 되므로 boolean으로 확정합니다.
  const inactive = disabled === true || loading;

  return (
    <ButtonBase
      {...rest}
      accessibilityLabel={accessibilityLabel}
      disabled={inactive}
      accessibilityState={{ ...accessibilityState, busy: loading }}
      style={style}
    >
      {({ pressed }) => {
        const s = resolveIconButtonStyles({ tokens, size, color, disabled: inactive });

        return (
          <View style={s.surface}>
            {loading ? (
              (loadingIndicator ?? <ActivityIndicator size={s.glyph} color={s.contentColor} />)
            ) : (
              <View style={s.icon}>
                {typeof icon === 'function'
                  ? icon({ color: s.contentColor, size: s.glyph, disabled: inactive, pressed })
                  : icon}
              </View>
            )}
          </View>
        );
      }}
    </ButtonBase>
  );
};
