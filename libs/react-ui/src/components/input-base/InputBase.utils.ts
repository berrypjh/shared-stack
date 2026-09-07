import type { InputLikeElement } from '../../types';
import { cx, hasFormValue } from '../../utils';
import { assignRef } from '../../utils';
import type { FormControlContextValue } from '../form-control';

import { inputBaseClasses } from './InputBase.constants';
import type { HandleNativeElementRef, InputBaseProps, InputDomValue } from './InputBase.types';

/**
 * 내부 input ref와 외부 ref를 함께 동기화하는 ref 핸들러를 생성합니다.
 *
 * 생성된 핸들러는 네이티브 input/textarea 인스턴스를 내부 ref에 저장하고,
 * `inputRef`와 외부에서 전달된 ref에도 같은 인스턴스를 연결합니다.
 *
 * @param params ref 핸들러 생성에 필요한 값
 * @param params.inputElementRef 현재 input 요소를 저장할 내부 ref 객체
 * @param params.inputRef 외부에서 전달된 input ref
 * @returns 네이티브 input 요소 ref 동기화 핸들러
 */
export const createHandleNativeElementRef = ({
  inputElementRef,
  inputRef,
}: {
  inputElementRef: { current: InputLikeElement | null };
  inputRef?: unknown;
}): HandleNativeElementRef => {
  return (instance, externalRef) => {
    inputElementRef.current = instance;
    assignRef(inputRef, instance);
    assignRef(externalRef, instance);
  };
};

/**
 * InputBase root className 문자열을 생성합니다.
 *
 * @param params InputBase 시각적 상태와 추가 className
 * @returns 조합된 className 문자열
 */
export const getInputBaseRootClassNames = ({
  className,
  color,
  disabled,
  endAdornment,
  error,
  focused,
  formControl,
  fullWidth,
  multiline,
  readOnly,
  size,
  startAdornment,
}: {
  className?: string;
  color: 'primary' | 'secondary';
  disabled: boolean;
  endAdornment?: React.ReactNode;
  error: boolean;
  focused: boolean;
  formControl?: FormControlContextValue;
  fullWidth: boolean;
  multiline: boolean;
  readOnly: boolean;
  size: 'sm' | 'md';
  startAdornment?: React.ReactNode;
}) =>
  cx(
    inputBaseClasses.root,
    formControl && inputBaseClasses.formControl,
    focused && inputBaseClasses.focused,
    disabled && inputBaseClasses.disabled,
    error && inputBaseClasses.error,
    fullWidth && inputBaseClasses.fullWidth,
    multiline && inputBaseClasses.multiline,
    readOnly && inputBaseClasses.readOnly,
    Boolean(startAdornment) && inputBaseClasses.adornedStart,
    Boolean(endAdornment) && inputBaseClasses.adornedEnd,
    size === 'sm' && inputBaseClasses.sizeSm,
    size === 'md' && inputBaseClasses.sizeMd,
    color === 'primary' && inputBaseClasses.colorPrimary,
    color === 'secondary' && inputBaseClasses.colorSecondary,
    className,
  );

/**
 * InputBase input className 문자열을 생성합니다.
 *
 * @param params InputBase 시각적 상태와 추가 className
 * @returns 조합된 className 문자열
 */
export const getInputBaseInputClassNames = ({
  hiddenLabel,
  inputClassName,
  size,
}: {
  hiddenLabel: boolean;
  inputClassName?: string;
  size: 'sm' | 'md';
}) =>
  cx(
    inputBaseClasses.input,
    size === 'sm' && inputBaseClasses.inputSizeSm,
    hiddenLabel && inputBaseClasses.inputHiddenLabel,
    inputClassName,
  );

/**
 * React DOM에 전달 가능한 input value로 정규화합니다.
 *
 * 배열 값은 네이티브 input의 value로 직접 전달할 수 없으므로 빈 문자열로 변환합니다.
 *
 * @param value 정규화할 value
 * @returns DOM에 전달 가능한 value
 */
export const getResolvedInputValue = (value: unknown): InputDomValue => {
  if (Array.isArray(value)) {
    return '';
  }

  return value as InputDomValue;
};

/**
 * React DOM에 전달 가능한 input defaultValue로 정규화합니다.
 *
 * 배열 값은 네이티브 input의 defaultValue로 직접 전달할 수 없으므로 빈 문자열로 변환합니다.
 *
 * @param value 정규화할 defaultValue
 * @returns DOM에 전달 가능한 defaultValue
 */
export const getResolvedDefaultValue = (value: unknown): InputDomValue => {
  if (Array.isArray(value)) {
    return '';
  }

  return value as InputDomValue;
};

/**
 * input과 textarea가 공통으로 사용하는 기본 props 객체를 생성합니다.
 *
 * @param params 공통 props 생성에 필요한 값
 * @param params.ariaDescribedby 설명 요소 id
 * @param params.autoComplete 자동완성 값
 * @param params.autoFocus 자동 포커스 여부
 * @param params.disabled 비활성화 여부
 * @param params.id 요소 id
 * @param params.name 요소 name
 * @param params.placeholder placeholder 문자열
 * @param params.readOnly 읽기 전용 여부
 * @param params.required 필수 여부
 * @returns input/textarea 공통 props 객체
 */
export const getCommonInputProps = ({
  ariaDescribedby,
  ariaLabel,
  ariaLabelledby,
  ariaInvalid,
  autoComplete,
  autoFocus,
  disabled,
  id,
  name,
  placeholder,
  readOnly,
  required,
}: Pick<
  InputBaseProps,
  | 'autoComplete'
  | 'autoFocus'
  | 'disabled'
  | 'id'
  | 'name'
  | 'placeholder'
  | 'readOnly'
  | 'required'
> & {
  ariaDescribedby?: string;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaInvalid?: boolean | 'true' | 'false' | 'grammar' | 'spelling';
}) => ({
  'aria-describedby': ariaDescribedby,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  'aria-invalid': ariaInvalid,
  autoComplete,
  autoFocus,
  disabled,
  id,
  name,
  placeholder,
  readOnly,
  required,
});

/**
 * value 또는 defaultValue를 기준으로 filled 상태를 동기화합니다.
 *
 * 값이 존재하면 `onFilled`를 호출하고,
 * 값이 비어 있으면 `onEmpty`를 호출합니다.
 *
 * @param params filled 상태 동기화에 필요한 값
 * @param params.defaultValue 기본값
 * @param params.onEmpty empty 상태 콜백
 * @param params.onFilled filled 상태 콜백
 * @param params.value 현재 value
 */
export const syncFilledState = ({
  defaultValue,
  onEmpty,
  onFilled,
  value,
}: {
  defaultValue?: unknown;
  onEmpty?: () => void;
  onFilled?: () => void;
  value?: unknown;
}) => {
  if (!onFilled || !onEmpty) {
    return;
  }

  if (hasFormValue(value ?? defaultValue)) {
    onFilled();
    return;
  }

  onEmpty();
};
