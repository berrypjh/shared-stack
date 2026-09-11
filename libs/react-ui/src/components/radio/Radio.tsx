'use client';

import { type ChangeEvent, useContext } from 'react';

import { cx } from '../../utils';

import { radioClasses } from './Radio.constants';
import type { RadioProps } from './Radio.types';
import { RadioGroupContext } from './RadioGroupContext';

/**
 * native `<input type="radio">` 를 그대로 쓰는 선택 컨트롤.
 *
 * name 그룹핑·checked·defaultChecked·required·disabled·form·FormData·form reset·Space·방향키·
 * Tab 그룹 정지는 전부 브라우저가 소유한다. 컴포넌트는 선택 상태를 들지 않고 키보드를
 * 가로채지 않는다.
 *
 * 루트는 `<label>` 이라 보이는 라벨을 누르면 선택된다. `className`·`style` 은 루트로,
 * 나머지 prop 과 `ref` 는 input 으로 간다 (Checkbox 와 같은 배분).
 *
 * `RadioGroup` 안에서는 그룹이 `name`·선택·`required`·오류를 정한다. controlled 그룹이면
 * `checked` 를, uncontrolled 그룹이면 `defaultChecked` 만 준다 — 그 뒤 선택은 브라우저 것이다.
 */
export const Radio = ({
  children,
  className,
  style,
  name,
  value,
  checked,
  defaultChecked,
  required,
  onChange,
  ref,
  ...rest
}: RadioProps) => {
  const group = useContext(RadioGroupContext);

  const groupChecked = group?.value === undefined ? checked : group.value === value;
  const groupDefaultChecked =
    group?.defaultValue === undefined ? defaultChecked : group.defaultValue === value;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
    group?.onValueChange?.(event.target.value);
  };

  return (
    <label className={cx(radioClasses.root, className)} style={style}>
      <input
        {...rest}
        ref={ref}
        type="radio"
        name={group?.name ?? name}
        value={value}
        checked={groupChecked}
        defaultChecked={groupDefaultChecked}
        required={required || group?.required}
        data-invalid={group?.error ? 'true' : undefined}
        onChange={handleChange}
        className={radioClasses.input}
      />
      {children == null ? null : <span className={radioClasses.label}>{children}</span>}
    </label>
  );
};
