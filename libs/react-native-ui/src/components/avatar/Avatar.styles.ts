import type { AvatarShape, AvatarSize, RNTokens } from '@berrypjh/ui-core';

import type { ImageStyle, TextStyle, ViewStyle } from 'react-native';

/**
 * Avatar 스타일 리졸버. 내부 전용 — 배럴이 없다.
 *
 * 크기·모양은 web `avatar.scss` 와 **같은 토큰**을 고른다 (size → `spacing.xl`/`2xl`/`4xl`,
 * shape → `radius.rounded`/`radius.md`). 갈라지면 ui-core `AvatarSemanticProps` 가 공유 계약인
 * 근거가 사라진다.
 *
 * 상태 스타일이 없다 — Avatar 는 정적이다.
 */

const SIZE_SPACING = {
  sm: 'xl',
  md: '2xl',
  lg: '4xl',
} as const satisfies Record<AvatarSize, keyof RNTokens['spacing']>;

const SIZE_TYPOGRAPHY = {
  sm: 'tinyStrong',
  md: 'smallStrong',
  lg: 'mediumStrong',
} as const satisfies Record<AvatarSize, keyof RNTokens['typography']['body']>;

/** 실제로 읽는 타이포 잎에서 유도한다 — 목록이 갈라지면 여기서 함께 깨진다. */
type TypographyToken = RNTokens['typography']['body'][(typeof SIZE_TYPOGRAPHY)[AvatarSize]];

const SHAPE_RADIUS = {
  circle: 'rounded',
  rounded: 'md',
} as const satisfies Record<AvatarShape, keyof RNTokens['radius']>;

export const resolveAvatarDiameter = (tokens: RNTokens, size: AvatarSize): number =>
  tokens.spacing[SIZE_SPACING[size]];

export const resolveAvatarRadius = (tokens: RNTokens, shape: AvatarShape): number =>
  tokens.radius[SHAPE_RADIUS[shape]];

/**
 * 루트 상자.
 *
 * `overflow: 'hidden'` 이 이미지와 긴 이니셜을 모양대로 잘라낸다 — web `overflow: hidden` 과
 * 같은 역할이다. 최소 터치 타깃은 **얹지 않는다**: 상호작용이 없는 것을 48dp 로 부풀리면
 * 레이아웃만 망가진다.
 */
export const resolveAvatarRootStyle = (
  tokens: RNTokens,
  size: AvatarSize,
  shape: AvatarShape,
): ViewStyle => {
  const diameter = resolveAvatarDiameter(tokens, size);

  return {
    width: diameter,
    height: diameter,
    borderRadius: resolveAvatarRadius(tokens, shape),
    backgroundColor: tokens.color.background.grey,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };
};

/** 이미지는 상자를 꽉 채운다. 자르기는 `resizeMode="cover"` 가 한다. */
export const resolveAvatarImageStyle = (
  tokens: RNTokens,
  size: AvatarSize,
  shape: AvatarShape,
): ImageStyle => {
  const diameter = resolveAvatarDiameter(tokens, size);

  return {
    width: diameter,
    height: diameter,
    // 루트의 `overflow: hidden` 만으로는 Android 에서 모서리가 남는다. 이미지에도 직접 준다.
    borderRadius: resolveAvatarRadius(tokens, shape),
  };
};

const toTextStyle = (typography: TypographyToken, color: string): TextStyle => ({
  ...typography,
  fontWeight: typography.fontWeight as TextStyle['fontWeight'],
  color,
});

/**
 * 이니셜.
 *
 * 토큰 `lineHeight` 를 그대로 둔다 — 루트가 고정 높이 + `justifyContent: 'center'` 라
 * 줄 높이가 상자를 늘리지 못하고, 세 size 모두 줄 높이가 지름보다 작다 (16<24, 20<32, 24<48).
 */
export const resolveAvatarFallbackStyle = (tokens: RNTokens, size: AvatarSize): TextStyle =>
  toTextStyle(tokens.typography.body[SIZE_TYPOGRAPHY[size]], tokens.color.text.default);
