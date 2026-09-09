import type { ComponentPropsWithRef, ReactNode, Ref } from 'react';

import type {
  InputFieldProps,
  InputLikeChangeEventHandler,
  InputLikeElement,
  InputLikeFocusEventHandler,
} from '../../types';

export type DataAttributes = {
  [K in `data-${string}`]?: string | number | boolean | undefined;
};

export type NativeInputProps = Omit<
  ComponentPropsWithRef<'input'>,
  'size' | 'children' | 'defaultValue' | 'value'
> &
  DataAttributes;

export type NativeTextareaProps = Omit<
  ComponentPropsWithRef<'textarea'>,
  'children' | 'defaultValue' | 'value'
> &
  DataAttributes;

export type NativeInputFocusHandler = NonNullable<ComponentPropsWithRef<'input'>['onFocus']>;

export type NativeInputBlurHandler = NonNullable<ComponentPropsWithRef<'input'>['onBlur']>;

export type NativeInputChangeHandler = NonNullable<ComponentPropsWithRef<'input'>['onChange']>;

export type NativeTextareaFocusHandler = NonNullable<ComponentPropsWithRef<'textarea'>['onFocus']>;

export type NativeTextareaBlurHandler = NonNullable<ComponentPropsWithRef<'textarea'>['onBlur']>;

export type NativeTextareaChangeHandler = NonNullable<
  ComponentPropsWithRef<'textarea'>['onChange']
>;

export type InputDomValue = string | number | readonly string[] | undefined;

export type InputBaseOwnProps = Omit<InputFieldProps, 'variant'> & {
  'aria-describedby'?: string;
  autoComplete?: string;
  children?: ReactNode;
  defaultValue?: unknown;
  endAdornment?: ReactNode;
  id?: string;
  inputClassName?: string;
  inputProps?: NativeInputProps;
  textareaProps?: NativeTextareaProps;
  /**
   * native input/textarea 로 가는 ref.
   *
   * 루트 `<div>` 를 받는 `ref` 와 별개다 — 값 읽기·포커스·선택은 native 요소에서만 된다.
   */
  inputRef?: Ref<InputLikeElement>;
  name?: string;
  onBlur?: InputLikeFocusEventHandler;
  onChange?: InputLikeChangeEventHandler;
  onFocus?: InputLikeFocusEventHandler;
  placeholder?: string;
  rows?: number;
  startAdornment?: ReactNode;
  type?: string;
  value?: unknown;
};

export type InputBaseProps = Omit<
  ComponentPropsWithRef<'div'>,
  'children' | 'onChange' | 'onFocus' | 'onBlur' | 'defaultValue' | 'value'
> &
  InputBaseOwnProps;

export type HandleNativeElementRef = (
  instance: InputLikeElement | null,
  externalRef?: unknown,
) => void;
