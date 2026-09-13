import { describe, expect, it } from 'vitest';

import { type Catalog, serializeCatalog } from '../../generate-consumer-catalog/schema';

import { parseCatalogSummary, propListing } from './catalog';

const CATALOG: Catalog = {
  schemaVersion: 1,
  package: '@fixture/ui',
  platform: 'web',
  tokenCatalog: 'tokens.json',
  exports: { '.': '@fixture/ui' },
  symbols: {
    Box: {
      kind: 'component',
      importFrom: '@fixture/ui',
      propsType: 'BoxProps',
      props: {
        bg: { type: 'ColorToken', required: false, valueCount: 129 },
        p: { type: 'SpacingValue', required: false },
      },
    },
    Button: {
      kind: 'component',
      importFrom: '@fixture/ui',
      propsType: null,
      propsUnion: true,
      props: {
        options: { type: null, required: false, typeOmitted: true },
        variant: { type: "'contained' | 'text'", required: false, values: ['contained', 'text'] },
      },
    },
    createTheme: {
      kind: 'function',
      importFrom: '@fixture/ui',
      type: null,
      typeOmitted: true,
      deprecated: true,
    },
  },
};

const PATH = 'libs/ui/dist/llm-catalog.json';

describe('parseCatalogSummary — 기존 catalog schema 로 읽고 표시를 보존한다', () => {
  it('deprecated·propsUnion·typeOmitted·valueCount 를 그대로 옮긴다', () => {
    const { summary } = parseCatalogSummary(serializeCatalog(CATALOG), PATH);
    expect(summary).toEqual({
      path: PATH,
      status: 'valid',
      reason: null,
      schemaVersion: 1,
      platform: 'web',
      symbolCount: 3,
      deprecated: ['createTheme'],
      propsUnion: ['Button'],
      typeOmittedSymbols: ['createTheme'],
      typeOmittedProps: ['Button.options'],
      valueCounts: [{ symbol: 'Box', prop: 'bg', count: 129 }],
    });
  });

  it('schema 가 다르면 invalid 와 이유, 파일이 없으면 missing 이다', () => {
    const invalid = parseCatalogSummary(JSON.stringify({ ...CATALOG, schemaVersion: 2 }), PATH);
    expect(invalid.summary).toMatchObject({ status: 'invalid', symbolCount: null, deprecated: [] });
    expect(invalid.summary.reason).toContain('schemaVersion');
    expect(invalid.catalog).toBeNull();
    expect(parseCatalogSummary(null, PATH).summary).toMatchObject({
      status: 'missing',
      reason: `${PATH} 이 없다`,
    });
  });
});

describe('propListing — catalog 에 없다고 잘못된 prop 은 아니다', () => {
  it('자기 선언 prop 만 listed 이고, 상속 prop 은 not-listed 로만 말한다', () => {
    expect(propListing(CATALOG, 'Button', 'variant')).toBe('listed');
    expect(propListing(CATALOG, 'Button', 'onClick')).toBe('not-listed');
    expect(propListing(CATALOG, 'Missing', 'variant')).toBe('symbol-missing');
  });
});
