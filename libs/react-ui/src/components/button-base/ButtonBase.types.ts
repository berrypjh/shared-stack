import type {
  ComponentPropsWithRef,
  ElementType,
  KeyboardEventHandler,
  MouseEventHandler,
  ReactNode,
} from 'react';

import type { ButtonProps as ButtonSemanticProps } from '../../types/button';
import type { PolymorphicComponentPropsWithRef, PropsOf } from '../../types/polymorphic';

export type ButtonBaseOwnProps = Omit<ButtonSemanticProps, 'loading' | 'loadingPosition'> & {
  className?: string;
  children?: ReactNode;
};

export type ButtonBaseProps<C extends ElementType = 'button'> = PolymorphicComponentPropsWithRef<
  C,
  ButtonBaseOwnProps
>;

type ButtonBaseExplicitAnchorProps = Omit<ButtonBaseProps<'a'>, 'component'> & {
  component?: 'a';
};

type ButtonBaseNativeButtonProps = Omit<ButtonBaseProps<'button'>, 'component'> & {
  component?: 'button';
};

export type ButtonBaseAutoAnchorProps = Omit<
  ButtonBaseExplicitAnchorProps,
  'component' | 'href'
> & {
  component?: never;
  href: NonNullable<PropsOf<'a'>['href']>;
};

export type ButtonBaseRuntimeCustomProps = ButtonBaseProps<ElementType> & {
  component: ElementType;
  href?: PropsOf<'a'>['href'];
  to?: unknown;
  type?: string;
  role?: ComponentPropsWithRef<'button'>['role'];
  tabIndex?: ComponentPropsWithRef<'button'>['tabIndex'];
  onClick?: MouseEventHandler<HTMLElement>;
  onKeyDown?: KeyboardEventHandler<HTMLElement>;
  onKeyUp?: KeyboardEventHandler<HTMLElement>;
};

export type ButtonBaseRenderableProps =
  | ButtonBaseNativeButtonProps
  | ButtonBaseAutoAnchorProps
  | ButtonBaseRuntimeCustomProps;

export type { ButtonBaseExplicitAnchorProps, ButtonBaseNativeButtonProps };
