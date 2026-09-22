import { buildIndex, search } from '@berrypjh/devhub-ui';

import { catalog } from '../../data';

import { SEARCH_KINDS, searchEntries } from './entries';
import { toSuggestion } from './view';

describe('catalog index', () => {
  const entries = searchEntries(catalog);
  const index = buildIndex(entries, SEARCH_KINDS);
  const top = (query: string) => search(index, query)[0];

  it('derives every kind from the catalog, with unique keys', () => {
    const keys = entries.map((e) => e.key);
    expect(keys.filter((k, i) => keys.indexOf(k) !== i)).toEqual([]);
    expect(SEARCH_KINDS.filter((kind) => !entries.some((e) => e.kind === kind))).toEqual([]);
    expect(entries.filter((e) => e.kind === 'journey')).toHaveLength(catalog.journeys.length);
    expect(entries.filter((e) => e.kind === 'command')).toHaveLength(catalog.commands.length);
    expect(entries.filter((e) => e.kind === 'document')).toHaveLength(catalog.documents.length);
    expect(entries.filter((e) => e.kind === 'record')).toHaveLength(catalog.records.length);
  });

  it('indexes only public package exports', () => {
    const exports = entries.filter((e) => e.kind === 'export').map((e) => e.label);
    const internal = catalog.packages.filter((p) => p.visibility === 'internal');
    for (const pkg of internal) {
      expect(exports.some((label) => label.startsWith(pkg.packageName))).toBe(false);
    }
    expect(exports).toContain('@berrypjh/react-ui/styles.css');
  });

  it.each([
    ['react-ui', 'package:react-ui', '/packages/react-ui'],
    ['size', 'command:script:size', '/engineering#command-script:size'],
    [
      'eval smoke',
      'command:script:eval:consumer:smoke',
      '/engineering#command-script:eval:consumer:smoke',
    ],
    ['styles.css', 'export:@berrypjh/react-ui/styles.css', '/packages/react-ui#inspector-exports'],
    [
      'buildTokenOutputs',
      'symbol:libs/design-tokens/src/lib/pipeline.ts#buildTokenOutputs',
      '/sources/libs/design-tokens/src/lib/pipeline.ts#symbol-buildTokenOutputs',
    ],
    ['token-pipeline', 'journey:token-pipeline', '/journeys/token-pipeline'],
    ['react-ui-vitest', 'test:react-ui-vitest', '/engineering#test-react-ui-vitest'],
    ['CHANGELOG', 'document:changelog', '/documents/changelog'],
    ['bash-guard-hook', 'record:bash-guard-hook', '/records/bash-guard-hook'],
  ])('ranks "%s" first as %s', (query, key, href) => {
    expect({ key: top(query)?.key, href: top(query)?.href }).toEqual({ key, href });
  });

  it('finds a journey step by its intent and leads to its URL', () => {
    const step = catalog.journeys[0].steps[1];
    const result = search(index, step.intent).find((r) => r.kind === 'step');
    expect(result?.href).toBe(`/journeys/${catalog.journeys[0].id}/steps/${step.id}`);
  });

  it('returns the same order every time', () => {
    const once = search(index, 'build').map((r) => r.key);
    expect(
      search(buildIndex(searchEntries(catalog), SEARCH_KINDS), 'build').map((r) => r.key),
    ).toEqual(once);
  });
});

describe('view', () => {
  it('names the kind in text', () => {
    const [first] = search(buildIndex(searchEntries(catalog), SEARCH_KINDS), 'react-ui');
    expect(toSuggestion(first).description.startsWith('패키지 · ')).toBe(true);
  });
});
