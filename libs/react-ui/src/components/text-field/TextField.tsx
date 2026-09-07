'use client';

import { useId } from 'react';

import { cx } from '../../utils';
import { FormControl } from '../form-control';
import { FormHelperText } from '../form-helper-text';
import { InputLabel } from '../input-label';
import { Select } from '../select';

import { textFieldClasses } from './TextField.constants';
import type { TextFieldProps } from './TextField.types';
import {
  getTextFieldHelperTextId,
  getTextFieldInputComponent,
  hasTextFieldContent,
} from './TextField.utils';

export const TextField = ({
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

  const hasLabel = hasTextFieldContent(label);
  const hasHelperText = hasTextFieldContent(helperText);

  const helperTextId = getTextFieldHelperTextId({
    hasHelperText,
    id,
  });

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
      {hasLabel ? <InputLabel htmlFor={id}>{label}</InputLabel> : null}

      {select ? (
        <Select
          aria-describedby={helperTextId}
          autoFocus={autoFocus}
          color={color}
          defaultValue={defaultValue}
          disabled={disabled}
          error={error}
          fullWidth={fullWidth}
          id={id}
          name={name}
          onBlur={onBlur}
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
          aria-describedby={helperTextId}
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
          onChange={onChange}
          onFocus={onFocus}
          placeholder={placeholder}
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
