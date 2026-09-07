/**
 * 폼 값이 "채워져 있는가"를 판정한다.
 *
 * `InputBase` 와 `FormControl` 이 label float·filled 상태를 정하는 데 함께 쓴다.
 * 컴포넌트 하나에 묶이지 않아 react-ui 공용 유틸에 둔다.
 */

/**
 * 주어진 값이 비어 있지 않은 유효한 값인지 판별합니다.
 *
 * 배열이면 길이가 1 이상일 때 유효한 값으로 간주합니다.
 * 그 외에는 `null`, `undefined`, 빈 문자열이 아니면 유효한 값으로 간주합니다.
 *
 * @param value 판별할 값
 * @returns 유효한 값이면 `true`, 아니면 `false`
 */
export const hasFormValue = (value: unknown): boolean => {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return value != null && value !== '';
};
