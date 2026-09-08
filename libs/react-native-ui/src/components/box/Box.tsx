import { View } from 'react-native';

import type { BoxProps, BoxRadiusValue, BoxSpacingValue, RNTokens } from '@berrypjh/ui-core';
import { getColor } from '@berrypjh/ui-core';

import type { Ref } from 'react';
import type { StyleProp, View as RNView, ViewProps, ViewStyle } from 'react-native';

import { useTheme } from '../../theme';

const spacingToNumber = (
  themeTokens: RNTokens,
  v: BoxSpacingValue | undefined,
): number | undefined => {
  if (v === undefined) return undefined;
  if (typeof v === 'number') return v;
  return themeTokens.spacing[v];
};

const radiusToNumber = (
  themeTokens: RNTokens,
  v: BoxRadiusValue | undefined,
): number | undefined => {
  if (v === undefined) return undefined;
  if (typeof v === 'number') return v;
  return themeTokens.radius[v];
};

export type NativeBoxProps = BoxProps &
  Omit<ViewProps, keyof BoxProps> & {
    /**
     * 호스트 `View`. `ViewProps` 에는 `ref` 필드가 없어서 공개 컴포넌트마다 직접 선언합니다
     * (Button·Select·TextField 등과 같은 규약).
     */
    ref?: Ref<RNView>;

    style?: StyleProp<ViewStyle>;
  };

export const Box = ({
  style,
  p,
  px,
  py,
  pt,
  pr,
  pb,
  pl,
  m,
  mx,
  my,
  mt,
  mr,
  mb,
  ml,
  bg,
  radius,
  ...rest
}: NativeBoxProps) => {
  const theme = useTheme();
  const t = theme.tokens;

  const computed: ViewStyle = {};

  // padding
  const pTop = spacingToNumber(t, pt ?? py ?? p);
  const pRight = spacingToNumber(t, pr ?? px ?? p);
  const pBottom = spacingToNumber(t, pb ?? py ?? p);
  const pLeft = spacingToNumber(t, pl ?? px ?? p);

  if (pTop !== undefined) computed.paddingTop = pTop;
  if (pRight !== undefined) computed.paddingRight = pRight;
  if (pBottom !== undefined) computed.paddingBottom = pBottom;
  if (pLeft !== undefined) computed.paddingLeft = pLeft;

  // margin
  const mTop = spacingToNumber(t, mt ?? my ?? m);
  const mRight = spacingToNumber(t, mr ?? mx ?? m);
  const mBottom = spacingToNumber(t, mb ?? my ?? m);
  const mLeft = spacingToNumber(t, ml ?? mx ?? m);

  if (mTop !== undefined) computed.marginTop = mTop;
  if (mRight !== undefined) computed.marginRight = mRight;
  if (mBottom !== undefined) computed.marginBottom = mBottom;
  if (mLeft !== undefined) computed.marginLeft = mLeft;

  // visuals
  if (bg) computed.backgroundColor = getColor(theme, bg);

  const r = radiusToNumber(t, radius);
  if (r !== undefined) computed.borderRadius = r;

  return <View {...rest} style={[computed, style]} />;
};
