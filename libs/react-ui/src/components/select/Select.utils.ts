import { Children, Fragment, isValidElement, type ReactNode } from 'react';

import { cx, getNodeText } from '../../utils';

import { selectClasses } from './Select.constants';
import { hasDisplayValue, stringifyValue } from './Select.selection';
import type { SelectChangeEvent, SelectLikeChildProps, SelectOptionElement } from './Select.types';

/** option 비활성 여부 */
export const isOptionDisabled = (option: SelectOptionElement) => !!option.props.disabled;

/**
 * children → 선택 가능한 option element 평탄 배열.
 * Fragment는 재귀적으로 펼치고, `value` prop이 있는 요소만 옵션으로 간주한다.
 */
export const flattenOptionChildren = (children: ReactNode): SelectOptionElement[] => {
  const result: SelectOptionElement[] = [];

  Children.forEach(children, (child) => {
    if (child == null || typeof child === 'boolean') {
      return;
    }

    if (!isValidElement<SelectLikeChildProps>(child)) {
      return;
    }

    if (child.type === Fragment) {
      result.push(...flattenOptionChildren(child.props.children));
      return;
    }

    if (!('value' in child.props)) {
      return;
    }

    result.push(child);
  });

  return result;
};

/** Select 초기 값, `defaultValue`가 없으면 multiple은 `[]`, 단일 선택은 `''` */
export const getDefaultSelectValue = (multiple: boolean, defaultValue: unknown): unknown => {
  if (defaultValue !== undefined) {
    return defaultValue;
  }

  return multiple ? [] : '';
};

/** hidden input용 문자열 배열, 단일 선택 모드는 길이 1 */
export const getHiddenValues = ({ multiple, value }: { multiple: boolean; value: unknown }) => {
  if (multiple) {
    return Array.isArray(value) ? value.map((item) => stringifyValue(item)) : [];
  }

  return [stringifyValue(value)];
};

/**
 * Select trigger 표시값 계산.
 * `renderValue`가 있으면 그것을 우선하고, 없으면 선택 값·`placeholder`·`displayEmpty` 조건에 따라 표시값을 고른다.
 */
export const getDisplayValue = ({
  displayEmpty,
  multiple,
  placeholder,
  renderValue,
  selectedOptions,
  value,
}: {
  displayEmpty: boolean;
  multiple: boolean;
  placeholder?: ReactNode;
  renderValue?: (value: unknown) => ReactNode;
  selectedOptions: SelectOptionElement[];
  value: unknown;
}) => {
  if (renderValue) {
    return renderValue(value);
  }

  if (hasDisplayValue(value, multiple)) {
    if (multiple) {
      return selectedOptions
        .map((child) => getNodeText(child.props.children))
        .filter(Boolean)
        .join(', ');
    }

    const selected = selectedOptions[0];
    return selected ? getNodeText(selected.props.children) : null;
  }

  if (displayEmpty) {
    if (multiple) {
      return '';
    }

    const selected = selectedOptions[0];
    return selected ? getNodeText(selected.props.children) : '';
  }

  if (placeholder != null) {
    return placeholder;
  }

  return null;
};

/** Select용 synthetic change event (`{ target: { name, value } }`) */
export const createSyntheticChangeEvent = (
  name: string | undefined,
  value: unknown,
): SelectChangeEvent => ({
  target: {
    name,
    value,
  },
});

/** Select root className 조합, 상태·변형별 modifier class를 붙인다 */
export const getSelectRootClassNames = ({
  className,
  color,
  disabled,
  error,
  focused,
  fullWidth,
  multiple,
  open,
  size,
  variant,
}: {
  className?: string;
  color: 'primary' | 'secondary';
  disabled: boolean;
  error: boolean;
  focused: boolean;
  fullWidth: boolean;
  multiple: boolean;
  open: boolean;
  size: 'sm' | 'md';
  variant: 'plain' | 'filled' | 'boxed';
}) =>
  cx(
    selectClasses.root,
    open && selectClasses.open,
    focused && selectClasses.focused,
    disabled && selectClasses.disabled,
    error && selectClasses.error,
    multiple && selectClasses.multiple,
    fullWidth && selectClasses.fullWidth,
    size === 'sm' && selectClasses.sizeSm,
    size === 'md' && selectClasses.sizeMd,
    variant === 'plain' && selectClasses.variantPlain,
    variant === 'filled' && selectClasses.variantFilled,
    variant === 'boxed' && selectClasses.variantBoxed,
    color === 'primary' && selectClasses.colorPrimary,
    color === 'secondary' && selectClasses.colorSecondary,
    className,
  );
