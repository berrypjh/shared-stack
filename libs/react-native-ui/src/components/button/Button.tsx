import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../theme';
import { ButtonBase } from '../button-base/ButtonBase';

import { resolveButtonStyles } from './Button.styles';
import type { ButtonProps } from './Button.types';

/**
 * RN Button.
 *
 * Web Button의 DOM 구조를 옮기지 않습니다 — anchor·`component`·placeholder span·
 * `aria-labelledby`는 없습니다. 루트는 `ButtonBase` 하나이고 그것이 유일한 접근성 컨트롤입니다.
 *
 * style 우선순위 (마지막에 ButtonBase가 최소 터치 타깃을 다시 얹습니다):
 * 1. 토큰으로 푼 컨테이너 (variant·size·color)
 * 2. pressed 오프셋 — 소비자가 덮을 수 있습니다 (web `:active` 와 같은 자리)
 * 3. `fullWidth`
 * 4. 소비자 style
 * 5. disabled·loading 표현 — 소비자가 덮을 수 없습니다.
 */
export const Button = ({
  variant = 'contained',
  size = 'md',
  color = 'primary',
  disabled = false,
  fullWidth = false,
  loading = false,
  loadingIndicator,
  loadingPosition = 'center',
  startIcon,
  endIcon,
  children,
  style,
  accessibilityState,
  ...rest
}: ButtonProps) => {
  const { tokens } = useTheme();
  const inactive = disabled || loading;

  const { container, label, pressed, stateCritical } = resolveButtonStyles({
    tokens,
    variant,
    size,
    color,
    inactive,
  });

  // 소비자 노드는 그대로 쓰고, 기본 indicator만 라벨색을 물려받습니다.
  const indicator = loading
    ? (loadingIndicator ?? <ActivityIndicator size="small" color={label.color} />)
    : null;
  const showAt = (position: typeof loadingPosition) => loading && loadingPosition === position;

  return (
    <ButtonBase
      {...rest}
      disabled={inactive}
      accessibilityState={{ ...accessibilityState, busy: loading }}
      style={(state) => [
        container,
        state.pressed ? pressed : null,
        fullWidth ? { alignSelf: 'stretch' } : null,
        typeof style === 'function' ? style(state) : style,
        stateCritical,
      ]}
    >
      {showAt('start') ? indicator : startIcon}
      {children == null ? null : (
        // loading center에서도 라벨을 언마운트하지 않습니다 — 접근 가능한 이름이 사라집니다.
        <Text style={[label, showAt('center') ? { opacity: 0 } : null]}>{children}</Text>
      )}
      {showAt('end') ? indicator : endIcon}
      {showAt('center') ? (
        <View style={[StyleSheet.absoluteFill, styles.centerOverlay]} pointerEvents="none">
          {indicator}
        </View>
      ) : null}
    </ButtonBase>
  );
};

const styles = StyleSheet.create({
  centerOverlay: { alignItems: 'center', justifyContent: 'center' },
});
