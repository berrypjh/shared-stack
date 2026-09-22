import { normalize, tokensOf } from './text';

/** 검색 항목 하나. `kind` 의 순서(같은 등급 안의 순서)는 색인을 만들 때 앱이 준다. */
export type SearchEntry = {
  key: string;
  kind: string;
  label: string;
  detail: string;
  href: string;
  /** 정확히 · 앞부분으로 맞춘다: ID · 이름 · 경로. */
  names: string[];
  /** 단어 · 부분 글자로 맞춘다: 설명 · 동작. */
  text: string[];
  /** 마지막으로만 맞춘다: 이 항목을 품거나 인용하는 것의 이름. */
  related: string[];
};

/**
 * 등급. 작을수록 앞선다. 퍼지 매칭 없이 결정적이다.
 * 0 이름과 정확히 같다 · 1 이름이나 그 조각이 질의로 시작한다 · 2 질의의 모든 단어가 이름의 단어로 시작한다 ·
 * 3 설명까지 합쳐 모든 단어가 맞는다 · 4 이름 · 설명에 질의가 들어 있다 · 5 이 항목을 품거나 인용하는 것에서만 맞는다.
 */
export const TIERS = [
  'exact',
  'prefix',
  'name-token',
  'text-token',
  'substring',
  'related',
] as const;

export type SearchResult<E extends SearchEntry = SearchEntry> = E & { tier: number };

type Prepared<E extends SearchEntry> = {
  entry: E;
  names: string[];
  segments: string[];
  nameTokens: string[];
  tokens: string[];
  text: string[];
  related: string[];
  relatedTokens: string[];
};

const unique = (values: string[]) => [...new Set(values)].filter(Boolean);

/** 이름 조각: 경로 조각(`styles.css`)과 그보다 잘게 끊은 조각(`styles` · `css`)을 모두. */
const segmentsOf = (name: string) => [...name.split(/[/\s]+/), ...name.split(/[/.:@\s-]+/)];

const prepare = <E extends SearchEntry>(entry: E): Prepared<E> => {
  const names = entry.names.map(normalize);
  const nameTokens = unique(entry.names.flatMap(tokensOf));
  return {
    entry,
    names,
    segments: unique(names.flatMap(segmentsOf)),
    nameTokens,
    tokens: unique([...nameTokens, ...entry.text.flatMap(tokensOf)]),
    text: entry.text.map(normalize),
    related: entry.related.map(normalize),
    relatedTokens: unique(entry.related.flatMap(tokensOf)),
  };
};

export type SearchIndex<E extends SearchEntry = SearchEntry> = {
  items: Prepared<E>[];
  kinds: readonly string[];
};

/** `kinds` 는 같은 등급 안의 종류 순서다. 목록에 없는 종류는 맨 뒤다. */
export const buildIndex = <E extends SearchEntry>(
  entries: E[],
  kinds: readonly string[],
): SearchIndex<E> => ({
  items: entries.map(prepare),
  kinds,
});

const everyWord = (words: string[], tokens: string[]) =>
  words.length > 0 && words.every((word) => tokens.some((token) => token.startsWith(word)));

export const tierOf = <E extends SearchEntry>(
  item: Prepared<E>,
  query: string,
  words: string[],
): number | null => {
  if (item.names.includes(query)) return 0;
  if ([...item.names, ...item.segments].some((name) => name.startsWith(query))) return 1;
  if (everyWord(words, item.nameTokens)) return 2;
  if (everyWord(words, item.tokens)) return 3;
  if ([...item.names, ...item.text].some((value) => value.includes(query))) return 4;
  if (item.related.some((value) => value.includes(query)) || everyWord(words, item.relatedTokens)) {
    return 5;
  }
  return null;
};

/** 로캘에 기대지 않는 비교 — 환경이 달라도 같은 순서다. */
const compareText = (left: string, right: string) => {
  if (left === right) return 0;
  return left < right ? -1 : 1;
};

/** 순위: 등급 → 종류 순서 → 짧은 이름 → 이름 → key. 같은 입력이면 늘 같은 순서다. */
export const search = <E extends SearchEntry>(
  index: SearchIndex<E>,
  raw: string,
): SearchResult<E>[] => {
  const query = normalize(raw);
  if (!query) return [];
  const words = tokensOf(raw);
  const kindOrder = (kind: string) => {
    const at = index.kinds.indexOf(kind);
    return at === -1 ? index.kinds.length : at;
  };
  return index.items
    .flatMap((item) => {
      const tier = tierOf(item, query, words);
      return tier === null ? [] : [{ ...item.entry, tier }];
    })
    .sort(
      (first, second) =>
        first.tier - second.tier ||
        kindOrder(first.kind) - kindOrder(second.kind) ||
        first.label.length - second.label.length ||
        compareText(first.label, second.label) ||
        compareText(first.key, second.key),
    );
};

/** 보이는 결과: 순위를 지키며 종류마다 `perKind` 개까지 — 한 질의가 여러 종류에 닿게. */
export const topResults = <E extends SearchEntry>(
  results: SearchResult<E>[],
  perKind = 5,
  limit = 30,
) => {
  const seen = new Map<string, number>();
  return results
    .filter((result) => {
      const count = seen.get(result.kind) ?? 0;
      seen.set(result.kind, count + 1);
      return count < perKind;
    })
    .slice(0, limit);
};
