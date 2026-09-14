import { createContext } from 'react';

/**
 * RadioGroup이 자식 Radio에게 내려보내는 값.
 * 비공개 — 배럴에서 내보내지 않는다.
 * 선택 상태는 여기 없다.
 * controlled면 `value`가, uncontrolled면 브라우저가 가진다.
 */
export interface RadioGroupContextValue {
  name: string;
  value: string | undefined;
  defaultValue: string | undefined;
  required: boolean;
  error: boolean;
  onValueChange: ((value: string) => void) | undefined;
}

// PURE annotation — 트리셰이커가 미사용 시 떨어내도록 사이드이펙트가 없음을 명시한다.
export const RadioGroupContext = /*#__PURE__*/ createContext<RadioGroupContextValue | undefined>(
  undefined,
);
