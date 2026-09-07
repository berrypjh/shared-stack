import type { ChangeEventHandler, FocusEventHandler } from 'react';

/**
 * Field 계열의 시맨틱 계약.
 *
 * `FormControl`·`InputBase`·`InputLabel`·`TextField`·`Select` 가 공유한다.
 * 컴포넌트 prop 타입(polymorphic `FormControlProps<C>` 등)은 각 컴포넌트의 `*.types.ts` 가
 * 이 계약을 wrap해서 만든다.
 *
 * ui-core 가 아니라 여기 있는 이유: RN 구현이 없고, 어휘 자체가 웹 폼에 묶여 있다 —
 * `readOnly`·`multiline`·`hiddenLabel` 은 DOM 입력 요소 어휘이고 `margin: dense|normal` 은
 * 웹 폼 밀도 규약이다.
 */
export type FieldVariant = 'plain' | 'filled' | 'boxed';
export type FieldSize = 'sm' | 'md';
export type FieldMargin = 'none' | 'dense' | 'normal';
export type FieldColor = 'primary' | 'secondary';

export interface FieldProps {
  variant?: FieldVariant;
  size?: FieldSize;
  color?: FieldColor;

  disabled?: boolean;
  error?: boolean;
  required?: boolean;
  fullWidth?: boolean;
}

export interface FormControlProps extends FieldProps {
  margin?: FieldMargin;
  hiddenLabel?: boolean;
}

export interface InputFieldProps extends FieldProps {
  autoFocus?: boolean;
  readOnly?: boolean;
  multiline?: boolean;
}

export interface TextFieldProps extends InputFieldProps {
  margin?: FieldMargin;
}

export type InputLikeElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

export type InputLikeFocusEventHandler = FocusEventHandler<InputLikeElement>;
export type InputLikeChangeEventHandler = ChangeEventHandler<InputLikeElement>;
