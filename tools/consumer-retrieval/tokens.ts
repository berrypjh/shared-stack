/**
 * `dist/tokens.json`(슬림 평탄 카탈로그)에 대한 표적 조회.
 * 형식은 그대로 두고 읽기만 한다 — `genCatalog.ts`는 건드리지 않는다.
 * 전체 파일을 컨텍스트에 넣는 대신 exact / prefix / category로 좁힌다.
 *
 * 이 모듈도 파일 시스템을 모른다 — 읽기는 호출부가 맡는다.
 */

export const DEFAULT_TOKEN_LIMIT = 25;

export type TokenSource = {
  schema: string;
  themes: string[];
  categories: string[];
  tokens: Record<string, (string | number | null)[]>;
};

export type TokenMatch = {
  path: string;
  cssVar: string;
  /** theme 이름 → 값. tokens.json의 theme 순서를 그대로 따른다. */
  values: Record<string, string | number | null>;
};

export type TokenLookupMode = 'exact' | 'prefix' | 'category' | 'none';

export type TokenLookupResult = {
  query: string;
  mode: TokenLookupMode;
  themes: string[];
  matches: TokenMatch[];
  matchCount: number;
  returned: number;
  truncated: boolean;
  limit: number;
  /** truncated일 때 어떻게 좁힐지. 아니면 null. */
  refine: string | null;
};

const toMatch = (source: TokenSource, tokenPath: string): TokenMatch => {
  const [cssVar, ...values] = source.tokens[tokenPath];
  return {
    path: tokenPath,
    cssVar: String(cssVar),
    values: Object.fromEntries(source.themes.map((theme, i) => [theme, values[i] ?? null])),
  };
};

/** query 다음 세그먼트를 붙여 좁히라고 알려준다 — 임의 문구가 아니라 실제 후보에서 뽑는다. */
const refineHint = (query: string, paths: string[]): string => {
  const depth = query ? query.split('.').length : 0;
  const next = [
    ...new Set(
      paths.map((p) =>
        p
          .split('.')
          .slice(0, depth + 1)
          .join('.'),
      ),
    ),
  ]
    .sort()
    .slice(0, 8);
  return `${paths.length} matches. narrow with a longer prefix, e.g. ${next.join(', ')}`;
};

export const lookupTokens = (
  source: TokenSource,
  query: string,
  { limit = DEFAULT_TOKEN_LIMIT }: { limit?: number } = {},
): TokenLookupResult => {
  const base = {
    query,
    themes: source.themes,
    limit,
  };

  if (query in source.tokens) {
    return {
      ...base,
      mode: 'exact',
      matches: [toMatch(source, query)],
      matchCount: 1,
      returned: 1,
      truncated: false,
      refine: null,
    };
  }

  const isCategory = source.categories.includes(query);
  const prefix = `${query}.`;
  const paths = Object.keys(source.tokens)
    .filter((p) => p.startsWith(prefix))
    .sort();

  if (paths.length === 0) {
    return {
      ...base,
      mode: 'none',
      matches: [],
      matchCount: 0,
      returned: 0,
      truncated: false,
      refine: null,
    };
  }

  const truncated = paths.length > limit;
  return {
    ...base,
    mode: isCategory ? 'category' : 'prefix',
    matches: paths.slice(0, limit).map((p) => toMatch(source, p)),
    matchCount: paths.length,
    returned: Math.min(paths.length, limit),
    truncated,
    refine: truncated ? refineHint(query, paths) : null,
  };
};
