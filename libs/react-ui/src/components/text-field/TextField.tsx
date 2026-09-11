'use client';

import { useId } from 'react';

import type { InputLikeChangeEventHandler } from '../../types';
import { cx } from '../../utils';
import { FormControl } from '../form-control';
import { FormHelperText } from '../form-helper-text';
import { InputLabel } from '../input-label';
import { Select } from '../select';
import type { SelectProps } from '../select/Select.types';

import { textFieldClasses } from './TextField.constants';
import type { TextFieldProps } from './TextField.types';
import {
  composeDescribedBy,
  getTextFieldHelperTextId,
  getTextFieldInputComponent,
  hasTextFieldContent,
} from './TextField.utils';

export const TextField = ({
  'aria-describedby': ariaDescribedby,
  autoComplete,
  autoFocus = false,
  children,
  className,
  color = 'primary',
  component,
  defaultValue,
  disabled = false,
  error = false,
  fullWidth = false,
  helperText,
  id: idProp,
  inputRef,
  label,
  margin = 'none',
  multiline = false,
  name,
  onBlur,
  onChange,
  onFocus,
  placeholder,
  readOnly = false,
  required = false,
  rows,
  select = false,
  size = 'md',
  type,
  value,
  variant = 'boxed',
  ref,
  ...rest
}: TextFieldProps) => {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const labelId = `${id}-label`;

  const hasLabel = hasTextFieldContent(label);
  const hasHelperText = hasTextFieldContent(helperText);

  const helperTextId = getTextFieldHelperTextId({
    hasHelperText,
    id,
  });

  /**
   * 설명은 소비자 값과 helper text 를 **합쳐서** 진짜 입력에 건다.
   *
   * `...rest` 로 흘려보내면 `aria-describedby` 가 FormControl 래퍼 `div` 에 얹혀 아무것도
   * 설명하지 못한 채 사라진다 — 입력은 helper 만 알게 된다.
   */
  const describedBy = composeDescribedBy(ariaDescribedby, helperTextId);

  const InputComponent = getTextFieldInputComponent(variant);

  return (
    <FormControl
      {...rest}
      ref={ref}
      component={component}
      className={cx(textFieldClasses.root, className)}
      color={color}
      disabled={disabled}
      error={error}
      fullWidth={fullWidth}
      margin={margin}
      required={required}
      size={size}
      variant={variant}
    >
      {hasLabel ? (
        <InputLabel htmlFor={id} id={labelId}>
          {label}
        </InputLabel>
      ) : null}

      {/* 타입이 `select` 로 모드를 가르므로 각 분기의 `onChange` 는 그 모드의 계약이다. */}
      {select ? (
        <Select
          aria-describedby={describedBy}
          autoFocus={autoFocus}
          color={color}
          defaultValue={defaultValue}
          disabled={disabled}
          error={error}
          fullWidth={fullWidth}
          id={id}
          labelId={hasLabel ? labelId : undefined}
          name={name}
          onBlur={onBlur}
          onChange={onChange as SelectProps['onChange']}
          onFocus={onFocus}
          placeholder={placeholder}
          required={required}
          size={size}
          value={value}
          variant={variant}
        >
          {children}
        </Select>
      ) : (
        <InputComponent
          aria-describedby={describedBy}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          color={color}
          defaultValue={defaultValue}
          disabled={disabled}
          error={error}
          fullWidth={fullWidth}
          id={id}
          inputRef={inputRef}
          multiline={multiline}
          name={name}
          onBlur={onBlur}
          onChange={onChange as InputLikeChangeEventHandler}
          onFocus={onFocus}
          placeholder={placeholder}
          readOnly={readOnly}
          required={required}
          rows={rows}
          size={size}
          type={type}
          value={value}
        />
      )}

      {hasHelperText ? <FormHelperText id={helperTextId}>{helperText}</FormHelperText> : null}
    </FormControl>
  );
};

TextField.displayName = 'TextField';
