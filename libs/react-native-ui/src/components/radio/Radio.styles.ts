import type { RNTokens } from '@berrypjh/ui-core';

import type { TextStyle, ViewStyle } from 'react-native';

import {
  resolveSelectionColors,
  type SelectionState,
  toTextStyle,
} from '../selection-control/selectionControl.styles';

export const resolveRadioGroupStyle = (): ViewStyle => ({
  alignItems: 'flex-start',
});

/** 필드 라벨과 같은 타이포 (InputLabel). */
export const resolveRadioGroupLabelStyle = (tokens: RNTokens, disabled: boolean): TextStyle =>
  toTextStyle(
    tokens.typography.body.smallStrong,
    disabled ? tokens.color.text.disable : tokens.color.text.default,
  );

/** 시각 원. 상태 색은 선택 컨트롤 공통 우선순위를 따르고 모양만 둥글다. */
export const resolveRadioCircleStyle = (tokens: RNTokens, state: SelectionState): ViewStyle => ({
  width: tokens.spacing.lg,
  height: tokens.spacing.lg,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: tokens.radius.rounded,
  borderWidth: tokens.borderWidth.semantic.default,
  ...resolveSelectionColors(tokens, state),
});

/** 선택 표시자: 가운데 점. 크기는 web `radio.scss` 의 `::before` 와 같다. */
export const resolveRadioDotStyle = (tokens: RNTokens): ViewStyle => ({
  width: tokens.spacing.sm,
  height: tokens.spacing.sm,
  borderRadius: tokens.radius.rounded,
  backgroundColor: tokens.color.selectionControl.indicator,
});
