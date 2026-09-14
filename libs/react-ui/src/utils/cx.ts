type CxArg =
  | string
  | number
  | false
  | null
  | undefined
  | Record<string, boolean | undefined | null>;

/**
 * 조건부 className 결합 (`'a', { b: true, c: false }` → `'a b'`).
 * - `string | number`: 그대로 추가 (trim 후 비어 있으면 제외)
 * - `false | null | undefined`: 무시
 * - `Record<string, boolean | null | undefined>`: 값이 truthy인 key만 추가
 * className은 web 렌더링 개념이라 react-ui가 소유한다.
 * 순수 함수라는 것과 공유 계층에 둘 이유가 있다는 것은 별개다 — RN은 StyleSheet 객체를 쓴다.
 */
export const cx = (...args: CxArg[]): string => {
  const out: string[] = [];

  for (const arg of args) {
    if (!arg) continue;

    if (typeof arg === 'string' || typeof arg === 'number') {
      const s = String(arg).trim();
      if (s) out.push(s);
      continue;
    }

    if (typeof arg === 'object') {
      for (const [key, val] of Object.entries(arg)) {
        if (val) out.push(key);
      }
    }
  }

  return out.join(' ');
};
