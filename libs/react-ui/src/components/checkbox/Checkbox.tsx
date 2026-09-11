'use client';

import { useCallback, useLayoutEffect, useRef } from 'react';

import { cx } from '../../utils';
import { assignRef } from '../../utils/react';
import { useFormControl } from '../form-control';

import { checkboxClasses } from './Checkbox.constants';
import type { CheckboxProps } from './Checkbox.types';

/**
 * native `<input type="checkbox">` 를 그대로 쓰는 선택 컨트롤.
 *
 * checked·defaultChecked·disabled·required·name·value·form·form reset·FormData·Space·라벨 클릭은
 * 전부 native 가 소유한다. 컴포넌트는 체크 상태를 들지 않는다.
 *
 * - 루트는 `<label>` 이라 보이는 라벨을 누르면 토글된다. `className`·`style` 은 루트로,
 *   나머지 prop 과 `ref` 는 input 으로 간다.
 * - `indeterminate` 는 DOM property 라 렌더마다 동기화한다. attribute 로 새지 않는다.
 * - FormControl 에서는 `disabled`·`error` 만 상속한다. `required` 는 그룹의 필수와 뜻이 달라서,
 *   `size`·`color` 는 대응하는 토큰이 없어서 받지 않는다.
 */
export const Checkbox = ({
  children,
  className,
  style,
  indeterminate = false,
  error,
  disabled,
  'aria-invalid': ariaInvalid,
  ref,
  ...rest
}: CheckboxProps) => {
  const formControl = useFormControl();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const resolvedDisabled = disabled ?? formControl?.disabled ?? false;
  const resolvedError = error ?? formControl?.error ?? false;

  // 의존성 배열이 없는 것이 의도다: 클릭이 property 를 지워도 다음 렌더에서 prop 이 진실이 된다.
  useLayoutEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  });

  const handleRef = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;
      assignRef(ref, node);
    },
    [ref],
  );

  return (
    <label className={cx(checkboxClasses.root, className)} style={style}>
      <input
        {...rest}
        ref={handleRef}
        type="checkbox"
        disabled={resolvedDisabled}
        aria-invalid={ariaInvalid ?? (resolvedError || undefined)}
        className={checkboxClasses.input}
      />
      {children == null ? null : <span className={checkboxClasses.label}>{children}</span>}
    </label>
  );
};
