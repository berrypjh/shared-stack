import type { ButtonColor, ButtonSize, RNTokens } from '@berrypjh/ui-core';

import type { ViewStyle } from 'react-native';

/**
 * web은 컨트롤 크기를 `font-size + padding * 2`로 계산하지만, RN은 padding을 그대로 주면
 * 레이아웃이 같은 크기를 만들어 주므로 계산식을 옮기지 않습니다.
 */
const sizeSpec = (tokens: RNTokens, size: ButtonSize) => {
  const { spacing, typography } = tokens;

  if (size === 'sm') return { glyph: typography.fontSize.md, padding: spacing.sm };
  if (size === 'lg') return { glyph: typography.fontSize.xxl, padding: spacing.md };
  return { glyph: typography.fontSize.xl, padding: spacing.sm };
};

/**
 * IconButton의 면·아이콘 스타일과 content color를 토큰으로 풉니다.
 *
 * 면은 항상 투명합니다. 색이 바뀌는 것은 hover/pressed뿐인데 pressed 색 토큰이 없고
 * `hover`는 web 전용 이름이라 돌려쓰지 않습니다. 토큰이 생기면 `surface.backgroundColor`
 * 한 줄이 바뀝니다.
 *
 * 아이콘 색에는 `color.icon.*`을 씁니다. `text.*`와 값은 같지만 아이콘 컨트롤에는 이쪽이
 * 시맨틱하게 맞습니다 (web이 `text.*`를 쓰는 건 CSS `color`가 글리프까지 상속하기 때문입니다).
 */
export const resolveIconButtonStyles = ({
  tokens,
  size,
  color,
  disabled,
}: {
  tokens: RNTokens;
  size: ButtonSize;
  color: ButtonColor;
  disabled: boolean;
}): { surface: ViewStyle; icon: ViewStyle; glyph: number; contentColor: string } => {
  const { glyph, padding } = sizeSpec(tokens, size);

  const contentColor = disabled
    ? tokens.color.icon.disable
    : color === 'secondary'
      ? tokens.color.icon.secondary
      : tokens.color.icon.primary;

  return {
    surface: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      borderRadius: tokens.radius.rounded,
      padding,
    },
    icon: {
      width: glyph,
      height: glyph,
      alignItems: 'center',
      justifyContent: 'center',
    },
    glyph,
    contentColor,
  };
};
