import type { RNTokens } from '@berrypjh/ui-core';

import type { TextStyle, ViewStyle } from 'react-native';

/** design-tokens의 typography 잎. */
type TypographyToken = RNTokens['typography']['body']['smallStrong'];

/**
 * 토큰 typography를 RN `TextStyle`로 좁힙니다.
 *
 * `RNTokens`는 7개 테마가 한 타입에 대입되도록 리터럴을 넓혀(`600` → `number`) 두는데,
 * RN `TextStyle.fontWeight`는 100~900 리터럴 유니언만 받습니다. 값은 항상 유효한 굵기입니다.
 */
const toTextStyle = (typography: TypographyToken, color: string): TextStyle => ({
  ...typography,
  fontWeight: typography.fontWeight as TextStyle['fontWeight'],
  color,
});

/**
 * 트랙(루트) style.
 *
 * web 은 `rgb(var(--ds-background-grey-rgb) / 0.15)` 로 반투명 중립 표면을 만들지만,
 * `*-rgb` 변형은 CSS 전용이라 Native 트리에 없습니다. RGBA 를 손으로 지어내는 대신
 * `background.default` 를 씁니다 — 카드(`background.surface`) 위에서 살짝 눌린 트랙으로
 * 읽히고 모든 테마에서 함께 반전합니다. (`field.surface*` 는 테마를 따라 반전하지 않아
 * 어두운 테마에서 흰 트랙이 됩니다.)
 */
export const resolveSegmentRootStyle = (tokens: RNTokens): ViewStyle => ({
  flexDirection: 'row',
  alignSelf: 'flex-start',
  backgroundColor: tokens.color.background.default,
  borderRadius: tokens.radius.xs,
  padding: tokens.spacing['2xs'],
  gap: tokens.spacing.xs,
});

type OptionState = { selected: boolean; disabled: boolean };

/** 세그먼트 하나의 표면. 선택 표현은 소비자가 덮을 수 없도록 컴포넌트가 마지막에 얹습니다. */
export const resolveSegmentOptionStyle = (
  tokens: RNTokens,
  { selected }: OptionState,
): ViewStyle => ({
  paddingHorizontal: tokens.spacing.sm,
  paddingVertical: tokens.spacing.xs,
  borderRadius: tokens.radius.xs,
  backgroundColor: selected ? tokens.color.background.primary : 'transparent',
});

/** 세그먼트 라벨. disabled > selected > 평상시 (Input·Label 과 같은 순서). */
export const resolveSegmentLabelStyle = (
  tokens: RNTokens,
  { selected, disabled }: OptionState,
): TextStyle =>
  toTextStyle(
    tokens.typography.body.smallStrong,
    disabled
      ? tokens.color.text.disable
      : selected
        ? tokens.color.text.contrastText
        : tokens.color.text.light,
  );
