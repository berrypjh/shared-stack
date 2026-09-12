import type {
  BadgeIntent,
  BadgePlacement,
  BadgeSize,
  BadgeVariant,
  RNTokens,
} from '@berrypjh/ui-core';

import type { TextStyle, ViewStyle } from 'react-native';

/**
 * Badge 스타일 리졸버. 내부 전용 — 배럴이 없다.
 *
 * 크기·면·타이포는 web `badge.scss` 와 **같은 토큰**을 고른다. 갈라지면 ui-core
 * `BadgeSemanticProps` 가 공유 계약인 근거가 사라진다.
 *
 * 상태 스타일이 없다 — Badge 는 정적이다.
 */

const SIZE_SPACING = {
  sm: 'lg',
  md: 'xl',
} as const satisfies Record<BadgeSize, keyof RNTokens['spacing']>;

/** dot 은 글자가 없어 지름이 typography 와 무관하다. */
const DOT_SPACING = {
  sm: 'sm',
  md: 'md',
} as const satisfies Record<BadgeSize, keyof RNTokens['spacing']>;

const SIZE_PADDING = {
  sm: '2xs',
  md: 'xs',
} as const satisfies Record<BadgeSize, keyof RNTokens['spacing']>;

const SIZE_TYPOGRAPHY = {
  sm: 'tiny',
  md: 'small',
} as const satisfies Record<BadgeSize, keyof RNTokens['typography']['body']>;

/** 실제로 읽는 타이포 잎에서 유도한다 — 목록이 갈라지면 여기서 함께 깨진다. */
type TypographyToken = RNTokens['typography']['body'][(typeof SIZE_TYPOGRAPHY)[BadgeSize]];

export type BadgeIndicatorSpec = {
  variant: BadgeVariant;
  size: BadgeSize;
  intent: BadgeIntent;
  placement: BadgePlacement;
};

/**
 * 면과 전경.
 *
 * `warning`·`success` 가 없는 것은 의도다 — 7개 테마 실측에서 그 면 위의 `text.contrastText`
 * 가 ember 에서 4.35·4.34 로 AA(4.5)에 미달한다.
 *
 * `neutral` 만 전경이 다르다: `background.grey` 위에서 `text.default` 는 6.89 로 통과하고
 * `text.contrastText` 는 1.77 로 실패한다.
 */
export const resolveBadgeSurface = (
  tokens: RNTokens,
  intent: BadgeIntent,
): { backgroundColor: string; color: string } => {
  const { background, text } = tokens.color;

  if (intent === 'neutral') {
    return { backgroundColor: background.grey, color: text.default };
  }

  return { backgroundColor: background[intent], color: text.contrastText };
};

/**
 * 앵커 모서리에 걸치는 오프셋.
 *
 * **논리 방향(`start`/`end`)을 쓴다** — RN 의 `start`/`end` 는 쓰기 방향을 따라가므로 RTL 에서
 * 좌우가 자동으로 뒤집힌다. `left`/`right` 를 쓰면 RTL 에서 배지가 반대편으로 간다.
 *
 * 키를 계산해서 만들지 않고 분기를 펼친다 — 계산된 키는 `{ [x: string]: number }` 로 좁혀져
 * `ViewStyle` 에 대입되지 않는다.
 */
const resolvePlacement = (placement: BadgePlacement, diameter: number): ViewStyle => {
  const offset = -diameter / 2;

  switch (placement) {
    case 'top-end':
      return { top: offset, end: offset };
    case 'top-start':
      return { top: offset, start: offset };
    case 'bottom-end':
      return { bottom: offset, end: offset };
    case 'bottom-start':
      return { bottom: offset, start: offset };
  }
};

/** 루트는 위치 기준만 만든다. 앵커는 그대로 흐르고 래퍼가 레이아웃을 넓히지 않는다. */
export const resolveBadgeRootStyle = (): ViewStyle => ({
  position: 'relative',
  alignSelf: 'flex-start',
});

export const resolveBadgeIndicatorStyle = (
  tokens: RNTokens,
  { variant, size, intent, placement }: BadgeIndicatorSpec,
): ViewStyle => {
  const isDot = variant === 'dot';
  const diameter = isDot ? tokens.spacing[DOT_SPACING[size]] : tokens.spacing[SIZE_SPACING[size]];

  return {
    position: 'absolute',
    ...resolvePlacement(placement, diameter),

    ...(isDot
      ? { width: diameter, paddingHorizontal: 0 }
      : { minWidth: diameter, paddingHorizontal: tokens.spacing[SIZE_PADDING[size]] }),
    height: diameter,

    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radius.rounded,
    backgroundColor: resolveBadgeSurface(tokens, intent).backgroundColor,

    /**
     * 앵커와 배지를 가르는 링.
     *
     * 배지 면은 어떤 앵커 위에든 올라갈 수 있어서 인접색을 고정할 수 없다 (Avatar 의
     * `background.grey` 위에서는 dark 계열에서 1.24 까지 떨어진다 — 실측). 링은 색이 아니라
     * **모양 경계**를 만들어 그 상황에서도 배지가 사라지지 않게 한다.
     */
    borderWidth: tokens.borderWidth.semantic.divider,
    borderColor: tokens.color.background.default,
  };
};

const toTextStyle = (typography: TypographyToken, color: string): TextStyle => ({
  ...typography,
  fontWeight: typography.fontWeight as TextStyle['fontWeight'],
  color,
});

/**
 * 숫자.
 *
 * 토큰 `lineHeight` 를 그대로 둔다 — 표시자가 고정 높이 + `justifyContent: 'center'` 이고
 * 두 size 모두 줄 높이가 높이 이하다 (sm 16≤16, md 20≤24).
 */
export const resolveBadgeValueStyle = (
  tokens: RNTokens,
  size: BadgeSize,
  intent: BadgeIntent,
): TextStyle =>
  toTextStyle(
    tokens.typography.body[SIZE_TYPOGRAPHY[size]],
    resolveBadgeSurface(tokens, intent).color,
  );
