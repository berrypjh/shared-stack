import { createContext } from 'react';

import type { FieldColor, FieldSize } from '@berrypjh/ui-core';

/**
 * 자손이 상속하는 필드 상태. 비공개 — 배럴에서 내보내지 않는다.
 *
 * 소비자가 있는 값만 둔다. web이 계산하는 `filled`·`adornedStart`는 web에서도 읽는 곳이
 * 없고, `variant`는 Plain/Filled/Boxed가 각자 고정해서 상속할 것이 없다.
 */
export interface FormControlContextValue {
  color: FieldColor;
  size: FieldSize;
  disabled: boolean;
  error: boolean;
  required: boolean;
  fullWidth: boolean;

  /** `disabled`를 이미 반영한 값. */
  focused: boolean;

  onInputFocus: () => void;
  onInputBlur: () => void;
}

// PURE annotation: 트리셰이커가 미사용 시 떨어내도록 사이드이펙트 없음을 명시.
export const FormControlContext = /*#__PURE__*/ createContext<FormControlContextValue | undefined>(
  undefined,
);
