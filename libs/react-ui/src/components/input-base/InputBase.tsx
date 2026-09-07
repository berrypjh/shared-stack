'use client';

import { useEffect, useRef, useState } from 'react';

import { cx, hasFormValue } from '../../utils';
import { useFormControl } from '../form-control';

import { inputBaseClasses } from './InputBase.constants';
import type {
  InputBaseProps,
  NativeInputBlurHandler,
  NativeInputChangeHandler,
  NativeInputFocusHandler,
  NativeTextareaBlurHandler,
  NativeTextareaChangeHandler,
  NativeTextareaFocusHandler,
} from './InputBase.types';
import {
  createHandleNativeElementRef,
  getCommonInputProps,
  getInputBaseInputClassNames,
  getInputBaseRootClassNames,
  getResolvedDefaultValue,
  getResolvedInputValue,
  syncFilledState,
} from './InputBase.utils';

export const InputBase = ({
  'aria-describedby': ariaDescribedby,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  'aria-invalid': ariaInvalid,
  autoComplete,
  autoFocus = false,
  children,
  className,
  color,
  defaultValue,
  disabled,
  endAdornment,
  error,
  fullWidth,
  id,
  inputClassName,
  inputProps,
  textareaProps,
  inputRef,
  multiline = false,
  name,
  onBlur,
  onChange,
  onClick,
  onFocus,
  placeholder,
  readOnly = false,
  required,
  rows,
  size,
  startAdornment,
  type = 'text',
  value,
  ref,
  ...rest
}: InputBaseProps) => {
  const formControl = useFormControl();
  const [focusedState, setFocusedState] = useState(false);
  const inputElementRef = useRef<import('../../types').InputLikeElement | null>(null);

  const hiddenLabel = Boolean(formControl?.hiddenLabel);

  const resolvedColor = color ?? formControl?.color ?? 'primary';
  const resolvedDisabled = disabled ?? formControl?.disabled ?? false;
  const resolvedError = error ?? formControl?.error ?? false;
  const resolvedFullWidth = fullWidth ?? formControl?.fullWidth ?? false;
  const resolvedRequired = required ?? formControl?.required ?? false;
  const resolvedSize = size ?? formControl?.size ?? 'md';
  const resolvedFocused = formControl?.focused ?? focusedState;

  useEffect(() => {
    formControl?.setAdornedStart(Boolean(startAdornment));
  }, [formControl, startAdornment]);

  const formControlOnFilled = formControl?.onFilled;
  const formControlOnEmpty = formControl?.onEmpty;

  useEffect(() => {
    syncFilledState({
      defaultValue,
      onEmpty: formControlOnEmpty,
      onFilled: formControlOnFilled,
      value,
    });
  }, [defaultValue, value, formControlOnFilled, formControlOnEmpty]);

  useEffect(() => {
    if (!resolvedDisabled) {
      return;
    }

    const input = inputElementRef.current;

    if (input && input === document.activeElement) {
      input.blur();
    }

    if (!formControl) {
      setFocusedState(false);
    }
  }, [formControl, resolvedDisabled]);

  const handleFocus = (event: Parameters<NonNullable<typeof onFocus>>[0]) => {
    onFocus?.(event);

    if (formControl) {
      formControl.onFocus();
      return;
    }

    setFocusedState(true);
  };

  const handleBlur = (event: Parameters<NonNullable<typeof onBlur>>[0]) => {
    onBlur?.(event);

    if (formControl) {
      formControl.onBlur();
      return;
    }

    setFocusedState(false);
  };

  const handleChange = (event: Parameters<NonNullable<typeof onChange>>[0]) => {
    const nextValue = event.target.value;

    if (hasFormValue(nextValue)) {
      formControl?.onFilled();
    } else {
      formControl?.onEmpty();
    }

    onChange?.(event);
  };

  const handleRootClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    onClick?.(event);

    if (resolvedDisabled) {
      return;
    }

    const input = inputElementRef.current;

    if (!input) {
      return;
    }

    if (event.target !== input) {
      input.focus();
    }
  };

  const handleNativeElementRef = createHandleNativeElementRef({
    inputElementRef,
    inputRef,
  });

  const handleInputRef = (instance: HTMLInputElement | null) => {
    handleNativeElementRef(instance, inputProps?.ref);
  };

  const handleTextareaRef = (instance: HTMLTextAreaElement | null) => {
    handleNativeElementRef(instance, textareaProps?.ref);
  };

  const handleInputFocus: NativeInputFocusHandler = (event) => {
    inputProps?.onFocus?.(event);
    handleFocus(event);
  };

  const handleInputBlur: NativeInputBlurHandler = (event) => {
    inputProps?.onBlur?.(event);
    handleBlur(event);
  };

  const handleInputChange: NativeInputChangeHandler = (event) => {
    inputProps?.onChange?.(event);
    handleChange(event);
  };

  const handleTextareaFocus: NativeTextareaFocusHandler = (event) => {
    textareaProps?.onFocus?.(event);
    handleFocus(event);
  };

  const handleTextareaBlur: NativeTextareaBlurHandler = (event) => {
    textareaProps?.onBlur?.(event);
    handleBlur(event);
  };

  const handleTextareaChange: NativeTextareaChangeHandler = (event) => {
    textareaProps?.onChange?.(event);
    handleChange(event);
  };

  const rootClassNames = getInputBaseRootClassNames({
    className,
    color: resolvedColor,
    disabled: resolvedDisabled,
    endAdornment,
    error: resolvedError,
    focused: resolvedFocused,
    formControl,
    fullWidth: resolvedFullWidth,
    multiline,
    readOnly,
    size: resolvedSize,
    startAdornment,
  });

  const baseInputClassNames = getInputBaseInputClassNames({
    hiddenLabel,
    inputClassName,
    size: resolvedSize,
  });

  const inputElementClassNames = cx(baseInputClassNames, inputProps?.className);
  const textareaElementClassNames = cx(baseInputClassNames, textareaProps?.className);

  const commonInputProps = getCommonInputProps({
    ariaDescribedby,
    ariaLabel,
    ariaLabelledby,
    ariaInvalid,
    autoComplete,
    autoFocus,
    disabled: resolvedDisabled,
    id,
    name,
    placeholder,
    readOnly,
    required: resolvedRequired,
  });

  const resolvedValue = getResolvedInputValue(value);
  const resolvedDefaultValue = getResolvedDefaultValue(defaultValue);

  return (
    <div
      {...rest}
      ref={ref}
      role="presentation"
      className={rootClassNames}
      onClick={handleRootClick}
    >
      {startAdornment ? (
        <span className={inputBaseClasses.startAdornment}>{startAdornment}</span>
      ) : null}

      {multiline ? (
        <textarea
          {...textareaProps}
          {...commonInputProps}
          rows={textareaProps?.rows ?? rows}
          defaultValue={resolvedDefaultValue}
          value={resolvedValue}
          className={textareaElementClassNames}
          onFocus={handleTextareaFocus}
          onBlur={handleTextareaBlur}
          onChange={handleTextareaChange}
          ref={handleTextareaRef}
        />
      ) : (
        <input
          {...inputProps}
          {...commonInputProps}
          type={inputProps?.type ?? type}
          defaultValue={resolvedDefaultValue}
          value={resolvedValue}
          className={inputElementClassNames}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onChange={handleInputChange}
          ref={handleInputRef}
        />
      )}

      {endAdornment ? <span className={inputBaseClasses.endAdornment}>{endAdornment}</span> : null}

      {children}
    </div>
  );
};

InputBase.displayName = 'InputBase';
