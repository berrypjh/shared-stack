import type { FieldSemanticProps, InputFieldSemanticProps } from '@berrypjh/ui-core';

import type { ChangeEventHandler, FocusEventHandler } from 'react';

/**
 * Field 계열의 시맨틱 계약.
 *
 * `FormControl`·`InputBase`·`InputLabel`·`TextField`·`Select` 가 공유한다.
 * 컴포넌트 prop 타입(polymorphic `FormControlProps<C>` 등)은 각 컴포넌트의 `*.types.ts` 가
 * 이 계약을 wrap해서 만든다.
 *
 * `variant`·`size`·`color`·`disabled`·`error`·`fullWidth`·`autoFocus`·`readOnly`·`multiline` 은
 * RN 렌더러가 같은 불변식을 구현해서 ui-core 로 올라갔다. 아래 남은 것은 web 전용이다:
 *
 * - `required`: RN TextInput 에 HTML `required` 에 해당하는 폼 검증도 접근성 고지도 없고,
 *   그것을 담당할 FormControl/label 합성도 아직 없다.
 * - `margin`·`hiddenLabel`: 웹 폼 밀도/레이블 규약이다.
 * - `InputLike*`: DOM 요소와 DOM 이벤트 타입이다.
 */
export type { FieldColor, FieldSize, FieldVariant } from '@berrypjh/ui-core';

export type FieldMargin = 'none' | 'dense' | 'normal';

export interface FieldProps extends FieldSemanticProps {
  required?: boolean;
}

export interface FormControlProps extends FieldProps {
  margin?: FieldMargin;
  hiddenLabel?: boolean;
}

export interface InputFieldProps extends InputFieldSemanticProps {
  required?: boolean;
}

export interface TextFieldProps extends InputFieldProps {
  margin?: FieldMargin;
}

export type InputLikeElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

export type InputLikeFocusEventHandler = FocusEventHandler<InputLikeElement>;
export type InputLikeChangeEventHandler = ChangeEventHandler<InputLikeElement>;
