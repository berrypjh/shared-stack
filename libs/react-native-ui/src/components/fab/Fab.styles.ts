import type { ButtonColor, ButtonSize, FabShape, RNTokens } from '@berrypjh/ui-core';

import type { TextStyle, ViewStyle } from 'react-native';

/** 토큰의 다층 그림자 잎. */
type ShadowLayer = {
  blur: number;
  color: string;
  offsetX: number;
  offsetY: number;
  spread: number;
};

/**
 * 토큰 그림자를 RN `boxShadow`로 옮깁니다. 레이어 값은 전부 design-tokens 것이고 키 이름만
 * `BoxShadowValue`에 맞춥니다. RN `elevation`은 Android 전용 단일 숫자라 3겹을 표현하지 못합니다.
 */
const toBoxShadow = (layers: Record<string, ShadowLayer>): ViewStyle['boxShadow'] =>
  Object.values(layers).map((layer) => ({
    offsetX: layer.offsetX,
    offsetY: layer.offsetY,
    blurRadius: layer.blur,
    spreadDistance: layer.spread,
    color: layer.color,
  }));

const sizeSpec = (tokens: RNTokens, size: ButtonSize) => {
  const { spacing, typography } = tokens;

  if (size === 'sm') {
    return {
      diameter: spacing['3xl'],
      icon: typography.fontSize.md,
      paddingHorizontal: spacing.sm,
      label: typography.body.smallStrong,
    };
  }
  if (size === 'md') {
    return {
      diameter: spacing['4xl'],
      icon: typography.fontSize.lg,
      paddingHorizontal: spacing.xl,
      label: typography.body.mediumStrong,
    };
  }
  return {
    diameter: typography.fontSize['7xl'],
    icon: typography.fontSize.xl,
    paddingHorizontal: spacing.xl,
    label: typography.body.largeStrong,
  };
};

/**
 * Fab의 표면·아이콘·라벨 스타일을 토큰으로 풉니다.
 *
 * Fab은 항상 contained라 variant가 없습니다. pressed 피드백은 색이 아니라 elevation으로 줍니다
 * (web `:active`가 `shadow.lg` → `shadow.xl`로 올리는 것과 같은 의도).
 */
export const resolveFabStyles = ({
  tokens,
  shape,
  size,
  color,
  disabled,
  pressed,
}: {
  tokens: RNTokens;
  shape: FabShape;
  size: ButtonSize;
  color: ButtonColor;
  disabled: boolean;
  pressed: boolean;
}): { surface: ViewStyle; icon: ViewStyle; label: TextStyle } => {
  const spec = sizeSpec(tokens, size);
  const btn = color === 'secondary' ? tokens.color.secondaryBtn : tokens.color.primaryBtn;

  const shadow = disabled ? [] : toBoxShadow(pressed ? tokens.shadow.xl : tokens.shadow.lg);

  const footprint: ViewStyle =
    shape === 'circular'
      ? { width: spec.diameter, height: spec.diameter }
      : {
          height: spec.diameter,
          minWidth: spec.diameter,
          paddingHorizontal: spec.paddingHorizontal,
        };

  return {
    surface: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: tokens.spacing.sm,
      borderRadius: tokens.radius.rounded,
      backgroundColor: disabled ? btn.disabled : btn.default,
      boxShadow: shadow,
      ...footprint,
    },
    icon: {
      width: spec.icon,
      height: spec.icon,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      ...spec.label,
      // `RNTokens` 가 리터럴을 넓히므로(`600` → `number`) 경계에서 한 번 좁힌다.
      fontWeight: spec.label.fontWeight as TextStyle['fontWeight'],
      color: disabled ? tokens.color.text.disable : tokens.color.text.contrastText,
    },
  };
};
