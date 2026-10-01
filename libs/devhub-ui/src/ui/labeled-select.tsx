'use client';

import { useId } from 'react';

/**
 * 보이는 label 이 이름인 native select. 현재 값이 목록에 없으면 그 값을 선택 불가로 보여 준다 —
 * 값이 비었으면 `placeholder` 를 쓴다.
 */
export const LabeledSelect = ({
  label,
  value,
  options,
  onChange,
  placeholder = '선택',
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
}) => {
  const id = useId();
  const known = options.some((option) => option.value === value);
  return (
    <div className="flex flex-col gap-xs">
      <label htmlFor={id} className="typo-caption-small text-text-light">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-sm border border-stroke-default bg-background-surface px-sm py-xs font-mono typo-body-small text-text-default"
      >
        {!known && (
          <option value={value} disabled>
            {value || placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};
