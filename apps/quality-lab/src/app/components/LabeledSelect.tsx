import { useId } from 'react';

/** 보이는 label 이 이름인 native select. 현재 값이 목록에 없으면 그 값을 선택 불가로 보여준다. */
export const LabeledSelect = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) => {
  const id = useId();
  const known = options.some((option) => option.value === value);
  return (
    <div className="flex flex-col gap-xs">
      <label htmlFor={id} className="text-text-light text-xxsm font-semiBold">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="font-mono text-xsm px-sm py-xs rounded-sm border border-stroke-default bg-background-surface text-text-default focus-visible:outline-2 focus-visible:outline-stroke-primary"
      >
        {!known && (
          <option value={value} disabled>
            {value || '선택'}
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
