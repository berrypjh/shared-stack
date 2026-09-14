import type { InputLikeElement } from '../../types';
import { cx, hasFormValue } from '../../utils';
import { assignRef } from '../../utils';
import type { FormControlContextValue } from '../form-control';

import { inputBaseClasses } from './InputBase.constants';
import type { HandleNativeElementRef, InputBaseProps, InputDomValue } from './InputBase.types';

/**
 * 내부 input ref와 외부 ref를 함께 동기화하는 ref 핸들러 생성.
 * 핸들러는 네이티브 input/textarea 인스턴스를 `inputElementRef`에 저장하고, `inputRef`와 외부에서 전달된 ref에도 같은 인스턴스를 연결한다.
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

/** InputBase 시각 상태와 추가 className → root className 문자열 */
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

/** InputBase 시각 상태와 추가 className → input className 문자열 */
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
 * value → React DOM에 전달 가능한 input value (`['a']` → `''`).
 * 배열 값은 네이티브 input의 value로 직접 전달할 수 없으므로 빈 문자열로 바꾼다.
 */
export const getResolvedInputValue = (value: unknown): InputDomValue => {
  if (Array.isArray(value)) {
    return '';
  }

  return value as InputDomValue;
};

/**
 * defaultValue → React DOM에 전달 가능한 input defaultValue (`['a']` → `''`).
 * 배열 값은 네이티브 input의 defaultValue로 직접 전달할 수 없으므로 빈 문자열로 바꾼다.
 */
export const getResolvedDefaultValue = (value: unknown): InputDomValue => {
  if (Array.isArray(value)) {
    return '';
  }

  return value as InputDomValue;
};

/**
 * 스스로 포커스를 가져가는 요소.
 * 루트 클릭이 입력으로 포커스를 넘기는 편의는 빈 여백을 눌렀을 때의 이야기다.
 * 지우기 버튼 같은 장식에서 난 클릭까지 가로채면 버튼이 얻은 포커스를 입력이 도로 뺏어, 스크린리더가 버튼의 상태 변화를 놓치고 키보드 사용자는 위치를 잃는다.
 */
const FOCUS_OWNING_SELECTOR = 'a[href],area[href],button,input,select,textarea,[tabindex]';

/** 클릭 target이 `root` 안에서 포커스를 스스로 갖는 요소(또는 그 자손)인지 판별, `true`면 루트가 포커스를 넘기지 않는다 */
export const ownsFocus = (target: EventTarget | null, root: Element): boolean => {
  if (!(target instanceof Element)) {
    return false;
  }

  const owner = target.closest(FOCUS_OWNING_SELECTOR);

  return owner != null && root.contains(owner);
};

/**
 * 값이 `undefined`인 키 제거.
 * spread는 뒤에 오는 `undefined`도 앞의 값을 덮는다.
 * 걸러내지 않으면 최상위에서 주지도 않은 prop이 `inputProps`로 넘긴 값을 조용히 지운다.
 */
const definedOnly = <T extends object>(props: T): Partial<T> =>
  Object.fromEntries(
    Object.entries(props).filter(([, value]) => value !== undefined),
  ) as Partial<T>;

/**
 * input과 textarea가 공통으로 쓰는 기본 props 생성.
 * 값이 있는 키만 담고, `error`는 `aria-invalid`로 옮긴다.
 */
export const getCommonInputProps = ({
  ariaDescribedby,
  ariaLabel,
  ariaLabelledby,
  ariaInvalid,
  autoComplete,
  autoFocus,
  disabled,
  enterKeyHint,
  error,
  id,
  inputMode,
  name,
  placeholder,
  readOnly,
  required,
}: Pick<
  InputBaseProps,
  | 'autoComplete'
  | 'autoFocus'
  | 'disabled'
  | 'enterKeyHint'
  | 'id'
  | 'inputMode'
  | 'name'
  | 'placeholder'
  | 'readOnly'
  | 'required'
> & {
  ariaDescribedby?: string;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaInvalid?: boolean | 'true' | 'false' | 'grammar' | 'spelling';
  error: boolean;
}) =>
  definedOnly({
    'aria-describedby': ariaDescribedby,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    // `error`는 시각 상태이자 고지다. native input에는 `error` 속성이 없으므로 aria로 옮긴다.
    // 명시 `aria-invalid`가 있으면 소비자 의도가 이긴다.
    'aria-invalid': ariaInvalid ?? (error ? true : undefined),
    autoComplete,
    autoFocus,
    disabled,
    // `inputMode`·`enterKeyHint`는 상속되지 않는 편집 전용 속성이라 래퍼 div에 놓이면 가상 키보드에 아무것도 전달되지 않는다.
    // `spellCheck`·`autoCapitalize`는 자손 편집 요소로 상속되므로 래퍼에 남겨도 동작한다 — 그래서 여기로 끌어오지 않는다.
    enterKeyHint,
    id,
    inputMode,
    name,
    placeholder,
    readOnly,
    required,
  });

/**
 * value(없으면 defaultValue) 기준으로 filled 상태 동기화.
 * 값이 있으면 `onFilled`, 비어 있으면 `onEmpty`를 호출하고, 두 콜백이 모두 있을 때만 동작한다.
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
