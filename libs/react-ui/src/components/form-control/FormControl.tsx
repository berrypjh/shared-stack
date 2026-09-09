'use client';

import { createElement, useCallback, useEffect, useMemo, useState } from 'react';

import type { FormControlImplementationProps } from './FormControl.types';
import { deriveStateFromChildren, getFormControlClassNames } from './FormControl.utils';
import { FormControlContext } from './FormControlContext';

export const FormControl = (props: FormControlImplementationProps) => {
  const {
    children,
    className,
    color = 'primary',
    component,
    disabled = false,
    error = false,
    focused: focusedProp,
    fullWidth = false,
    hiddenLabel = false,
    margin = 'none',
    required = false,
    size = 'md',
    variant = 'boxed',
    ref,
    onFocus,
    onBlur,
    ...rest
  } = props;

  const Component = component ?? 'div';

  const derivedChildState = useMemo(() => deriveStateFromChildren(children), [children]);

  const [focusedState, setFocusedState] = useState(false);
  const [adornedStartState, setAdornedStartState] = useState(false);

  /**
   * 자식 스캔은 **첫 값만** 정한다.
   *
   * 값을 넣은 채로 마운트해도 첫 페인트부터 filled여야 라벨이 튀지 않는다. 하지만 그 뒤로는
   * 입력이 `onFilled`/`onEmpty`로 알려주는 것이 진실이다 — 스캔은 `defaultValue`를 계속 참으로
   * 읽으므로, OR로 합치면 사용자가 지워도 filled가 내려오지 못한다.
   */
  const [filled, setFilled] = useState(derivedChildState.filled);

  useEffect(() => {
    if (disabled) {
      setFocusedState(false);
    }
  }, [disabled]);

  const focused = !disabled && (focusedProp ?? focusedState);

  // 장식은 런타임 값이 아니라 prop이라 스캔이 children 변화를 그대로 따라간다.
  const adornedStart = derivedChildState.adornedStart || adornedStartState;

  const handleFocus = useCallback(
    (event: React.FocusEvent<Element>) => {
      onFocus?.(event);

      if (!disabled) {
        setFocusedState(true);
      }
    },
    [disabled, onFocus],
  );

  const handleBlur = useCallback(
    (event: React.FocusEvent<Element>) => {
      onBlur?.(event);

      const nextFocusedElement = event.relatedTarget;

      if (nextFocusedElement instanceof Node && event.currentTarget.contains(nextFocusedElement)) {
        return;
      }

      setFocusedState(false);
    },
    [onBlur],
  );

  const handleContextFocus = useCallback(() => {
    if (!disabled) {
      setFocusedState(true);
    }
  }, [disabled]);

  const handleContextBlur = useCallback(() => {
    setFocusedState(false);
  }, []);

  const handleFilled = useCallback(() => {
    setFilled(true);
  }, []);

  const handleEmpty = useCallback(() => {
    setFilled(false);
  }, []);

  const contextValue = useMemo(
    () => ({
      adornedStart,
      color,
      disabled,
      error,
      filled,
      focused,
      fullWidth,
      hiddenLabel,
      margin,
      required,
      size,
      variant,
      setAdornedStart: setAdornedStartState,
      onFocus: handleContextFocus,
      onBlur: handleContextBlur,
      onFilled: handleFilled,
      onEmpty: handleEmpty,
    }),
    [
      adornedStart,
      color,
      disabled,
      error,
      filled,
      focused,
      fullWidth,
      handleContextBlur,
      handleContextFocus,
      handleEmpty,
      handleFilled,
      hiddenLabel,
      margin,
      required,
      size,
      variant,
    ],
  );

  const classNames = getFormControlClassNames({
    className,
    disabled,
    error,
    focused,
    fullWidth,
    hiddenLabel,
    margin,
    variant,
  });

  const rootProps = {
    ...rest,
    ref,
    className: classNames,
    onFocus: handleFocus,
    onBlur: handleBlur,
  };

  return (
    <FormControlContext.Provider value={contextValue}>
      {createElement(Component, rootProps, children)}
    </FormControlContext.Provider>
  );
};

FormControl.displayName = 'FormControl';
