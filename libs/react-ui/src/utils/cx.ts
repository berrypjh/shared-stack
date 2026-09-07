type CxArg =
  | string
  | number
  | false
  | null
  | undefined
  | Record<string, boolean | undefined | null>;

/**
 * cx: 조건부 className 결합 유틸
 *
 * className 은 web 렌더링 개념이라 react-ui 가 소유한다. 순수 함수라는 것과
 * 공유 계층에 둘 이유가 있다는 것은 별개다 — RN 은 StyleSheet 객체를 쓴다.
 *
 * @param {...CxArg[]} args
 *  결합할 클래스 인자들.
 *  - `string | number`: 그대로 class로 추가 (trim 후 비어있으면 제외)
 *  - `false | null | undefined`: 무시
 *  - `Record<string, boolean | null | undefined>`: 값이 truthy인 key만 추가
 *
 * @returns {string}
 *  공백으로 결합된 className 문자열.
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
