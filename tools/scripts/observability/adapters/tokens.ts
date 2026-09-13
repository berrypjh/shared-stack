import { z } from 'zod';

import { ArtifactError } from '../safe-fs';

/**
 * design-tokens 의 source·생성 산출물 reader. 어느 파일도 실행하지 않는다 —
 * 등록부·카테고리·생성 트리를 텍스트로 읽고, 형태가 다르면 추측하지 않고 실패하거나 null 이다.
 */

/** `genCatalog.ts` 가 tokens.json 에 쓰는 schema 문구. */
export const TOKEN_CATALOG_SCHEMA_TEXT = 'tokens[path] = [cssVar, ...valuesInThemesOrder]';

/** web rem 변환 기준. `sd.test.ts` 의 `spacing.md` = `0.75rem` / RN `12` 가 근거다. */
const REM_BASE_PX = 16;

const lineOf = (source: string, index: number) => source.slice(0, index).split('\n').length;
const quoted = (text: string) => [...text.matchAll(/'([^']+)'/g)].map((match) => match[1]);

export type ThemeEntry = { name: string; selector: string; sourceDirs: string[]; line: number };

/** `themes.ts` 의 `export const themes = [...] as const` 항목을 순서대로 읽는다. */
export const parseThemeRegistry = (source: string): ThemeEntry[] => {
  const block = /export const themes = \[([\s\S]*?)\]\s*as const/.exec(source);
  if (!block) throw new ArtifactError('invalid-schema', 'themes array not found');
  const offset = block.index + block[0].indexOf('[') + 1;
  const entries = [
    ...block[1].matchAll(
      /name:\s*'([^']+)',\s*selector:\s*'([^']*)',\s*sourceDirs:\s*\[([^\]]*)\]/g,
    ),
  ].map((match) => ({
    name: match[1],
    selector: match[2],
    sourceDirs: quoted(match[3]),
    line: lineOf(source, offset + match.index),
  }));
  if (entries.length === 0)
    throw new ArtifactError('invalid-schema', 'themes array has no entries');
  return entries;
};

export const parseTokenCategories = (source: string): { names: string[]; line: number } => {
  const match = /export const TOKEN_CATEGORIES = \[([\s\S]*?)\]\s*as const/.exec(source);
  if (!match) throw new ArtifactError('invalid-schema', 'TOKEN_CATEGORIES not found');
  return { names: quoted(match[1]), line: lineOf(source, match.index) };
};

export type CatalogRow = (string | number | null)[];
type Issue = { code: string; message: string };

export type CatalogValidation = {
  status: 'valid' | 'invalid' | 'missing';
  themes: string[] | null;
  categories: string[] | null;
  rowCount: number | null;
  issues: Issue[];
  /** 형태를 읽을 수 있을 때의 row. valid 가 아니면 값으로 쓰지 않는다. */
  rows: Record<string, CatalogRow> | null;
};

const MAX_ISSUES = 20;

const catalogShape = z.object({
  schema: z.string(),
  themes: z.array(z.string()),
  categories: z.array(z.string()),
  tokens: z.record(z.string(), z.array(z.union([z.string(), z.number(), z.null()]))),
});

const rowIssues = (id: string, row: CatalogRow, themeCount: number): Issue[] => {
  const issues: Issue[] = [];
  if (row.length !== themeCount + 1) {
    issues.push({
      code: 'row-length',
      message: `${id} has ${row.length - 1} values for ${themeCount} themes`,
    });
  }
  if (typeof row[0] !== 'string' || !/^--ds-[a-z0-9-]+$/.test(row[0])) {
    issues.push({
      code: 'css-var',
      message: `${id} cssVar ${JSON.stringify(row[0])} is not a --ds- variable`,
    });
  }
  return issues;
};

/**
 * tokens.json 의 positional row `[cssVar, ...themeValues]` 를 등록부와 대조한다.
 * 이것은 resolved **Web** catalog 다 — RN 값은 여기서 읽지 않는다.
 */
export const validateTokenCatalog = (
  text: string | null,
  registryThemes: string[],
  categories: string[],
): CatalogValidation => {
  const empty = { themes: null, categories: null, rowCount: null, rows: null };
  if (text === null) return { status: 'missing', issues: [], ...empty };
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return {
      status: 'invalid',
      issues: [{ code: 'json', message: 'tokens.json is not valid JSON' }],
      ...empty,
    };
  }
  const shape = catalogShape.safeParse(value);
  if (!shape.success) {
    const message = shape.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return {
      status: 'invalid',
      issues: [{ code: 'row-shape', message: message.slice(0, 500) }],
      ...empty,
    };
  }

  const catalog = shape.data;
  const issues: Issue[] = [];
  if (catalog.schema !== TOKEN_CATALOG_SCHEMA_TEXT) {
    issues.push({ code: 'schema-text', message: `schema is ${JSON.stringify(catalog.schema)}` });
  }
  if (JSON.stringify(catalog.themes) !== JSON.stringify(registryThemes)) {
    issues.push({
      code: 'theme-order',
      message: `themes ${JSON.stringify(catalog.themes)} differ from registry ${JSON.stringify(registryThemes)}`,
    });
  }
  if (JSON.stringify(catalog.categories) !== JSON.stringify([...categories].sort())) {
    issues.push({
      code: 'categories',
      message: `categories ${JSON.stringify(catalog.categories)} differ from TOKEN_CATEGORIES`,
    });
  }
  const ids = Object.keys(catalog.tokens);
  for (const id of ids) issues.push(...rowIssues(id, catalog.tokens[id], catalog.themes.length));
  if (JSON.stringify(ids) !== JSON.stringify([...ids].sort())) {
    issues.push({ code: 'row-order', message: 'rows are not sorted by path' });
  }

  return {
    status: issues.length === 0 ? 'valid' : 'invalid',
    themes: catalog.themes,
    categories: catalog.categories,
    rowCount: ids.length,
    issues: issues.slice(0, MAX_ISSUES),
    rows: catalog.tokens,
  };
};

export type TokenTree = { [key: string]: unknown };

/** 생성된 `tokens.ts` 의 `export const tokens = {...} as const;` 객체. 형태가 다르면 null. */
export const parseGeneratedTokens = (source: string): TokenTree | null => {
  const match = /export const tokens = (\{[\s\S]*?\n\}) as const;/.exec(source);
  if (!match) return null;
  try {
    const tree: unknown = JSON.parse(match[1]);
    return tree !== null && typeof tree === 'object' ? (tree as TokenTree) : null;
  } catch {
    return null;
  }
};

/** leaf 값만. 중간 노드나 없는 경로는 null. */
export const leafAt = (tree: TokenTree | null, tokenPath: string): string | number | null => {
  let node: unknown = tree;
  for (const key of tokenPath.split('.')) {
    if (node === null || typeof node !== 'object') return null;
    node = (node as TokenTree)[key];
  }
  return typeof node === 'string' || typeof node === 'number' ? node : null;
};

export const leafPaths = (tree: TokenTree, prefix = ''): string[] =>
  Object.entries(tree).flatMap(([key, value]) => {
    const here = prefix ? `${prefix}.${key}` : key;
    return value !== null && typeof value === 'object'
      ? leafPaths(value as TokenTree, here)
      : [here];
  });

export const parseNamespaces = (source: string): string[] =>
  [...source.matchAll(/export \* as (\w+) from/g)].map((match) => match[1]);

/** RN `ThemeProvider.tsx` 의 기본 테마 map 과 `satisfies Record<ThemeName, RNTokens>` 계약. */
export const parseRnProvider = (
  source: string,
): { modes: string[]; satisfiesThemeName: boolean; line: number } | null => {
  const match =
    /const DEFAULT_TOKENS_BY_MODE = \{([\s\S]*?)\}(\s*satisfies\s+Record<ThemeName,\s*RNTokens>)?\s*;/.exec(
      source,
    );
  if (!match) return null;
  return {
    modes: [...match[1].matchAll(/^\s*(\w+):/gm)].map((mode) => mode[1]),
    satisfiesThemeName: Boolean(match[2]),
    line: lineOf(source, match.index),
  };
};

export type PlatformComparison = 'identical' | 'unit-conversion' | 'divergent' | 'unavailable';

const UNIT_PART = /^(-?\d*\.?\d+)(rem|ms)$/;

/**
 * Web·RN 값 비교. Web `rem`·`ms` 와 RN 숫자는 의도된 플랫폼 변환이라 divergence 가 아니다.
 */
export const comparePlatformValues = (
  web: string | number | null,
  rn: string | number | null,
): PlatformComparison => {
  if (web === null || rn === null) return 'unavailable';
  if (String(web) === String(rn)) return 'identical';
  const webParts = String(web).trim().split(/\s+/);
  const rnParts = String(rn).trim().split(/\s+/);
  if (webParts.length !== rnParts.length) return 'divergent';
  const converted = webParts.every((part, index) => {
    const match = UNIT_PART.exec(part);
    if (!match) return false;
    const expected = match[2] === 'rem' ? Number(match[1]) * REM_BASE_PX : Number(match[1]);
    return Math.abs(expected - Number(rnParts[index])) < 1e-9;
  });
  return converted ? 'unit-conversion' : 'divergent';
};

export type AuthoredToken = { line: number; rawValue: string; type: string; references: string[] };

/** authoring JSON 에서 token 의 원래 `$value`·`$type`·`{alias}` 참조와 key 위치를 읽는다. */
export const findAuthoredToken = (source: string, tokenPath: string): AuthoredToken | null => {
  let node: unknown;
  try {
    node = JSON.parse(source);
  } catch {
    return null;
  }
  const keys = tokenPath.split('.');
  for (const key of keys) {
    if (node === null || typeof node !== 'object') return null;
    node = (node as TokenTree)[key];
  }
  if (node === null || typeof node !== 'object' || !('$value' in node)) return null;
  const token = node as { $value: unknown; $type?: unknown };

  // 부모 key 줄 다음부터 자식 key 를 찾는다.
  const lines = source.split('\n');
  let line = 0;
  for (const key of keys) {
    const offset = lines.slice(line).findIndex((text) => text.includes(`"${key}"`));
    if (offset === -1) return null;
    line += offset + 1;
  }
  const rawValue = String(token.$value);
  return {
    line,
    rawValue,
    type: typeof token.$type === 'string' ? token.$type : 'unknown',
    references: [...rawValue.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]),
  };
};
