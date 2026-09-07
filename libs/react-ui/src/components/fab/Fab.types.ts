import type { ElementType, ReactNode } from 'react';

import type { FabProps as FabSemanticProps, FabShape } from '../../types';
import type { ButtonBaseAutoAnchorProps, ButtonBaseProps } from '../button-base';

export type { FabShape };

export type FabOwnProps = FabSemanticProps & {
  children?: ReactNode;
  className?: string;
  icon?: ReactNode;
};

export type FabProps<C extends ElementType = 'button'> = Omit<
  ButtonBaseProps<C>,
  'children' | 'size' | 'color' | 'variant' | 'fullWidth'
> &
  FabOwnProps;

export type FabAutoAnchorProps = Omit<
  ButtonBaseAutoAnchorProps,
  'children' | 'size' | 'color' | 'variant' | 'fullWidth'
> &
  FabOwnProps;

export type FabRenderableProps = FabAutoAnchorProps | FabProps<ElementType>;
