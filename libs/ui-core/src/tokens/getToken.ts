import type { LeafDotPath, PathValue } from './path';

/** 점 표기 경로를 따라 토큰 트리 걷기, 없는 노드는 throw (`color.primary` → `tree.color.primary`) */
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
