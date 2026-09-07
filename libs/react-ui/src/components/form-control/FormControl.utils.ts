import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';

import { cx, hasFormValue } from '../../utils';

import { formControlClasses } from './FormControl.constants';
import type {
  DerivedChildState,
  FormControlOwnProps,
  InspectableElementProps,
} from './FormControl.types';

/**
 * 두 개의 파생 상태를 병합합니다.
 *
 * 각 상태 필드는 OR 연산으로 합쳐지며,
 * 하나라도 `true`이면 최종 결과는 `true`가 됩니다.
 *
 * @param a 첫 번째 파생 상태
 * @param b 두 번째 파생 상태
 * @returns 병합된 파생 상태
 */
const mergeDerivedState = (a: DerivedChildState, b: DerivedChildState): DerivedChildState => ({
  filled: a.filled || b.filled,
  adornedStart: a.adornedStart || b.adornedStart,
});

/**
 * 전달된 React 노드가 검사 가능한 React 엘리먼트인지 판별합니다.
 *
 * 이 함수는 `InspectableElementProps` 형태의 props를 가진
 * React 엘리먼트만 후속 처리 대상으로 좁혀 줍니다.
 *
 * @param child 검사할 React 노드
 * @returns 검사 가능한 React 엘리먼트이면 `true`, 아니면 `false`
 */
const isInspectableElement = (child: ReactNode): child is ReactElement<InspectableElementProps> => {
  return isValidElement<InspectableElementProps>(child);
};

/**
 * 자식 노드 트리를 순회하며 FormControl의 파생 상태를 계산합니다.
 *
 * 다음 정보를 재귀적으로 수집합니다.
 * - `filled`: `value`, `defaultValue`, `inputProps.value`, `inputProps.defaultValue` 중
 *   하나라도 유효한 값이 있으면 `true`
 * - `adornedStart`: `startAdornment`가 존재하면 `true`
 *
 * 또한 `input` prop과 중첩된 `children`까지 재귀적으로 검사하여
 * 전체 트리 기준의 상태를 도출합니다.
 *
 * @param children 검사할 자식 노드
 * @returns 자식 트리로부터 계산된 파생 상태
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

/**
 * FormControl 루트 엘리먼트에 적용할 클래스 이름 문자열을 생성합니다.
 *
 * 상태값과 옵션에 따라 대응하는 modifier 클래스를 조건부로 조합하고,
 * 마지막에 외부에서 전달된 `className`을 함께 병합합니다.
 *
 * @param params 클래스 이름 생성에 사용할 FormControl 상태 및 옵션
 * @param params.className 추가로 병합할 사용자 정의 클래스 이름
 * @param params.disabled 비활성화 여부
 * @param params.error 에러 상태 여부
 * @param params.focused 포커스 상태 여부
 * @param params.fullWidth 전체 너비 사용 여부
 * @param params.hiddenLabel 라벨 숨김 여부
 * @param params.margin 마진 크기
 * @param params.variant FormControl 변형
 * @returns 병합된 클래스 이름 문자열
 */
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
