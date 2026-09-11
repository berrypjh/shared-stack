'use client';

import { useId, useMemo } from 'react';

import { cx } from '../../utils';
import { useFormControl } from '../form-control';

import { radioGroupClasses } from './RadioGroup.constants';
import type { RadioGroupProps } from './RadioGroup.types';
import { RadioGroupContext } from './RadioGroupContext';

/**
 * native `<fieldset>`·`<legend>` 로 Radio 를 묶는다.
 *
 * 그룹 시맨틱·이름·`disabled` 전파는 fieldset 이, 단일 선택·방향키·Tab 정지·form reset 은
 * 같은 `name` 의 native radio 가 소유한다. 그룹이 하는 일은 `name`·선택 값·`required`·오류를
 * 자식에게 내려보내는 것뿐이다 — 키보드를 가로채지 않고 roving tabindex 를 만들지 않는다.
 *
 * FormControl 에서 `disabled`·`error`·`required` 를 상속한다. RadioGroup 은 그 자체로 하나의
 * 필드라 `required` 의 뜻이 같다 (Checkbox 는 받지 않는다).
 */
export const RadioGroup = ({
  label,
  name,
  value,
  defaultValue,
  onValueChange,
  required,
  error,
  disabled,
  className,
  children,
  ref,
  ...rest
}: RadioGroupProps) => {
  const formControl = useFormControl();
  const generatedName = useId();

  const resolvedDisabled = disabled ?? formControl?.disabled ?? false;
  const resolvedError = error ?? formControl?.error ?? false;
  const resolvedRequired = required ?? formControl?.required ?? false;
  const resolvedName = name ?? generatedName;

  const context = useMemo(
    () => ({
      name: resolvedName,
      value,
      defaultValue,
      required: resolvedRequired,
      error: resolvedError,
      onValueChange,
    }),
    [resolvedName, value, defaultValue, resolvedRequired, resolvedError, onValueChange],
  );

  return (
    <fieldset
      {...rest}
      ref={ref}
      disabled={resolvedDisabled}
      className={cx(radioGroupClasses.root, resolvedError && radioGroupClasses.error, className)}
    >
      {label == null ? null : <legend className={radioGroupClasses.label}>{label}</legend>}
      <RadioGroupContext.Provider value={context}>{children}</RadioGroupContext.Provider>
    </fieldset>
  );
};
