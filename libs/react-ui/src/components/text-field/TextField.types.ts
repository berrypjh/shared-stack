import type { ReactNode, Ref } from 'react';

import type {
  InputLikeChangeEventHandler,
  InputLikeElement,
  InputLikeFocusEventHandler,
  TextFieldProps as TextFieldSemanticProps,
} from '../../types';
import type { FormControlProps } from '../form-control';
import type { SelectProps } from '../select/Select.types';

export type TextFieldOwnProps = TextFieldSemanticProps & {
  autoComplete?: string;
  children?: ReactNode;
  defaultValue?: unknown;
  helperText?: ReactNode;
  id?: string;
  /** 합성된 native input/textarea 로 가는 ref. `select` 모드에서는 연결되지 않는다. */
  inputRef?: Ref<InputLikeElement>;
  label?: ReactNode;
  name?: string;
  onBlur?: InputLikeFocusEventHandler;
  onChange?: InputLikeChangeEventHandler;
  onFocus?: InputLikeFocusEventHandler;
  placeholder?: string;
  rows?: number;
  select?: boolean;
  type?: string;
  value?: unknown;
};

/**
 * `select` 로 모드를 가르는 공개 props.
 *
 * 모드 분기는 **익명**으로 둔다 — 이름을 붙이면 `dts-bundle-generator` 가 그 이름을 공개
 * 선언으로 끌어올려 소비자 카탈로그에 심볼이 늘어난다 (SearchField 와 같은 이유).
 *
 * - 텍스트 입력 모드(기본): 합성된 native input/textarea 의 계약이다.
 * - `select` 모드: `Select` 를 합성하며 값·이벤트 계약도 `Select` 의 것이다. `onChange` 는 DOM
 *   change 이벤트가 아니라 `(event: { target: { name, value } }, child)` 로 불리고 값 도메인은
 *   `unknown` 이다. 입력 전용 prop(`inputRef`·`multiline`·`rows`·`type`·`readOnly`)은 `Select` 에
 *   대응하는 뜻이 없어 받지 않는다 — 포커스 대상은 native input 이 아니라 trigger 버튼이다.
 *   옵션을 직접 다루거나 ref 가 필요하면 `FormControl` + `InputLabel` + `Select` 를 직접 쓴다.
 */
export type TextFieldProps = Omit<
  FormControlProps<'div'>,
  | 'children'
  | 'color'
  | 'margin'
  | 'size'
  | 'variant'
  | 'defaultValue'
  | 'value'
  | 'onChange'
  | 'onFocus'
  | 'onBlur'
> &
  Omit<
    TextFieldOwnProps,
    'select' | 'onChange' | 'inputRef' | 'multiline' | 'rows' | 'type' | 'readOnly'
  > &
  (
    | {
        select?: false;
        onChange?: InputLikeChangeEventHandler;
        inputRef?: Ref<InputLikeElement>;
        multiline?: boolean;
        rows?: number;
        type?: string;
        readOnly?: boolean;
      }
    | {
        select: true;
        onChange?: SelectProps['onChange'];
        inputRef?: never;
        multiline?: never;
        rows?: never;
        type?: never;
        readOnly?: never;
      }
  );
