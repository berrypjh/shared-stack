import type { RNTokens } from '@berrypjh/ui-core';

import type { ViewStyle } from 'react-native';

import {
  resolveSelectionColors,
  type SelectionState,
} from '../selection-control/selectionControl.styles';

/** 시각 상자. 상태 색은 선택 컨트롤 공통 우선순위를 따른다. */
export const resolveCheckboxBoxStyle = (tokens: RNTokens, state: SelectionState): ViewStyle => ({
  width: tokens.spacing.lg,
  height: tokens.spacing.lg,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: tokens.radius.xs,
  borderWidth: tokens.borderWidth.semantic.default,
  ...resolveSelectionColors(tokens, state),
});

/**
 * 체크 글리프: 오른쪽·아래 테두리만 있는 상자를 45도 돌린다. 아이콘 의존성을 쓰지 않는다.
 * 비율은 web `checkbox.scss` 의 `::before` 와 같다.
 */
export const resolveCheckmarkStyle = (tokens: RNTokens): ViewStyle => {
  const size = tokens.spacing.lg;
  const stroke = tokens.borderWidth.semantic.default;

  return {
    width: size * 0.3,
    height: size * 0.55,
    borderColor: tokens.color.selectionControl.indicator,
    borderRightWidth: stroke,
    borderBottomWidth: stroke,
    transform: [{ translateY: -size * 0.06 }, { rotate: '45deg' }],
  };
};

/** 혼합 상태 글리프: 가로 막대. */
export const resolveDashStyle = (tokens: RNTokens): ViewStyle => ({
  width: tokens.spacing.lg * 0.5,
  height: tokens.borderWidth.semantic.default,
  backgroundColor: tokens.color.selectionControl.indicator,
});
