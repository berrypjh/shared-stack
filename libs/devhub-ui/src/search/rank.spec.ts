import { buildIndex, search, type SearchEntry, topResults } from './rank';
import { isSearchShortcut, resultStatus } from './shortcut';
import { tokensOf } from './text';

const KINDS = ['journey', 'package', 'document', 'source'];

const entry = (over: Partial<SearchEntry> & Pick<SearchEntry, 'key'>): SearchEntry => ({
  kind: 'document',
  label: over.key,
  detail: '',
  href: `/${over.key}`,
  names: [],
  text: [],
  related: [],
  ...over,
});

const tiers = (entries: SearchEntry[], query: string) =>
  search(buildIndex(entries, KINDS), query).map((result) => [result.key, result.tier]);

describe('tokensOf', () => {
  it('splits camelCase, paths, and punctuation, and folds case', () => {
    expect(tokensOf('buildTokenOutputs')).toEqual(
      expect.arrayContaining(['buildtokenoutputs', 'build', 'token', 'outputs']),
    );
    expect(tokensOf('libs/react-ui/styles.css')).toEqual(
      expect.arrayContaining(['libs', 'react', 'ui', 'styles', 'css']),
    );
  });
});

describe('ranking tiers', () => {
  const entries = [
    entry({ key: 'exact', names: ['size'] }),
    entry({ key: 'prefix', names: ['size:why'] }),
    entry({ key: 'segment', names: ['.size-limit.cjs'] }),
    entry({ key: 'name-token', names: ['eval:consumer:smoke'] }),
    entry({ key: 'text-token', names: ['report'], text: ['eval smoke report'] }),
    entry({ key: 'substring', names: ['oversized'] }),
    entry({ key: 'related', names: ['step'], related: ['size budget'] }),
    entry({ key: 'none', names: ['other'] }),
  ];

  it('orders exact, prefix (name or segment), substring, and related', () => {
    expect(tiers(entries, 'size')).toEqual([
      ['exact', 0],
      ['prefix', 1],
      ['segment', 1],
      ['substring', 4],
      ['related', 5],
    ]);
  });

  it('puts every word in the name before words found only in the text', () => {
    expect(tiers(entries, 'eval smoke')).toEqual([
      ['name-token', 2],
      ['text-token', 3],
    ]);
  });

  it('matches regardless of case and Unicode form, and returns nothing for blank', () => {
    const korean = [entry({ key: 'k', names: ['토큰 추가'] })];
    expect(tiers(korean, '토큰'.normalize('NFD'))).toEqual([['k', 1]]);
    expect(tiers(entries, 'SIZE')[0]).toEqual(['exact', 0]);
    expect(tiers(entries, '   ')).toEqual([]);
  });

  it('breaks ties by kind order, then shorter label, then label, then key', () => {
    const tied = [
      entry({ key: 'b', kind: 'source', label: 'bb', names: ['x-b'] }),
      entry({ key: 'a', kind: 'source', label: 'bb', names: ['x-a'] }),
      entry({ key: 'long', kind: 'package', label: 'longer', names: ['x-long'] }),
      entry({ key: 'short', kind: 'package', label: 'aa', names: ['x-short'] }),
      entry({ key: 'journey', kind: 'journey', label: 'zzzz', names: ['x-journey'] }),
      entry({ key: 'unknown', kind: 'unknown', label: 'a', names: ['x-unknown'] }),
    ];
    expect(tiers(tied, 'x').map(([key]) => key)).toEqual([
      'journey',
      'short',
      'long',
      'a',
      'b',
      'unknown',
    ]);
  });
});

describe('topResults', () => {
  it('keeps rank order and at most N per kind', () => {
    const many = Array.from({ length: 8 }, (_, i) =>
      entry({ key: `s${i}`, kind: 'source', label: `s${i}`, names: [`q${i}`] }),
    );
    const one = entry({ key: 'd', kind: 'document', label: 'dddddd', names: ['q-doc'] });
    const shown = topResults(search(buildIndex([...many, one], KINDS), 'q'), 3);
    expect(shown.map((r) => r.key)).toEqual(['d', 's0', 's1', 's2']);
  });
});

describe('shortcut and status', () => {
  const key = (over: Partial<KeyboardEvent>) => ({
    key: 'k',
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    isComposing: false,
    defaultPrevented: false,
    ...over,
  });

  it('takes ⌘K on macOS and Ctrl+K elsewhere, and nothing else', () => {
    expect(isSearchShortcut(key({ metaKey: true }), true)).toBe(true);
    expect(isSearchShortcut(key({ ctrlKey: true }), true)).toBe(false);
    expect(isSearchShortcut(key({ ctrlKey: true }), false)).toBe(true);
    expect(isSearchShortcut(key({ metaKey: true }), false)).toBe(false);
    expect(isSearchShortcut(key({ key: 'K', ctrlKey: true }), false)).toBe(true);
    expect(isSearchShortcut(key({ ctrlKey: true, shiftKey: true }), false)).toBe(false);
    expect(isSearchShortcut(key({ ctrlKey: true, altKey: true }), false)).toBe(false);
    expect(isSearchShortcut(key({ ctrlKey: true, isComposing: true }), false)).toBe(false);
    expect(isSearchShortcut(key({ ctrlKey: true, defaultPrevented: true }), false)).toBe(false);
    expect(isSearchShortcut(key({ key: 'j', ctrlKey: true }), false)).toBe(false);
  });

  it('announces counts and no match', () => {
    expect(resultStatus('', 0, 0)).toBe('');
    expect(resultStatus('zz', 0, 0)).toBe('일치하는 항목이 없습니다');
    expect(resultStatus('a', 40, 30)).toBe('결과 40개 중 종류별 상위 30개');
    expect(resultStatus('a', 3, 3)).toBe('결과 3개');
  });
});
