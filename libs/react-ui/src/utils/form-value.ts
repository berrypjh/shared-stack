/**
 * 폼 값이 "채워져 있는가"를 판정한다.
 * `InputBase`와 `FormControl`이 label float·filled 상태를 정하는 데 함께 쓴다.
 * 컴포넌트 하나에 묶이지 않아 react-ui 공용 유틸에 둔다.
 */

/**
 * 비어 있지 않은 폼 값인지 판별 (`[]` → `false`, `0` → `true`).
 * 배열은 길이가 1 이상이면, 그 외는 `null`·`undefined`·빈 문자열이 아니면 값이 있다고 본다.
 */
export const hasFormValue = (value: unknown): boolean => {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return value != null && value !== '';
};
