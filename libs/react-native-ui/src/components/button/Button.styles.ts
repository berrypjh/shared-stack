import type { ButtonColor, ButtonSize, ButtonVariant, RNTokens } from '@berrypjh/ui-core';

import type { TextStyle, ViewStyle } from 'react-native';

/** design-tokens의 typography 잎. */
type TypographyToken = RNTokens['typography']['body']['mediumStrong'];

/**
 * 토큰 typography를 RN `TextStyle`로 좁힙니다.
 *
 * `RNTokens`는 7개 테마가 한 타입에 대입되도록 리터럴을 넓혀(`600` → `number`) 두는데,
 * RN `TextStyle.fontWeight`는 100~900 리터럴 유니언만 받습니다. 값은 항상 유효한 굵기입니다.
 */
const toLabelStyle = (typography: TypographyToken, color: string): TextStyle => ({
  ...typography,
  fontWeight: typography.fontWeight as TextStyle['fontWeight'],
  color,
});

type Resolved = {
  container: ViewStyle;
  label: TextStyle;
  /** disabled·loading 일 때 소비자 style 뒤에 다시 얹는 값. 활성 상태면 `null`. */
  stateCritical: ViewStyle | null;
};

const sizeSpec = (tokens: RNTokens, size: ButtonSize) => {
  const { spacing, radius, typography } = tokens;

  if (size === 'sm') {
    return {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.sm,
      label: typography.body.smallStrong,
    };
  }
  if (size === 'lg') {
    return {
      paddingHorizontal: spacing['2xl'],
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      label: typography.body.largeStrong,
    };
  }
  return {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    label: typography.body.mediumStrong,
  };
};

const palette = (tokens: RNTokens, color: ButtonColor) =>
  color === 'secondary'
    ? {
        solid: tokens.color.secondaryBtn.default,
        solidDisabled: tokens.color.secondaryBtn.disabled,
        onSurface: tokens.color.text.secondary,
        outline: tokens.color.stroke.secondary,
      }
    : {
        solid: tokens.color.primaryBtn.default,
        solidDisabled: tokens.color.primaryBtn.disabled,
        onSurface: tokens.color.text.primary,
        outline: tokens.border.primary.color,
      };

/**
 * variant·size·color·비활성 여부를 토큰 값으로 풉니다.
 *
 * `flexDirection` 같은 레이아웃 리터럴은 디자인 값이 아니라 토큰화하지 않습니다.
 * pressed 표현은 없습니다 — design-tokens에 pressed 상태 색이 없고, `hover`는 web 전용
 * 이름이라 pressed로 돌려쓰지 않습니다.
 */
export const resolveButtonStyles = ({
  tokens,
  variant,
  size,
  color,
  inactive,
}: {
  tokens: RNTokens;
  variant: ButtonVariant;
  size: ButtonSize;
  color: ButtonColor;
  inactive: boolean;
}): Resolved => {
  const { paddingHorizontal, paddingVertical, borderRadius, label } = sizeSpec(tokens, size);
  const p = palette(tokens, color);

  const surface: ViewStyle =
    variant === 'contained'
      ? { backgroundColor: inactive ? p.solidDisabled : p.solid, borderWidth: 0 }
      : variant === 'outlined'
        ? {
            backgroundColor: 'transparent',
            borderWidth: tokens.border.primary.width,
            borderColor: inactive ? tokens.border.disabled.color : p.outline,
          }
        : { backgroundColor: 'transparent', borderWidth: 0 };

  const labelColor = inactive
    ? tokens.color.text.disable
    : variant === 'contained'
      ? tokens.color.text.contrastText
      : p.onSurface;

  return {
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: tokens.spacing.sm,
      paddingHorizontal,
      paddingVertical,
      borderRadius,
      ...surface,
    },
    label: toLabelStyle(label, labelColor),
    stateCritical: inactive ? surface : null,
  };
};
