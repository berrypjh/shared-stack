'use client';

import { createContext } from 'react';

import type { FieldColor, FieldMargin, FieldSize, FieldVariant } from '../../types';

export interface FormControlContextValue {
  color: FieldColor;
  disabled: boolean;
  error: boolean;
  focused: boolean;
  filled: boolean;
  fullWidth: boolean;
  hiddenLabel: boolean;
  margin: FieldMargin;
  required: boolean;
  size: FieldSize;
  variant: FieldVariant;
  adornedStart: boolean;
  setAdornedStart: (value: boolean) => void;
  onFocus: () => void;
  onBlur: () => void;
  onFilled: () => void;
  onEmpty: () => void;
}

// PURE annotation은 사이드이펙트가 없음을 명시해 트리셰이커가 미사용 시 떨어내게 한다.
export const FormControlContext = /*#__PURE__*/ createContext<FormControlContextValue | undefined>(
  undefined,
);
