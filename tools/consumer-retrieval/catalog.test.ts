import { describe, expect, it } from 'vitest';

import { discover, getApi, packageSummary } from './catalog';
import { NATIVE_PACKAGE, WEB_PACKAGE } from './platform';
import { loadCatalogs } from './repo-source';

const catalogs = await loadCatalogs();

describe('catalog discovery', () => {
  it('finds an exact component and reports the match tier', () => {
    // 실제 흐름은 `resolvePlatform`이 package를 정하고 discover가 그 안에서 찾는 것입니다.
    // 좁히지 않은 `Button`은 이제 양 플랫폼에 다 있습니다.
    const r = discover(catalogs, 'Button', { kinds: ['component'], packages: [WEB_PACKAGE] });
    expect(r.hits[0]).toMatchObject({
      package: WEB_PACKAGE,
      symbol: 'Button',
      kind: 'component',
      importFrom: WEB_PACKAGE,
      matchedBy: 'exact',
    });
  });

  it('같은 이름이 양 플랫폼에 있으면 좁히기 전에는 둘 다 돌려준다', () => {
    // 플랫폼 근거가 없는 질의에서 한쪽을 임의로 고르면 RN 소비자에게 web 컴포넌트를 주게 됩니다.
    const unscoped = discover(catalogs, 'Button', { kinds: ['component'] });
    const exact = unscoped.hits.filter((h) => h.matchedBy === 'exact' && h.symbol === 'Button');

    expect(exact.map((h) => h.package).sort()).toEqual([NATIVE_PACKAGE, WEB_PACKAGE]);
  });

  it.each(['Button', 'Fab', 'IconButton'])(
    'RN 으로 좁히면 %s 는 react-native-ui 만 나온다',
    (symbol) => {
      const r = discover(catalogs, symbol, {
        kinds: ['component'],
        packages: [NATIVE_PACKAGE],
      });

      expect(r.hits[0]).toMatchObject({
        package: NATIVE_PACKAGE,
        symbol,
        importFrom: NATIVE_PACKAGE,
        matchedBy: 'exact',
      });
      expect(r.hits.every((h) => h.package === NATIVE_PACKAGE)).toBe(true);
    },
  );

  it('matches case and kebab/Pascal variants deterministically', () => {
    for (const query of ['searchfield', 'search-field', 'search_field', 'Search Field']) {
      const hit = discover(catalogs, query, { kinds: ['component'] }).hits[0];
      expect(hit.symbol).toBe('SearchField');
      expect(['case-insensitive', 'normalized']).toContain(hit.matchedBy);
    }
    expect(discover(catalogs, 'SearchField').hits[0].matchedBy).toBe('exact');
  });

  it('ranks exact above lexical and is stable across calls', () => {
    const first = discover(catalogs, 'Box', { kinds: ['component'] });
    expect(first.hits[0].matchedBy).toBe('exact');
    expect(first.hits.some((h) => h.symbol === 'BoxedInput')).toBe(true);
    expect(discover(catalogs, 'Box', { kinds: ['component'] })).toEqual(first);
  });

  it('scopes results to the routed package', () => {
    const web = discover(catalogs, 'ThemeProvider', { packages: [WEB_PACKAGE] });
    expect([...new Set(web.hits.map((h) => h.package))]).toEqual([WEB_PACKAGE]);
    const native = discover(catalogs, 'ThemeProvider', { packages: [NATIVE_PACKAGE] });
    expect([...new Set(native.hits.map((h) => h.package))]).toEqual([NATIVE_PACKAGE]);

    // 라우팅 없이 찾으면 양쪽 패키지가 다 나온다 — 이게 D2가 줄이는 혼동이다.
    const unrouted = discover(catalogs, 'ThemeProvider');
    expect([...new Set(unrouted.hits.map((h) => h.package))].sort()).toEqual(
      [NATIVE_PACKAGE, WEB_PACKAGE].sort(),
    );
  });

  it('caps results and reports truncation instead of dumping everything', () => {
    const r = discover(catalogs, 'Tokens', { limit: 3 });
    expect(r.returned).toBe(3);
    expect(r.truncated).toBe(true);
    expect(r.matchCount).toBeGreaterThan(3);
  });

  it('returns an empty result for an unknown component rather than inventing one', () => {
    const r = discover(catalogs, 'DataGrid');
    expect(r.hits).toEqual([]);
    expect(r.matchCount).toBe(0);
  });
});

describe('exact api lookup', () => {
  it('returns the library prop contract for a component', () => {
    const api = getApi(catalogs, WEB_PACKAGE, 'Button');
    expect(api.status).toBe('ok');
    if (api.status !== 'ok') return;
    expect(api.kind).toBe('component');
    expect(api.props?.loadingPosition?.values).toEqual(['center', 'end', 'start']);
    expect(Object.keys(api.props ?? {})).not.toContain('onClick');
  });

  it('returns only prop names at signature detail', () => {
    const api = getApi(catalogs, WEB_PACKAGE, 'Button', 'signature');
    expect(api.status).toBe('ok');
    if (api.status !== 'ok') return;
    expect(api.props).toBeUndefined();
    expect(api.propNames).toContain('loading');
    expect(JSON.stringify(api).length).toBeLessThan(
      JSON.stringify(getApi(catalogs, WEB_PACKAGE, 'Button', 'full')).length,
    );
  });

  it('reports not-found for a symbol that does not exist', () => {
    const api = getApi(catalogs, WEB_PACKAGE, 'DataGrid');
    expect(api).toMatchObject({ status: 'not-found', package: WEB_PACKAGE, symbol: 'DataGrid' });
    if (api.status !== 'not-found') return;
    expect(api.suggestions).toEqual([]);
  });

  it('suggests only real catalog symbols when a near match exists', () => {
    const api = getApi(catalogs, WEB_PACKAGE, 'Buton');
    expect(api.status).toBe('not-found');
    if (api.status !== 'not-found') return;
    for (const s of api.suggestions) {
      expect(catalogs[WEB_PACKAGE].symbols[s.symbol]).toBeDefined();
    }
  });

  it('reports not-found for a package it does not know', () => {
    expect(getApi(catalogs, '@acme/ui', 'Button')).toMatchObject({
      status: 'not-found',
      package: null,
      suggestions: [],
    });
  });

  it('does not expose a prop the library never declared', () => {
    const api = getApi(catalogs, WEB_PACKAGE, 'Button');
    if (api.status !== 'ok') throw new Error('expected ok');
    expect(api.props?.elevation).toBeUndefined();
  });
});

describe('package summary (L0)', () => {
  it('describes the package without the full declaration', () => {
    const summary = packageSummary(catalogs[WEB_PACKAGE]);
    expect(summary.package).toBe(WEB_PACKAGE);
    expect(summary.platform).toBe('web');
    expect(summary.components).toContain('Popover');
    expect(summary.symbolCount).toBeGreaterThan(100);
    expect(JSON.stringify(summary).length).toBeLessThan(
      JSON.stringify(catalogs[WEB_PACKAGE]).length / 5,
    );
  });
});
