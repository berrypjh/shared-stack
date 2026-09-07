'use client';

import { cx } from '../../utils';
import { InputBase } from '../input-base';

import { filledInputClasses } from './FilledInput.constants';
import type { FilledInputProps } from './FilledInput.types';

export const FilledInput = ({ className, ref, ...rest }: FilledInputProps) => {
  return (
    <InputBase
      {...rest}
      ref={ref}
      className={cx(filledInputClasses.root, className)}
      inputClassName={filledInputClasses.input}
    />
  );
};

FilledInput.displayName = 'FilledInput';
