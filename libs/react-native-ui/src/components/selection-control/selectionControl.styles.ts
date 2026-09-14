import type { RNTokens } from '@berrypjh/ui-core';

import type { TextStyle, ViewStyle } from 'react-native';

/**
 * Checkbox·Radio 가 공유하는 스타일 리졸버. 내부 전용 — 배럴이 없다.
 *
 * 두 컴포넌트에 같은 코드로 있던 것만 옮겼다: 루트 배치, 최소 터치 타깃, 라벨 타이포, 그리고
 * 상태 색 우선순위. 우선순위가 두 곳에 있으면 한쪽만 고쳐져 갈라진다. 모양(상자·원)과
 * 표시자(체크·점)는 각 컴포넌트가 가진다.
 */

type TypographyToken =
  | RNTokens['typography']['body']['medium']
  | RNTokens['typography']['body']['smallStrong'];

/** RN `TextStyle.fontWeight` 는 리터럴 유니언만 받는다. 값은 항상 유효한 굵기다. */
export const toTextStyle = (typography: TypographyToken, color: string): TextStyle => ({
  ...typography,
  fontWeight: typography.fontWeight as TextStyle['fontWeight'],
  color,
});

/** `filled` 는 선택됨(Checkbox 는 indeterminate 포함)이다. */
export type SelectionState = { filled: boolean; disabled: boolean; error: boolean };

export const resolveSelectionRootStyle = (tokens: RNTokens): ViewStyle => ({
  flexDirection: 'row',
  alignItems: 'center',
  alignSelf: 'flex-start',
  gap: tokens.spacing.sm,
});

/** 최소 터치 타깃. 소비자 style 뒤에 얹어 줄일 수 없다 — `ButtonBase` 와 같은 토큰·정책. */
export const resolveSelectionTouchTarget = (tokens: RNTokens): ViewStyle => ({
  minWidth: tokens.spacing['4xl'],
  minHeight: tokens.spacing['4xl'],
});

/**
 * 경계·면 색. 우선순위는 disabled > error > checked > 평상시 (Input·Label 과 같은 순서).
 * error 는 경계만 바꾸고 선택된 면은 그대로 둔다.
 */
export const resolveSelectionColors = (
  tokens: RNTokens,
  { filled, disabled, error }: SelectionState,
): Pick<ViewStyle, 'borderColor' | 'backgroundColor'> => {
  const surface = disabled
    ? tokens.color.background.disable
    : tokens.color.selectionControl.checked;

  return {
    borderColor: disabled
      ? filled
        ? surface
        : tokens.border.disabled.color
      : error
        ? tokens.color.stroke.error
        : filled
          ? surface
          : tokens.color.field.border,
    backgroundColor: filled ? surface : 'transparent',
  };
};

export const resolveSelectionLabelStyle = (tokens: RNTokens, disabled: boolean): TextStyle =>
  toTextStyle(
    tokens.typography.body.medium,
    disabled ? tokens.color.text.disable : tokens.color.text.default,
  );
