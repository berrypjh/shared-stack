/** ref에 value 할당, 함수형 ref와 object ref를 모두 받는다 */
export const assignRef = (ref: unknown, value: unknown) => {
  if (typeof ref === 'function') {
    ref(value);
    return;
  }

  if (ref && typeof ref === 'object' && 'current' in ref) {
    ref.current = value;
  }
};
