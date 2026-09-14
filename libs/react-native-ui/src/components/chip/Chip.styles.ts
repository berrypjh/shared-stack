import type { ChipSize, ChipVariant, RNTokens } from '@berrypjh/ui-core';

import type { TextStyle, ViewStyle } from 'react-native';

/**
 * Chip 스타일 리졸버. 내부 전용 — 배럴이 없다.
 *
 * 크기·면·상태는 web `chip.scss` 와 **같은 토큰**을 고른다. 갈라지면 ui-core
 * `ChipSemanticProps` 가 공유 계약인 근거가 사라진다.
 *
 * RN 에는 `hover`·`focus-visible` 이 없다 — 그래서 상태는 `pressed`·`selected`·`disabled`
 * 셋뿐이다. 없는 상태를 지어내지 않는다.
 */

const SIZE_PADDING_X = {
  sm: 'sm',
  md: 'md',
} as const satisfies Record<ChipSize, keyof RNTokens['spacing']>;

const SIZE_PADDING_Y = {
  sm: '2xs',
  md: 'xs',
} as const satisfies Record<ChipSize, keyof RNTokens['spacing']>;

const SIZE_GAP = {
  sm: '2xs',
  md: 'xs',
} as const satisfies Record<ChipSize, keyof RNTokens['spacing']>;

const SIZE_TYPOGRAPHY = {
  sm: 'tiny',
  md: 'small',
} as const satisfies Record<ChipSize, keyof RNTokens['typography']['body']>;

/** 실제로 읽는 타이포 잎에서 유도한다 — 목록이 갈라지면 여기서 함께 깨진다. */
type TypographyToken = RNTokens['typography']['body'][(typeof SIZE_TYPOGRAPHY)[ChipSize]];

/**
 * 시각에 영향을 주는 상태 전부.
 *
 * `interactive` 는 여기 없다 — RN 에는 `cursor` 가 없어서 누를 수 있다는 사실이 시각을 바꾸지
 * 않는다 (web 은 `cursor: pointer` 와 transition 이 달라서 클래스로 가른다).
 */
export type ChipVisualState = {
  size: ChipSize;
  variant: ChipVariant;
  selected: boolean;
  disabled: boolean;
  pressed: boolean;
};

/**
 * 평상시 면. `outlined` 는 투명, `filled` 는 옅은 면.
 *
 * web `chip.scss` 의 `--ui-chip-surface` 와 같은 토큰이다.
 */
const restingSurface = (tokens: RNTokens, variant: ChipVariant): string =>
  variant === 'filled' ? tokens.color.field.surfaceSubtle : 'transparent';

/**
 * 면과 테두리.
 *
 * 우선순위는 disabled > selected > 평상시다 (Input·Label·Checkbox 와 같은 순서). 선택 표시는
 * **면과 테두리를 함께** 바꾼다 — 색 하나에만 기대면 그 색을 못 보는 사용자에게 상태가 사라진다.
 */
const resolveSurface = (
  tokens: RNTokens,
  { variant, selected, disabled }: ChipVisualState,
): Pick<ViewStyle, 'backgroundColor' | 'borderColor'> => {
  if (disabled) {
    return {
      backgroundColor: selected ? tokens.color.background.disable : 'transparent',
      borderColor: tokens.border.disabled.color,
    };
  }

  if (selected) {
    return {
      backgroundColor: tokens.color.background.selected,
      borderColor: tokens.color.selectionControl.checked,
    };
  }

  return {
    backgroundColor: restingSurface(tokens, variant),
    borderColor: tokens.color.field.border,
  };
};

/**
 * 루트 상자.
 *
 * **최소 터치 타깃을 여기서 얹지 않는다** — interactive 일 때는 `ButtonBase` 가 소비자 style
 * 뒤에 얹어 줄일 수 없게 하고, passive 는 누를 수 없으니 필요가 없다.
 *
 * `pressed` 는 **색이 아니라 위치**다 (`component.pressedOffset`). 이 저장소의 정본 표현이고
 * `contrast.test.ts` 의 `pressed 상태 어휘` 가 `color.*pressed*` 토큰 생성을 막는다.
 */
export const resolveChipRootStyle = (tokens: RNTokens, state: ChipVisualState): ViewStyle => ({
  flexDirection: 'row',
  alignItems: 'center',
  alignSelf: 'flex-start',
  gap: tokens.spacing[SIZE_GAP[state.size]],

  paddingHorizontal: tokens.spacing[SIZE_PADDING_X[state.size]],
  paddingVertical: tokens.spacing[SIZE_PADDING_Y[state.size]],
  borderRadius: tokens.radius.rounded,
  borderWidth: tokens.border.primary.width,

  ...resolveSurface(tokens, state),

  ...(state.pressed && !state.disabled
    ? { transform: [{ translateY: tokens.component.pressedOffset }] }
    : null),
});

const toTextStyle = (typography: TypographyToken, color: string): TextStyle => ({
  ...typography,
  fontWeight: typography.fontWeight as TextStyle['fontWeight'],
  color,
});

/** 라벨. disabled 만 색을 바꾼다 — selected 는 면·테두리가 표현한다. */
export const resolveChipLabelStyle = (
  tokens: RNTokens,
  { size, disabled }: Pick<ChipVisualState, 'size' | 'disabled'>,
): TextStyle =>
  toTextStyle(
    tokens.typography.body[SIZE_TYPOGRAPHY[size]],
    disabled ? tokens.color.text.disable : tokens.color.text.default,
  );
