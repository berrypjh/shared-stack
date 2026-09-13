import rawTokens from '@berrypjh/react-ui/tokens';

/**
 * 공개 token artifact(`@berrypjh/react-ui/tokens`) adapter.
 *
 * artifact 의 자기 기술 schema 는 `tokens[path] = [cssVar, ...valuesInThemesOrder]` 다.
 * row 의 첫 칸이 CSS 변수이고 그 뒤가 `themes` 배열과 **같은 순서**의 theme 값이다.
 *
 * 그래서 CSS 변수를 이름 규칙으로 만들어 내지 않는다 — catalog 가 적어 둔 정확한 변수를 읽는다.
 * (손으로 유도하면 틀린다: `spacing.md` 의 변수는 `--ds-md` 가 아니라 `--ds-spacing-md` 다.)
 *
 * lineage 는 없다. 생성기(`genCatalog.ts`)가 `getTokenValue(t)` 로 **해석된 값**만 쓰고
 * `original.value` 의 alias 참조를 내보내지 않기 때문이다. 그래서 semantic → primitive 계보는
 * 이 artifact 로 복원할 수 없고, UI 는 그것을 추측하지 않고 사실대로 밝힌다.
 *
 * 외부 입력이므로 `unknown` 에서 시작해 필요한 최소 field 만 좁힌다.
 */

export type ResolvedToken = {
  id: string;
  cssVar: string;
  /** UI 에 안전하게 그릴 수 있는 문자열. catalog 값은 unknown 이라 여기서 변환한다. */
  value: string;
};

/** 실패를 값으로 돌려준다 — light 로 조용히 떨어지지 않는다. */
export type TokenResolution =
  | { ok: true; token: ResolvedToken }
  | { ok: false; reason: 'unknown-token' | 'unknown-theme' | 'missing-value' };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const root = (): Record<string, unknown> => {
  if (!isRecord(rawTokens)) throw new Error('token catalog: 객체가 아니다');
  return rawTokens;
};

const themeList = (): readonly string[] => {
  const { themes } = root();
  if (!Array.isArray(themes)) throw new Error('token catalog: themes 배열이 없다');
  return themes.filter((t): t is string => typeof t === 'string');
};

const tokenTable = (): Record<string, unknown> => {
  const { tokens } = root();
  if (!isRecord(tokens)) throw new Error('token catalog: tokens 가 없다');
  return tokens;
};

/** row 는 `[cssVar, ...values]` 이므로 theme 수 + 1 칸이어야 한다. */
const rowOf = (id: string): readonly unknown[] | undefined => {
  const row = tokenTable()[id];
  if (!Array.isArray(row) || typeof row[0] !== 'string') return undefined;
  return row.length === themeList().length + 1 ? row : undefined;
};

/** unknown 값을 그릴 수 있는 문자열로. 객체·배열은 그리지 않는다. */
const toDisplayValue = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return undefined;
};

export const catalogSchema = (): string => {
  const { schema } = root();
  return typeof schema === 'string' ? schema : '';
};

export const tokenThemes = (): readonly string[] => themeList();

export const hasToken = (id: string): boolean => rowOf(id) !== undefined;

/** 한 카테고리의 token id. artifact 가 id 순으로 정렬해 두므로 그 순서를 그대로 쓴다. */
export const tokenIdsInCategory = (category: string): readonly string[] =>
  Object.keys(tokenTable()).filter((id) => id.startsWith(`${category}.`));

export const tokenCount = (): number => Object.keys(tokenTable()).length;

/** catalog 가 적어 둔 정확한 CSS 변수. 유도하지 않는다. */
export const cssVarOf = (id: string): string | undefined => {
  const row = rowOf(id);
  return row === undefined ? undefined : (row[0] as string);
};

/**
 * active theme 기준 해석. theme index 를 `themes` 배열에서 찾고 그 칸만 읽는다.
 * 범위를 벗어나거나 값이 비어 있으면 실패를 돌려준다.
 */
export const resolveToken = (id: string, theme: string): TokenResolution => {
  const row = rowOf(id);
  if (row === undefined) return { ok: false, reason: 'unknown-token' };

  const index = themeList().indexOf(theme);
  if (index < 0) return { ok: false, reason: 'unknown-theme' };

  const value = toDisplayValue(row[index + 1]);
  if (value === undefined) return { ok: false, reason: 'missing-value' };

  return { ok: true, token: { id, cssVar: row[0] as string, value } };
};
