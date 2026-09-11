import { createContext } from 'react';

/**
 * RadioGroup 이 자식 Radio 에게 내려보내는 값. 비공개 — 배럴에서 내보내지 않는다.
 *
 * RN 에는 native radio 그룹핑이 없어서 선택 값을 그룹이 가진다 (web 은 브라우저가 가진다).
 */
export interface RadioGroupContextValue {
  value: string | undefined;
  disabled: boolean;
  error: boolean;
  select: (value: string) => void;
}

// PURE annotation: 트리셰이커가 미사용 시 떨어내도록 사이드이펙트 없음을 명시.
export const RadioGroupContext = /*#__PURE__*/ createContext<RadioGroupContextValue | undefined>(
  undefined,
);
