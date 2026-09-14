import { cx } from '../../utils';
import { FormControlContextValue } from '../form-control';

import { inputLabelClasses } from './InputLabel.constants';
import type { InputLabelOwnProps } from './InputLabel.types';

/** InputLabel root className 생성 */
export const getInputLabelClassNames = ({
  className,
  color,
  disabled,
  error,
  focused,
  formControl,
  required,
  size,
}: Pick<InputLabelOwnProps, 'color' | 'disabled' | 'error' | 'focused' | 'required' | 'size'> & {
  className?: string;
  formControl?: FormControlContextValue;
}) =>
  cx(
    inputLabelClasses.root,
    formControl && inputLabelClasses.formControl,
    focused && inputLabelClasses.focused,
    disabled && inputLabelClasses.disabled,
    error && inputLabelClasses.error,
    required && inputLabelClasses.required,
    size === 'sm' && inputLabelClasses.sizeSm,
    size === 'md' && inputLabelClasses.sizeMd,
    color === 'primary' && inputLabelClasses.colorPrimary,
    color === 'secondary' && inputLabelClasses.colorSecondary,
    className,
  );
