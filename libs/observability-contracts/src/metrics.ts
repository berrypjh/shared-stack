/** 값을 안정적으로 직렬화한다 — key 순서에 상관없이 같은 값은 같은 문자열이다. */

const sortKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value === null || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, sortKeys((value as Record<string, unknown>)[key])]),
  );
};

export const stableJson = (value: unknown) => JSON.stringify(sortKeys(value));
