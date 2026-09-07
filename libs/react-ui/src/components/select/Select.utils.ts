import { Children, Fragment, isValidElement, type ReactNode } from 'react';

import { cx, getNodeText } from '../../utils';

import { selectClasses } from './Select.constants';
import { hasDisplayValue, stringifyValue } from './Select.selection';
import type { SelectChangeEvent, SelectLikeChildProps, SelectOptionElement } from './Select.types';

/**
 * option이 비활성화되었는지 확인합니다.
 *
 * @param option 확인 대상 option
 * @returns 비활성화 여부
 */
export const isOptionDisabled = (option: SelectOptionElement) => !!option.props.disabled;

/**
 * children에서 선택 가능한 option element만 평탄화해서 추출합니다.
 *
 * Fragment는 재귀적으로 펼치고,
 * `value` prop이 있는 요소만 옵션으로 간주합니다.
 *
 * @param children 순회할 children
 * @returns 평탄화된 option element 배열
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

/**
 * Select의 초기 값을 계산합니다.
 *
 * defaultValue가 명시되면 이를 우선 사용하고,
 * 그렇지 않으면 multiple 여부에 따라 빈 배열 또는 빈 문자열을 반환합니다.
 *
 * @param multiple 다중 선택 여부
 * @param defaultValue 기본값
 * @returns 초기 값
 */
export const getDefaultSelectValue = (multiple: boolean, defaultValue: unknown): unknown => {
  if (defaultValue !== undefined) {
    return defaultValue;
  }

  return multiple ? [] : '';
};

/**
 * hidden input에 넣을 문자열 배열을 생성합니다.
 *
 * multiple 모드에서는 모든 값을 문자열 배열로 변환하고,
 * 단일 선택 모드에서는 길이 1인 배열로 반환합니다.
 *
 * @param params 계산에 필요한 값 묶음
 * @param params.multiple 다중 선택 여부
 * @param params.value 현재 값
 * @returns hidden input용 문자열 배열
 */
export const getHiddenValues = ({ multiple, value }: { multiple: boolean; value: unknown }) => {
  if (multiple) {
    return Array.isArray(value) ? value.map((item) => stringifyValue(item)) : [];
  }

  return [stringifyValue(value)];
};

/**
 * Select trigger에 표시할 값을 계산합니다.
 *
 * renderValue가 있으면 이를 우선 사용하고,
 * 선택 값/placeholder/displayEmpty 조건에 따라 적절한 표시값을 반환합니다.
 *
 * @param params 계산에 필요한 값 묶음
 * @param params.displayEmpty 비어 있어도 표시할지 여부
 * @param params.multiple 다중 선택 여부
 * @param params.placeholder placeholder 노드
 * @param params.renderValue 사용자 정의 렌더 함수
 * @param params.selectedOptions 현재 선택된 옵션 배열
 * @param params.value 현재 값
 * @returns trigger에 표시할 값
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

/**
 * Select용 synthetic change event 객체를 생성합니다.
 *
 * @param name 필드 이름
 * @param value 다음 값
 * @returns SelectChangeEvent 형태의 이벤트 객체
 */
export const createSyntheticChangeEvent = (
  name: string | undefined,
  value: unknown,
): SelectChangeEvent => ({
  target: {
    name,
    value,
  },
});

/**
 * Select root className을 계산합니다.
 *
 * 상태값과 변형 정보를 바탕으로 modifier class를 조합합니다.
 *
 * @param params className 계산에 필요한 값 묶음
 * @param params.className 추가 className
 * @param params.color 색상
 * @param params.disabled 비활성화 여부
 * @param params.error 에러 여부
 * @param params.focused 포커스 여부
 * @param params.fullWidth 전체 너비 여부
 * @param params.multiple 다중 선택 여부
 * @param params.open 열림 여부
 * @param params.size 크기
 * @param params.variant variant 종류
 * @returns 조합된 className 문자열
 */
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
