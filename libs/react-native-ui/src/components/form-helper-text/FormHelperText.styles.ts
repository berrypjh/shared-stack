import type { RNTokens } from '@berrypjh/ui-core';

import type { TextStyle } from 'react-native';

type TypographyToken = RNTokens['typography']['caption']['small'];

/**
 * 토큰 typography를 `TextStyle`로 좁힌다.
 *
 * `RNTokens`는 7개 테마가 한 타입에 들어가도록 리터럴을 넓혀(`400` → `number`) 두는데
 * `TextStyle.fontWeight`는 100~900 리터럴만 받는다. 값은 항상 유효한 굵기다.
 */
const toTextStyle = (typography: TypographyToken): TextStyle => ({
  ...typography,
  fontWeight: typography.fontWeight as TextStyle['fontWeight'],
});

/** 우선순위는 disabled > error > 평상시 — `InputBase.borderSpec`·`InputLabel`과 같은 순서다. */
export const resolveFormHelperTextStyle = (
  tokens: RNTokens,
  { disabled, error }: { disabled: boolean; error: boolean },
): TextStyle => ({
  ...toTextStyle(tokens.typography.caption.small),
  color: disabled
    ? tokens.color.text.disable
    : error
      ? tokens.color.text.error
      : tokens.color.text.light,
  marginTop: tokens.spacing.xs,
});
