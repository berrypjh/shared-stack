import type { CSSProperties } from 'react';

import type { BoxRadiusValue, BoxSpacingValue, BoxStyleProps, ColorToken } from './Box.types';

/** spacing 토큰·숫자 → CSS 값, 숫자는 px (`12` → `12px`, `md` → `var(--ds-spacing-md)`) */
export const spacingToCss = (value: BoxSpacingValue | undefined): string | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === 'number') {
    return `${value}px`;
  }

  return `var(--ds-spacing-${value})`;
};

/** radius 토큰·숫자 → CSS border-radius 값, 숫자는 px (`24` → `24px`, `md` → `var(--ds-radius-md)`) */
export const radiusToCss = (value: BoxRadiusValue | undefined): string | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === 'number') {
    return `${value}px`;
  }

  return `var(--ds-radius-${value})`;
};

/** color 토큰 → CSS 변수 참조 (`primary.default` → `var(--ds-primary-default)`) */
export const colorTokenToCssVar = (token: ColorToken | undefined): string | undefined => {
  if (!token) {
    return undefined;
  }

  return `var(--ds-${token.replaceAll('.', '-')})`;
};

/**
 * Box 스타일 prop → inline style 객체.
 * padding·margin·backgroundColor·borderRadius 중 값이 있는 선언만 만든다.
 * padding·margin의 우선순위는 방향값 > 축약 축값 > 공통값이다.
 */
export const getBoxComputedStyle = ({
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
}: BoxStyleProps): CSSProperties => {
  const computed: CSSProperties = {};

  const paddingTop = spacingToCss(pt ?? py ?? p);
  const paddingRight = spacingToCss(pr ?? px ?? p);
  const paddingBottom = spacingToCss(pb ?? py ?? p);
  const paddingLeft = spacingToCss(pl ?? px ?? p);

  if (paddingTop) {
    computed.paddingTop = paddingTop;
  }

  if (paddingRight) {
    computed.paddingRight = paddingRight;
  }

  if (paddingBottom) {
    computed.paddingBottom = paddingBottom;
  }

  if (paddingLeft) {
    computed.paddingLeft = paddingLeft;
  }

  const marginTop = spacingToCss(mt ?? my ?? m);
  const marginRight = spacingToCss(mr ?? mx ?? m);
  const marginBottom = spacingToCss(mb ?? my ?? m);
  const marginLeft = spacingToCss(ml ?? mx ?? m);

  if (marginTop) {
    computed.marginTop = marginTop;
  }

  if (marginRight) {
    computed.marginRight = marginRight;
  }

  if (marginBottom) {
    computed.marginBottom = marginBottom;
  }

  if (marginLeft) {
    computed.marginLeft = marginLeft;
  }

  const backgroundColor = colorTokenToCssVar(bg);

  if (backgroundColor) {
    computed.backgroundColor = backgroundColor;
  }

  const borderRadius = radiusToCss(radius);

  if (borderRadius) {
    computed.borderRadius = borderRadius;
  }

  return computed;
};
