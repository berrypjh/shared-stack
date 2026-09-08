import type { FieldColor, FieldSize, FieldVariant, RNTokens } from '@berrypjh/ui-core';

import type { TextStyle, ViewStyle } from 'react-native';

/** design-tokens의 typography 잎. */
type TypographyToken = RNTokens['typography']['body']['medium'];

/**
 * 토큰 typography를 RN `TextStyle`로 좁힙니다.
 *
 * `RNTokens`는 7개 테마를 한 타입에 담으려고 리터럴을 넓히는데(`400` → `number`),
 * `TextStyle.fontWeight`는 100~900 리터럴 유니언만 받습니다. 값은 항상 유효한 굵기입니다.
 */
const toTextStyle = (typography: TypographyToken, color: string): TextStyle => ({
  ...typography,
  fontWeight: typography.fontWeight as TextStyle['fontWeight'],
  color,
});

type Resolved = {
  container: ViewStyle;
  /** error·disabled일 때 소비자 containerStyle 뒤에 다시 얹습니다. 평상시 `null`. */
  containerStateCritical: ViewStyle | null;
  input: TextStyle;
  /** disabled일 때 소비자 style 뒤에 다시 얹습니다. 활성 상태면 `null`. */
  inputStateCritical: TextStyle | null;
  placeholderTextColor: string;
};

type ChromeState = {
  focused: boolean;
  error: boolean;
  disabled: boolean;
  color: FieldColor;
};

const sizeSpec = (tokens: RNTokens, size: FieldSize) => {
  const { spacing, typography, component } = tokens;

  if (size === 'sm') {
    return {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fieldHeight: component.field.height.sm,
      typography: typography.body.small,
    };
  }
  return {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fieldHeight: component.field.height.md,
    typography: typography.body.medium,
  };
};

/** focus 시 활성 테두리 색. */
const activeColor = (tokens: RNTokens, color: FieldColor) =>
  color === 'secondary' ? tokens.color.stroke.secondary : tokens.border.primary.color;

/**
 * 상태별 테두리 색과 두께. 우선순위는 disabled > error > focused > 평상시.
 *
 * 두께는 focus 했을 때만 굵어집니다 — web이 box-shadow를 겹쳐 만들던 효과를
 * `component.field.focusRingWidth`로 표현한 것입니다. error는 색만 바꿉니다.
 */
const borderSpec = (tokens: RNTokens, { focused, error, disabled, color }: ChromeState) => ({
  borderColor: disabled
    ? tokens.border.disabled.color
    : error
      ? tokens.color.stroke.error
      : focused
        ? activeColor(tokens, color)
        : tokens.color.field.border,
  borderWidth:
    focused && !disabled ? tokens.component.field.focusRingWidth : tokens.border.primary.width,
});

/**
 * variant별 표면. `transparent`는 "표면 없음"의 프레임워크 표현이라 토큰을 만들지 않습니다.
 *
 * - plain: 없음
 * - filled: 항상 `field.surface` — 비활성이어도 filled다 (web도 같은 결정)
 * - boxed: 평상시 없음, disabled일 때만 `field.surfaceSubtle` (표면이 상태를 타는 유일한 variant)
 */
const surfaceFor = (tokens: RNTokens, variant: FieldVariant, disabled: boolean) => {
  if (variant === 'filled') {
    return tokens.color.field.surface;
  }
  if (variant === 'boxed' && disabled) {
    return tokens.color.field.surfaceSubtle;
  }
  return 'transparent';
};

/**
 * variant × 상태 chrome. 축은 표면(`surfaceFor`)과 상자 모양 둘뿐이라, 테두리·radius가 같은
 * filled·boxed를 한 갈래로 묶습니다. plain만 상자가 아니라 밑줄입니다.
 *
 * focus halo는 만들지 않습니다. web은 box-shadow halo를 그리면서 primary일 때 버튼 토큰
 * (`primaryBtn.outlinedHover`)을 빌려 쓰는데, field 전용 primary halo 토큰이 없습니다.
 * 대신 active 테두리만 굵게 합니다.
 *
 * chrome은 항상 래퍼 View가 가집니다 — TextInput에 얹으면 한쪽 테두리·radius의 플랫폼 차이로
 * multiline에서 깨집니다.
 */
const chromeSpec = (
  tokens: RNTokens,
  variant: FieldVariant | undefined,
  state: ChromeState,
  radius: number | undefined,
): ViewStyle | null => {
  if (!variant) {
    return null;
  }

  const { borderColor, borderWidth } = borderSpec(tokens, state);
  const backgroundColor = surfaceFor(tokens, variant, state.disabled);

  if (variant === 'plain') {
    return {
      backgroundColor,
      borderRadius: 0,
      borderBottomWidth: borderWidth,
      borderBottomColor: borderColor,
    };
  }

  return { backgroundColor, borderRadius: radius ?? tokens.radius.md, borderWidth, borderColor };
};

/** plain은 밑줄이 필드 폭을 채워야 해서 가로 여백이 없습니다. */
const paddingHorizontalFor = (variant: FieldVariant | undefined, fromSize: number) =>
  variant === 'plain' ? 0 : fromSize;

/**
 * variant × 상태 × size를 토큰 값으로 풉니다.
 *
 * 최소 높이는 `component.field.height`와 터치 타깃 중 큰 값입니다 — `field.height.sm`(40)이
 * 모바일 최소 터치 타깃(`spacing.4xl`, 48)보다 작습니다.
 */
export const resolveInputBaseStyles = ({
  tokens,
  variant,
  size,
  color,
  focused,
  error,
  disabled,
  radius,
}: {
  tokens: RNTokens;
  variant: FieldVariant | undefined;
  size: FieldSize;
  color: FieldColor;
  focused: boolean;
  error: boolean;
  disabled: boolean;
  radius?: number;
}): Resolved => {
  const { paddingHorizontal, paddingVertical, fieldHeight, typography } = sizeSpec(tokens, size);
  const chrome = chromeSpec(tokens, variant, { focused, error, disabled, color }, radius);

  return {
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing.sm,
      paddingHorizontal: paddingHorizontalFor(variant, paddingHorizontal),
      minHeight: Math.max(fieldHeight, tokens.spacing['4xl']),
      ...chrome,
    },
    // error·disabled는 소비자가 지울 수 없는 피드백이다. focus는 평범한 상태라 제외한다.
    containerStateCritical: chrome && (error || disabled) ? chrome : null,
    input: {
      // 가로 여백은 래퍼가 가집니다. TextInput은 남은 폭만 채웁니다.
      flex: 1,
      paddingVertical,
      ...toTextStyle(typography, tokens.color.text.default),
    },
    inputStateCritical: disabled ? { color: tokens.color.text.disable } : null,
    placeholderTextColor: tokens.color.text.placeholder,
  };
};
