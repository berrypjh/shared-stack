type CxArg =
  | string
  | number
  | false
  | null
  | undefined
  | Record<string, boolean | undefined | null>;

/**
 * @deprecated RN 에서는 쓸 곳이 없다. 다음 major 에서 제거한다.
 *
 * className 결합 유틸이라 web 개념이고, 이 패키지 안에서도 쓰는 곳이 없다
 * (스타일은 `StyleSheet`/`ViewStyle` 객체로 합친다). 공개 API 였기 때문에
 * 곧바로 지우지 않고 한 번의 deprecation 을 거친다 — ui-core 가 아니라 여기에 두는 것은
 * react-ui 가 구현을 소유하고 renderer 끼리는 서로 import 하지 않기 때문이다.
 *
 * 대신 쓸 것: `StyleSheet.flatten([a, b])` 또는 배열 style prop.
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
