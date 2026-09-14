'use client';

import { cx } from '../../utils';

import { segmentControlClasses } from './SegmentControl.constants';
import type { SegmentControlProps } from './SegmentControl.types';

export const SegmentControl = <T extends string>({
  value,
  onChange,
  options,
  className,
  ref,
  ...rest
}: SegmentControlProps<T>) => (
  <div
    {...rest}
    ref={ref}
    role={rest.role ?? 'group'}
    className={cx(segmentControlClasses.root, className)}
  >
    {options.map((opt) => {
      const isActive = opt.value === value;
      return (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          disabled={opt.disabled}
          aria-pressed={isActive}
          aria-label={opt.ariaLabel}
          className={cx(
            segmentControlClasses.option,
            isActive && segmentControlClasses.active,
            opt.className,
          )}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);

SegmentControl.displayName = 'SegmentControl';
