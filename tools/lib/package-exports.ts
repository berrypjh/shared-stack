/**
 * package.json `exports` map에서 소비자가 실제로 쓸 수 있는 specifier를 유도한다.
 * catalog generator와 eval의 public-import grader가 공유한다.
 */

export type PackageJsonLike = {
  name?: string;
  private?: boolean;
  exports?: Record<string, unknown>;
};

/** `.` → 패키지 이름, `./x` → `<name>/x`. `./package.json`은 소비 대상이 아니라 제외. */
export const publicSpecifiers = (name: string, exportsMap?: Record<string, unknown>): string[] => {
  if (!exportsMap) return [name];
  return Object.keys(exportsMap)
    .filter((key) => key.startsWith('.'))
    .map((key) => (key === '.' ? name : `${name}${key.slice(1)}`))
    .filter((specifier) => !specifier.endsWith('/package.json'));
};

/** subpath key → specifier 매핑. catalog의 `exports` 필드가 그대로 쓴다. */
export const exportEntries = (
  name: string,
  exportsMap?: Record<string, unknown>,
): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const specifier of publicSpecifiers(name, exportsMap)) {
    out[specifier === name ? '.' : `.${specifier.slice(name.length)}`] = specifier;
  }
  return out;
};
