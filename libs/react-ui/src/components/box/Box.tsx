import type { CSSProperties } from 'react';

import { cx } from '../../utils';

import { boxClasses } from './Box.constants';
import type { ReactBoxProps } from './Box.types';
import { getBoxComputedStyle } from './Box.utils';

export const Box = ({
  className,
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
  children,
  ...rest
}: ReactBoxProps) => {
  const computedStyle = getBoxComputedStyle({
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
  });

  const mergedStyle: CSSProperties = {
    ...computedStyle,
    ...(style ?? {}),
  };

  return (
    <div {...rest} className={cx(boxClasses.root, className)} style={mergedStyle}>
      {children}
    </div>
  );
};

Box.displayName = 'Box';
