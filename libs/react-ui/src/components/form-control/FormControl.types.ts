import type { ElementType, FocusEventHandler, ReactNode, Ref } from 'react';

import type {
  FormControlProps as FormControlSemanticProps,
  PolymorphicComponentPropsWithRef,
} from '../../types';

export type FormControlOwnProps = FormControlSemanticProps & {
  children?: ReactNode;
  className?: string;
  focused?: boolean;
};

export type FormControlProps<C extends ElementType = 'div'> = PolymorphicComponentPropsWithRef<
  C,
  FormControlOwnProps
>;

export type FormControlImplementationProps = FormControlProps<ElementType> & {
  component?: ElementType;
  ref?: Ref<unknown>;
  onFocus?: FocusEventHandler<Element>;
  onBlur?: FocusEventHandler<Element>;
};

export type DerivedChildState = {
  filled: boolean;
  adornedStart: boolean;
};

export type InspectableElementProps = {
  children?: ReactNode;
  input?: ReactNode;
  value?: unknown;
  defaultValue?: unknown;
  startAdornment?: ReactNode;
  inputProps?: {
    value?: unknown;
    defaultValue?: unknown;
  };
};
