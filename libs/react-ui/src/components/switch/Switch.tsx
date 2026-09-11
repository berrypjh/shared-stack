'use client';

import { cx } from '../../utils';
import { useFormControl } from '../form-control';

import { switchClasses } from './Switch.constants';
import type { SwitchProps } from './Switch.types';

/**
 * 켜짐/꺼짐 설정. native `<input type="checkbox" role="switch">` 를 그대로 쓴다.
 *
 * checked·defaultChecked·disabled·required·name·value·form·FormData·form reset·Space·포커스·
 * 라벨 클릭은 native checkbox 가 소유하고, 역할만 switch 다. input 을 숨기지 않는다 — input
 * 자체가 트랙이고 thumb 은 CSS 가 그린다. 추가 DOM 이 없어 접근 가능한 이름에 섞일 것도 없다.
 *
 * FormControl 에서는 `disabled` 만 상속한다 (`required` 는 Checkbox 와 같은 이유로 받지 않는다).
 */
export const Switch = ({ children, className, style, disabled, ref, ...rest }: SwitchProps) => {
  const formControl = useFormControl();

  const resolvedDisabled = disabled ?? formControl?.disabled ?? false;

  return (
    <label className={cx(switchClasses.root, className)} style={style}>
      <input
        {...rest}
        ref={ref}
        type="checkbox"
        role="switch"
        disabled={resolvedDisabled}
        className={switchClasses.input}
      />
      {children == null ? null : <span className={switchClasses.label}>{children}</span>}
    </label>
  );
};
