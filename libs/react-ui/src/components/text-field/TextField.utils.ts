import type { ReactNode } from 'react';

import type { FieldVariant } from '../../types';
import { BoxedInput } from '../boxed-input';
import { FilledInput } from '../filled-input';
import { PlainInput } from '../plain-input';

const variantComponent = {
  plain: PlainInput,
  filled: FilledInput,
  boxed: BoxedInput,
} as const;

/** variant에 맞는 input 컴포넌트 선택 (`filled` → `FilledInput`) */
export const getTextFieldInputComponent = (variant: FieldVariant) => {
  return variantComponent[variant];
};

/** label·helperText처럼 표시 여부를 판단할 ReactNode가 비어 있지 않은지 검사 */
export const hasTextFieldContent = (value: ReactNode): boolean => {
  return value != null && value !== '';
};

/** helper text가 있을 때 쓸 `aria-describedby`용 id 생성, 없으면 `undefined` */
export const getTextFieldHelperTextId = ({
  hasHelperText,
  id,
}: {
  hasHelperText: boolean;
  id: string;
}) => {
  return hasHelperText ? `${id}-helper-text` : undefined;
};

/**
 * 설명 id 목록을 공백으로 결합, `undefined`는 무시하고 하나도 없으면 `undefined`.
 * `aria-describedby`는 여러 요소를 가리키는 id 목록이다.
 * 소비자가 준 값과 helper text id 중 하나를 버리면 스크린리더가 설명 하나를 통째로 잃는다 — 타입도 런타임도 경고하지 않으므로 합성이 기본이어야 한다.
 * 소비자 값을 앞에 둬서 읽히는 순서를 소비자가 정한다.
 */
export const composeDescribedBy = (...ids: (string | undefined)[]): string | undefined => {
  const present = ids.filter((id): id is string => id != null && id !== '');

  return present.length > 0 ? present.join(' ') : undefined;
};
