import type { ReactNode } from 'react';

import { cx } from '../../utils';

import { formHelperTextClasses } from './FormHelperText.constants';
import type { FormHelperTextOwnProps } from './FormHelperText.types';

/** FormHelperText root className 생성, 상태·옵션별 modifier 뒤에 외부 `className`을 병합 */
export const getFormHelperTextClassNames = ({
  className,
  disabled,
  error,
  size,
}: Pick<FormHelperTextOwnProps, 'disabled' | 'error' | 'size'> & {
  className?: string;
}) =>
  cx(
    formHelperTextClasses.root,
    disabled && formHelperTextClasses.disabled,
    error && formHelperTextClasses.error,
    size === 'sm' && formHelperTextClasses.sizeSm,
    size === 'md' && formHelperTextClasses.sizeMd,
    className,
  );

export const getFormHelperTextContent = ({ children }: { children?: ReactNode }) => {
  if (children === ' ') {
    return <span aria-hidden="true">{'\u200B'}</span>;
  }

  return children;
};
