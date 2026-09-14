import type { ElementType, ReactNode } from 'react';

import type { ButtonLoadingPosition, ButtonProps as ButtonSemanticProps } from '../../types';
import type { ButtonBaseAutoAnchorProps, ButtonBaseProps } from '../button-base';

export type { ButtonLoadingPosition };

export type ButtonExtraProps = Pick<ButtonSemanticProps, 'loading' | 'loadingPosition'> & {
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  loadingIndicator?: ReactNode;
};

export type ButtonProps<C extends ElementType = 'button'> = ButtonBaseProps<C> & ButtonExtraProps;

export type ButtonAutoAnchorProps = ButtonBaseAutoAnchorProps & ButtonExtraProps;

export type ButtonRenderableProps = ButtonAutoAnchorProps | ButtonProps<ElementType>;
