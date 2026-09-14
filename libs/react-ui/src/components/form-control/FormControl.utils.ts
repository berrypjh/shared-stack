import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';

import { cx, hasFormValue } from '../../utils';

import { formControlClasses } from './FormControl.constants';
import type {
  DerivedChildState,
  FormControlOwnProps,
  InspectableElementProps,
} from './FormControl.types';

/** 두 파생 상태 병합, 필드별 OR (하나라도 `true`면 `true`) */
const mergeDerivedState = (a: DerivedChildState, b: DerivedChildState): DerivedChildState => ({
  filled: a.filled || b.filled,
  adornedStart: a.adornedStart || b.adornedStart,
});

/** `InspectableElementProps` props를 가진 React 엘리먼트인지 검사 */
const isInspectableElement = (child: ReactNode): child is ReactElement<InspectableElementProps> => {
  return isValidElement<InspectableElementProps>(child);
};

/**
 * 자식 트리를 재귀 순회해 FormControl 파생 상태 계산.
 * - `filled`: `value`·`defaultValue`·`inputProps.value`·`inputProps.defaultValue` 중 하나라도 유효한 값이 있으면 `true`
 * - `adornedStart`: `startAdornment`가 있으면 `true`
 * `input` prop과 중첩된 `children`까지 검사해 전체 트리 기준으로 도출한다.
 */
export const deriveStateFromChildren = (children: ReactNode): DerivedChildState => {
  let state: DerivedChildState = {
    filled: false,
    adornedStart: false,
  };

  Children.forEach(children, (child) => {
    if (!isInspectableElement(child)) {
      return;
    }

    const {
      children: nestedChildren,
      defaultValue,
      input,
      inputProps,
      startAdornment,
      value,
    } = child.props;

    const ownState: DerivedChildState = {
      filled:
        hasFormValue(value) ||
        hasFormValue(defaultValue) ||
        hasFormValue(inputProps?.value) ||
        hasFormValue(inputProps?.defaultValue),
      adornedStart: startAdornment != null,
    };

    state = mergeDerivedState(state, ownState);

    if (input != null) {
      state = mergeDerivedState(state, deriveStateFromChildren(input));
    }

    if (nestedChildren != null) {
      state = mergeDerivedState(state, deriveStateFromChildren(nestedChildren));
    }
  });

  return state;
};

/** FormControl root className 생성, 상태·옵션별 modifier 뒤에 외부 `className`을 병합 */
export const getFormControlClassNames = ({
  className,
  disabled,
  error,
  focused,
  fullWidth,
  hiddenLabel,
  margin,
  variant,
}: Pick<
  FormControlOwnProps,
  'className' | 'disabled' | 'error' | 'fullWidth' | 'hiddenLabel' | 'margin' | 'variant'
> & {
  focused: boolean;
}) =>
  cx(
    formControlClasses.root,
    fullWidth && formControlClasses.fullWidth,
    hiddenLabel && formControlClasses.hiddenLabel,
    disabled && formControlClasses.disabled,
    error && formControlClasses.error,
    focused && formControlClasses.focused,
    margin === 'dense' && formControlClasses.marginDense,
    margin === 'normal' && formControlClasses.marginNormal,
    variant === 'plain' && formControlClasses.variantPlain,
    variant === 'filled' && formControlClasses.variantFilled,
    variant === 'boxed' && formControlClasses.variantBoxed,
    className,
  );
