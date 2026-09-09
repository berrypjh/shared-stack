import type { BoxProps, BoxRadiusValue, BoxSpacingValue, ColorToken } from '@berrypjh/ui-core';

import type { ComponentPropsWithRef, CSSProperties } from 'react';

export type { BoxProps, BoxRadiusValue, BoxSpacingValue, ColorToken };

type HtmlDivProps = ComponentPropsWithRef<'div'>;

export type ReactBoxProps = BoxProps &
  Omit<HtmlDivProps, keyof BoxProps | 'color'> & {
    className?: string;
    style?: CSSProperties;
  };

export type BoxStyleProps = Pick<
  ReactBoxProps,
  | 'p'
  | 'px'
  | 'py'
  | 'pt'
  | 'pr'
  | 'pb'
  | 'pl'
  | 'm'
  | 'mx'
  | 'my'
  | 'mt'
  | 'mr'
  | 'mb'
  | 'ml'
  | 'bg'
  | 'radius'
>;
