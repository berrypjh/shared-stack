import type { ReactNode } from 'react';

import type { SelectOption } from './Select.types';

/**
 * 값에 해당하는 옵션을 찾습니다.
 *
 * 값 도메인이 문자열이라 비교는 `===` 입니다 — `1` 과 `'1'` 을 같다고 보는 web 의
 * `isValueEqual` 은 DOM 폼 규칙이라 옮기지 않습니다.
 */
export const findSelectedOption = <T extends string>(
  options: readonly SelectOption<T>[],
  value: T | undefined,
): SelectOption<T> | undefined =>
  value === undefined ? undefined : options.find((option) => option.value === value);

/**
 * 옵션을 골랐을 때의 다음 값과 변경 여부.
 *
 * disabled 옵션은 값을 만들지 못하고, 이미 선택된 값을 다시 고르면 변경이 아닙니다(web 과
 * 같습니다). SegmentControl 은 반대인데, 두 컴포넌트의 web 동작이 실제로 다릅니다.
 */
export const nextSingleValue = <T extends string>(
  option: SelectOption<T>,
  current: T | undefined,
): { changed: boolean; value: T | undefined } => {
  if (option.disabled || option.value === current) {
    return { changed: false, value: current };
  }

  return { changed: true, value: option.value };
};

/**
 * 트리거에 보여줄 내용. 우선순위는 `renderValue` → 선택된 label → placeholder → 없음입니다.
 *
 * 노드 label 은 그대로 돌려줍니다 — 임의의 노드에서 문자열을 뽑지 않고, 이름은
 * `accessibilityLabel` 이 줍니다.
 */
export const resolveDisplayNode = <T extends string>({
  selectedOption,
  value,
  placeholder,
  renderValue,
}: {
  selectedOption: SelectOption<T> | undefined;
  value: T | undefined;
  placeholder?: ReactNode;
  renderValue?: (value: T | undefined) => ReactNode;
}): ReactNode => {
  if (renderValue) {
    return renderValue(value);
  }

  if (selectedOption) {
    return selectedOption.label;
  }

  return placeholder ?? null;
};
