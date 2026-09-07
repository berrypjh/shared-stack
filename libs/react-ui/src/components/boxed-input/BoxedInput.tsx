'use client';

import { cx } from '../../utils';
import { InputBase } from '../input-base';

import { boxedInputClasses } from './BoxedInput.constants';
import type { BoxedInputProps } from './BoxedInput.types';

export const BoxedInput = ({ className, ref, ...rest }: BoxedInputProps) => {
  return (
    <InputBase
      {...rest}
      ref={ref}
      className={cx(boxedInputClasses.root, className)}
      inputClassName={boxedInputClasses.input}
    />
  );
};

BoxedInput.displayName = 'BoxedInput';
