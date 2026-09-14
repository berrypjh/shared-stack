import type { RNTokens } from '@berrypjh/ui-core';

import type { TextStyle, ViewStyle } from 'react-native';

/**
 * 지우기 버튼. `ButtonBase`를 쓰지 않습니다 — 자기 여백·크기 정책을 들고 오는데 필드 안
 * 슬롯에는 맞지 않고, 필요한 역할·라벨·터치 타깃은 `Pressable`이 직접 줍니다.
 */
export const resolveClearButtonStyle = (tokens: RNTokens): ViewStyle => ({
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: tokens.spacing['4xl'],
  minHeight: tokens.spacing['4xl'],
});

/** 아이콘 원시가 없어 글리프를 Text로 그립니다 (Select 인디케이터와 같은 수단). */
export const resolveClearGlyphStyle = (tokens: RNTokens): TextStyle => ({
  color: tokens.color.text.light,
  fontSize: tokens.typography.body.medium.fontSize,
});

/**
 * 제안 목록 패널. 입력 아래 일반 흐름에 놓습니다 — web 의 `position:absolute`·`z-index` 는
 * DOM 레이아웃 수단이라 옮기지 않습니다. 흐름 안 패널이라 그림자 없이 테두리로 충분합니다.
 */
export const resolveSuggestionPanelStyle = (tokens: RNTokens): ViewStyle => ({
  marginTop: tokens.spacing.sm,
  paddingVertical: tokens.spacing.xs,
  backgroundColor: tokens.color.background.surface,
  borderColor: tokens.color.field.border,
  borderWidth: tokens.border.primary.width,
  borderRadius: tokens.radius.xl,
});

/** 제안 행. 최소 높이는 Select 선택지와 같은 시각 기준선(sm 필드 높이 vs 터치 타깃)입니다. */
export const resolveSuggestionRowStyle = (
  tokens: RNTokens,
  { selected }: { selected: boolean },
): ViewStyle => ({
  justifyContent: 'center',
  gap: tokens.spacing.xs,
  paddingHorizontal: tokens.spacing.lg,
  paddingVertical: tokens.spacing.sm,
  minHeight: Math.max(tokens.component.field.height.sm, tokens.spacing['4xl']),
  backgroundColor: selected ? tokens.color.background.selected : 'transparent',
});

/** 행 라벨. disabled > 평상시 — 다른 컴포넌트와 같은 우선순위입니다. */
export const resolveSuggestionLabelStyle = (
  tokens: RNTokens,
  { disabled }: { disabled: boolean },
): TextStyle => ({
  ...tokens.typography.body.medium,
  fontWeight: tokens.typography.body.medium.fontWeight as TextStyle['fontWeight'],
  color: disabled ? tokens.color.text.disable : tokens.color.text.default,
});

/** 보조 설명. 라벨보다 약한 위계라 보조 텍스트 색과 작은 타이포를 씁니다. */
export const resolveSuggestionDescriptionStyle = (
  tokens: RNTokens,
  { disabled }: { disabled: boolean },
): TextStyle => ({
  ...tokens.typography.body.small,
  fontWeight: tokens.typography.body.small.fontWeight as TextStyle['fontWeight'],
  color: disabled ? tokens.color.text.disable : tokens.color.text.light,
});

/** 후보가 없을 때의 안내 텍스트. 행이 아니라서 터치 타깃 하한이 없습니다. */
export const resolveSuggestionEmptyStyle = (tokens: RNTokens): TextStyle => ({
  ...tokens.typography.body.small,
  fontWeight: tokens.typography.body.small.fontWeight as TextStyle['fontWeight'],
  color: tokens.color.text.light,
  paddingHorizontal: tokens.spacing.lg,
  paddingVertical: tokens.spacing.sm,
});
