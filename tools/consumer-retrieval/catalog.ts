import type {
  Catalog,
  CatalogSymbol,
  SymbolKind,
} from '../scripts/generate-consumer-catalog/schema';

/**
 * 생성 카탈로그를 읽는 순수 TypeScript resolver.
 * vector search도 BM25도 쓰지 않는다 — 결정적 문자열 매칭 4단계뿐이다.
 * 모르는 심볼은 `not-found`를 반환하고 후보를 지어내지 않는다.
 *
 * 이 모듈은 파일 시스템을 모른다. 저장소에서 읽는 것은 `repo-source.ts`,
 * 설치된 패키지에서 읽는 것은 `package-cli.ts`가 맡는다.
 */

export type CatalogSet = Record<string, Catalog>;

export const DEFAULT_DISCOVER_LIMIT = 10;

export const MATCH_TIERS = ['exact', 'case-insensitive', 'normalized', 'lexical'] as const;
export type MatchTier = (typeof MATCH_TIERS)[number];

export type DiscoverHit = {
  package: string;
  symbol: string;
  kind: SymbolKind;
  importFrom: string;
  matchedBy: MatchTier;
  /** 선언에 `@deprecated`가 붙은 심볼 — 뒤로 밀고 표시한다. */
  deprecated?: true;
};

export type DiscoverResult = {
  query: string;
  hits: DiscoverHit[];
  matchCount: number;
  returned: number;
  truncated: boolean;
  limit: number;
};

/** kebab/snake/space/Pascal 차이를 지운다. */
const normalize = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const tierOf = (query: string, symbol: string): MatchTier | null => {
  if (symbol === query) return 'exact';
  if (symbol.toLowerCase() === query.toLowerCase()) return 'case-insensitive';
  const [q, s] = [normalize(query), normalize(symbol)];
  if (!q) return null;
  if (q === s) return 'normalized';
  return s.includes(q) ? 'lexical' : null;
};

export type DiscoverOptions = {
  packages?: string[];
  kinds?: SymbolKind[];
  limit?: number;
};

export const discover = (
  catalogs: CatalogSet,
  query: string,
  { packages, kinds, limit = DEFAULT_DISCOVER_LIMIT }: DiscoverOptions = {},
): DiscoverResult => {
  const scoped = Object.values(catalogs).filter(
    (c) => !packages || packages.length === 0 || packages.includes(c.package),
  );

  const hits: DiscoverHit[] = [];
  for (const catalog of scoped) {
    for (const [symbol, entry] of Object.entries(catalog.symbols)) {
      if (kinds && kinds.length > 0 && !kinds.includes(entry.kind)) continue;
      const matchedBy = tierOf(query, symbol);
      if (!matchedBy) continue;
      hits.push({
        package: catalog.package,
        symbol,
        kind: entry.kind,
        importFrom: entry.importFrom,
        matchedBy,
        ...(entry.deprecated ? { deprecated: true as const } : {}),
      });
    }
  }

  // deprecated는 같은 tier 안에서 뒤로 민다 — 플랫폼이 안 맞는 잔재가 먼저 보이면 안 된다.
  hits.sort(
    (a, b) =>
      MATCH_TIERS.indexOf(a.matchedBy) - MATCH_TIERS.indexOf(b.matchedBy) ||
      Number(a.deprecated ?? false) - Number(b.deprecated ?? false) ||
      a.package.localeCompare(b.package) ||
      a.symbol.localeCompare(b.symbol),
  );

  return {
    query,
    hits: hits.slice(0, limit),
    matchCount: hits.length,
    returned: Math.min(hits.length, limit),
    truncated: hits.length > limit,
    limit,
  };
};

export type ApiDetail = 'signature' | 'full';

export type ApiResult =
  | ({
      status: 'ok';
      package: string;
      symbol: string;
      detail: ApiDetail;
      /** `detail: 'signature'`면 prop 이름만, `'full'`이면 prop 계약 전체. */
      propNames?: string[];
    } & CatalogSymbol)
  | {
      status: 'not-found';
      package: string | null;
      symbol: string;
      /** 실제 카탈로그 심볼에서만 뽑은 후보. 없으면 빈 배열. */
      suggestions: DiscoverHit[];
    };

export const getApi = (
  catalogs: CatalogSet,
  packageName: string,
  symbol: string,
  detail: ApiDetail = 'full',
): ApiResult => {
  const catalog = catalogs[packageName];
  if (!catalog) {
    return { status: 'not-found', package: null, symbol, suggestions: [] };
  }
  const entry = catalog.symbols[symbol];
  if (!entry) {
    return {
      status: 'not-found',
      package: packageName,
      symbol,
      suggestions: discover(catalogs, symbol, { packages: [packageName], limit: 5 }).hits,
    };
  }
  if (detail === 'signature') {
    const { props: _props, ...head } = entry;
    return {
      status: 'ok',
      package: packageName,
      symbol,
      detail,
      ...head,
      ...(entry.props ? { propNames: Object.keys(entry.props) } : {}),
    };
  }
  return { status: 'ok', package: packageName, symbol, detail, ...entry };
};

export type PackageSummary = {
  package: string;
  platform: string;
  exports: Record<string, string>;
  tokenCatalog: string | null;
  symbolCount: number;
  countsByKind: Record<string, number>;
  components: string[];
};

/** L0 — full declaration을 읽지 않고 패키지 지형을 잡는 최소 요약. */
export const packageSummary = (catalog: Catalog): PackageSummary => {
  const countsByKind: Record<string, number> = {};
  const components: string[] = [];
  for (const [name, entry] of Object.entries(catalog.symbols)) {
    countsByKind[entry.kind] = (countsByKind[entry.kind] ?? 0) + 1;
    if (entry.kind === 'component') components.push(name);
  }
  return {
    package: catalog.package,
    platform: catalog.platform,
    exports: catalog.exports,
    tokenCatalog: catalog.tokenCatalog,
    symbolCount: Object.keys(catalog.symbols).length,
    countsByKind,
    components: components.sort(),
  };
};
