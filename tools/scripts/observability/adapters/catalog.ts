import type { CatalogSummary } from '@berrypjh/observability-contracts';

import { type Catalog, catalogSchema } from '../../generate-consumer-catalog/schema';

/**
 * 생성된 consumer catalog (`dist/llm-catalog.json`) reader. 기존 catalog schema 로 검증하고
 * deprecated·propsUnion·typeOmitted·valueCount 표시를 그대로 옮긴다.
 */

type Summary = Omit<CatalogSummary, 'regenerated' | 'regeneratedReason'>;

const EMPTY = {
  schemaVersion: null,
  platform: null,
  symbolCount: null,
  deprecated: [],
  propsUnion: [],
  typeOmittedSymbols: [],
  typeOmittedProps: [],
  valueCounts: [],
};

export const parseCatalogSummary = (
  text: string | null,
  path: string,
): { summary: Summary; catalog: Catalog | null } => {
  if (text === null) {
    return {
      catalog: null,
      summary: { path, status: 'missing', reason: `${path} 이 없다`, ...EMPTY },
    };
  }
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return {
      catalog: null,
      summary: { path, status: 'invalid', reason: `${path} is not valid JSON`, ...EMPTY },
    };
  }
  const parsed = catalogSchema.safeParse(value);
  if (!parsed.success) {
    const reason = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('; ')
      .slice(0, 500);
    return { catalog: null, summary: { path, status: 'invalid', reason, ...EMPTY } };
  }

  const catalog = parsed.data;
  const symbols = Object.entries(catalog.symbols);
  const props = symbols.flatMap(([symbol, entry]) =>
    Object.entries(entry.props ?? {}).map(([prop, spec]) => ({ symbol, prop, spec })),
  );
  return {
    catalog,
    summary: {
      path,
      status: 'valid',
      reason: null,
      schemaVersion: catalog.schemaVersion,
      platform: catalog.platform,
      symbolCount: symbols.length,
      deprecated: symbols.filter(([, entry]) => entry.deprecated).map(([name]) => name),
      propsUnion: symbols.filter(([, entry]) => entry.propsUnion).map(([name]) => name),
      typeOmittedSymbols: symbols.filter(([, entry]) => entry.typeOmitted).map(([name]) => name),
      typeOmittedProps: props
        .filter(({ spec }) => spec.typeOmitted)
        .map(({ symbol, prop }) => `${symbol}.${prop}`),
      valueCounts: props.flatMap(({ symbol, prop, spec }) =>
        spec.valueCount ? [{ symbol, prop, count: spec.valueCount }] : [],
      ),
    },
  };
};

/**
 * catalog 는 라이브러리가 스스로 선언한 prop 만 싣는다 (`extract.ts` 의 ownDeclaration 필터).
 * 그래서 `not-listed` 는 "잘못된 prop" 이 아니다 — DOM·RN 에서 상속한 prop 일 수 있다.
 */
export const propListing = (
  catalog: Catalog,
  symbol: string,
  prop: string,
): 'listed' | 'not-listed' | 'symbol-missing' => {
  const entry = catalog.symbols[symbol];
  if (!entry) return 'symbol-missing';
  return entry.props && prop in entry.props ? 'listed' : 'not-listed';
};
