import type { LeafDotPath, PathValue } from './path';

/**
 * 경로를 따라 토큰 트리를 걷는다.
 *
 * 정책: **엄격 실패**. 정규 테마 객체는 선언된 경로를 반드시 가지므로, 경로가 없다는 것은
 * 값이 없다는 뜻이 아니라 트리가 계약을 어겼다는 뜻이다. `undefined` 를 흘려보내면
 * 정적 반환 타입(`PathValue<...>`)이 거짓말을 하게 되고, 색 자리에 `undefined` 가 들어간
 * 채로 렌더까지 내려가 원인에서 먼 곳에서 터진다. 그래서 읽는 지점에서 던진다.
 */
const readPath = (obj: unknown, path: string): unknown => {
  let cur: unknown = obj;

  for (const part of path.split('.')) {
    if (cur === null || typeof cur !== 'object') {
      throw new Error(`getToken: cannot read "${path}" — "${part}" has no object to read from`);
    }
    if (!(part in cur)) {
      throw new Error(`getToken: "${path}" is not in the token tree — "${part}" is missing`);
    }
    cur = (cur as Record<string, unknown>)[part];
  }

  return cur;
};

export const getToken = <TObj, P extends LeafDotPath<TObj>>(
  obj: TObj,
  path: P,
): PathValue<TObj, P> => {
  return readPath(obj, path) as PathValue<TObj, P>;
};
