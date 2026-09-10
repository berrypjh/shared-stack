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
 * 면 **색**은 상태를 타지 않습니다 — 항상 투명합니다. web 에서 면 색이 바뀌는 것은 hover
 * 뿐이고 `hover`는 web 전용 이름이라 pressed로 돌려쓰지 않습니다. 눌림은 색이 아니라
 * 위치라서 `component.pressedOffset` 만큼 면을 내립니다 (Button 과 같은 언어).
 *
 * 옮기는 것은 **면**이지 루트가 아닙니다. 루트는 최소 터치 타깃을 지키는 상자라 제자리에
 * 둡니다 — 눌렀다고 터치 영역이 움직이면 손가락이 경계에서 빠집니다.
 *
 * 아이콘 색에는 `color.icon.*`을 씁니다. `text.*`와 값은 같지만 아이콘 컨트롤에는 이쪽이
 * 시맨틱하게 맞습니다 (web이 `text.*`를 쓰는 건 CSS `color`가 글리프까지 상속하기 때문입니다).
 */
export const resolveIconButtonStyles = ({
  tokens,
  size,
  color,
  disabled,
  pressed,
}: {
  tokens: RNTokens;
  size: ButtonSize;
  color: ButtonColor;
  disabled: boolean;
  pressed: boolean;
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
      ...(pressed ? { transform: [{ translateY: tokens.component.pressedOffset }] } : null),
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
