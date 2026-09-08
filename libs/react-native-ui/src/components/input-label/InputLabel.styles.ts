import type { FieldColor, FieldSize, RNTokens } from '@berrypjh/ui-core';

import type { TextStyle } from 'react-native';

type TypographyToken = RNTokens['typography']['body']['smallStrong'];

/**
 * 토큰 typography를 `TextStyle`로 좁힌다.
 *
 * `RNTokens`는 7개 테마가 한 타입에 들어가도록 리터럴을 넓혀(`600` → `number`) 두는데
 * `TextStyle.fontWeight`는 100~900 리터럴만 받는다. 값은 항상 유효한 굵기다.
 */
const toTextStyle = (typography: TypographyToken): TextStyle => ({
  ...typography,
  fontWeight: typography.fontWeight as TextStyle['fontWeight'],
});

type ResolvedState = {
  color: FieldColor;
  size: FieldSize;
  disabled: boolean;
  error: boolean;
  focused: boolean;
};

/**
 * 상태별 라벨 색. 우선순위는 disabled > error > focused > 평상시.
 *
 * web은 CSS 특정도상 focused가 이기지만 그 순서를 주장하는 테스트가 없다. RN은
 * `InputBase.borderSpec`이 disabled를 우선하므로, 같은 필드에서 라벨과 테두리가 다른 상태를
 * 보이지 않도록 맞춘다.
 */
const labelColor = (
  tokens: RNTokens,
  { disabled, error, focused, color }: ResolvedState,
): string => {
  if (disabled) return tokens.color.text.disable;
  if (error) return tokens.color.text.error;
  if (focused) {
    return color === 'secondary' ? tokens.color.text.secondary : tokens.color.text.primary;
  }
  return tokens.color.text.default;
};

export const resolveInputLabelStyle = (tokens: RNTokens, state: ResolvedState): TextStyle => ({
  ...toTextStyle(
    state.size === 'sm' ? tokens.typography.body.tinyStrong : tokens.typography.body.smallStrong,
  ),
  color: labelColor(tokens, state),
  marginBottom: tokens.spacing.xs,
});
