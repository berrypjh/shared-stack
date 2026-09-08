import type { FieldColor, FieldSize, FieldVariant, RNTokens } from '@berrypjh/ui-core';

import type { TextStyle, ViewStyle } from 'react-native';

/** design-tokens의 typography 잎. */
type TypographyToken = RNTokens['typography']['body']['medium'];

const toTextStyle = (typography: TypographyToken, color: string): TextStyle => ({
  ...typography,
  fontWeight: typography.fontWeight as TextStyle['fontWeight'],
  color,
});

type TriggerState = {
  variant: FieldVariant;
  size: FieldSize;
  color: FieldColor;
  disabled: boolean;
  error: boolean;
  focused: boolean;
};

const sizeSpec = (tokens: RNTokens, size: FieldSize) =>
  size === 'sm'
    ? {
        paddingHorizontal: tokens.spacing.md,
        fieldHeight: tokens.component.field.height.sm,
        typography: tokens.typography.body.small,
      }
    : {
        paddingHorizontal: tokens.spacing.lg,
        fieldHeight: tokens.component.field.height.md,
        typography: tokens.typography.body.medium,
      };

/**
 * 상태별 테두리. Input 계열(`InputBase.borderSpec`)과 같은 순서입니다 —
 * disabled > error > focused > 평상시. focus 시 halo 를 만들지 않습니다:
 * canonical primary field halo 토큰이 없고, web 은 버튼 토큰(`primaryBtn.outlinedHover`)을
 * 빌려 쓰는데 그것을 옮기지 않습니다.
 */
const borderSpec = (tokens: RNTokens, { disabled, error, focused, color }: TriggerState) => ({
  borderColor: disabled
    ? tokens.border.disabled.color
    : error
      ? tokens.color.stroke.error
      : focused
        ? color === 'secondary'
          ? tokens.color.stroke.secondary
          : tokens.border.primary.color
        : tokens.color.field.border,
  borderWidth:
    focused && !disabled ? tokens.component.field.focusRingWidth : tokens.border.primary.width,
});

/** variant 별 표면. Input 계열의 `surfaceFor` 와 같은 결정입니다. */
const surfaceFor = (tokens: RNTokens, variant: FieldVariant, disabled: boolean) => {
  if (variant === 'filled') return tokens.color.field.surface;
  if (variant === 'boxed' && disabled) return tokens.color.field.surfaceSubtle;
  return 'transparent';
};

/** 트리거(Pressable) style. */
export const resolveSelectTriggerStyle = (tokens: RNTokens, state: TriggerState): ViewStyle => {
  const { paddingHorizontal, fieldHeight } = sizeSpec(tokens, state.size);
  const { borderColor, borderWidth } = borderSpec(tokens, state);
  const backgroundColor = surfaceFor(tokens, state.variant, state.disabled);

  if (state.variant === 'plain') {
    return {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: tokens.spacing.sm,
      paddingHorizontal: 0,
      minHeight: Math.max(fieldHeight, tokens.spacing['4xl']),
      backgroundColor,
      borderRadius: 0,
      borderBottomWidth: borderWidth,
      borderBottomColor: borderColor,
    };
  }

  return {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacing.sm,
    paddingHorizontal,
    minHeight: Math.max(fieldHeight, tokens.spacing['4xl']),
    backgroundColor,
    borderRadius: tokens.radius.md,
    borderWidth,
    borderColor,
  };
};

/** 트리거에 표시되는 값/placeholder 의 텍스트 style. */
export const resolveSelectValueStyle = (
  tokens: RNTokens,
  { size, disabled, empty }: { size: FieldSize; disabled: boolean; empty: boolean },
): TextStyle =>
  toTextStyle(
    sizeSpec(tokens, size).typography,
    disabled
      ? tokens.color.text.disable
      : empty
        ? tokens.color.text.placeholder
        : tokens.color.text.default,
  );

/** 장식용 개폐 표시의 색. */
export const resolveSelectIndicatorColor = (tokens: RNTokens, disabled: boolean) =>
  disabled ? tokens.color.icon.disable : tokens.color.icon.light;

/** 열린 목록 패널. web 의 `position:absolute`·`z-index`·`max-height:280px` 를 옮기지 않습니다. */
export const resolveSelectPanelStyle = (tokens: RNTokens): ViewStyle => ({
  backgroundColor: tokens.color.background.surface,
  borderColor: tokens.color.field.border,
  borderWidth: tokens.border.primary.width,
  borderRadius: tokens.radius.md,
  paddingVertical: tokens.spacing.xs,
});

/** 선택지 하나. 최소 높이는 sm 필드 높이를 시각 기준선으로 씁니다. */
export const resolveSelectChoiceStyle = (
  tokens: RNTokens,
  { selected }: { selected: boolean },
): ViewStyle => ({
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: tokens.spacing.lg,
  paddingVertical: tokens.spacing.sm,
  minHeight: Math.max(tokens.component.field.height.sm, tokens.spacing['4xl']),
  borderRadius: tokens.radius.sm,
  backgroundColor: selected ? tokens.color.background.selected : 'transparent',
});

/** 선택지 라벨. disabled > 평상시 (다른 컴포넌트와 같은 순서). */
export const resolveSelectChoiceLabelStyle = (
  tokens: RNTokens,
  { selected, disabled }: { selected: boolean; disabled: boolean },
): TextStyle =>
  toTextStyle(
    selected ? tokens.typography.body.smallStrong : tokens.typography.body.small,
    disabled ? tokens.color.text.disable : tokens.color.text.default,
  );

/** 배경. 반투명 검정은 디자인 값이 아니라 modal scrim 의 프레임워크 관용구입니다. */
export const selectBackdropStyle: ViewStyle = {
  flex: 1,
  justifyContent: 'center',
  padding: 24,
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
};
