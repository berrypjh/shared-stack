import { describe, expect, it } from 'vitest';

import { loadTokenSource } from './repo-source';
import { lookupTokens } from './tokens';

const source = await loadTokenSource();

describe('token lookup', () => {
  it('keeps the existing tokens.json format', () => {
    expect(source.schema).toContain('tokens[path]');
    // 테마 목록은 design-tokens 레지스트리를 그대로 따른다 — 개수를 박지 않는다.
    expect(source.themes[0]).toBe('light');
    expect(source.themes.length).toBeGreaterThanOrEqual(3);
    expect(source.categories).toContain('color');
  });

  it('resolves an exact token path', () => {
    const r = lookupTokens(source, 'color.primary.pr500');
    expect(r.mode).toBe('exact');
    expect(r.matchCount).toBe(1);
    expect(r.matches[0].cssVar).toBe('--ds-primary-pr500');
    expect(Object.keys(r.matches[0].values)).toEqual(source.themes);
    expect(r.truncated).toBe(false);
  });

  it('resolves a prefix', () => {
    const r = lookupTokens(source, 'color.primary');
    expect(r.mode).toBe('prefix');
    expect(r.matchCount).toBeGreaterThan(1);
    expect(r.matches.every((m) => m.path.startsWith('color.primary.'))).toBe(true);
  });

  it('resolves a category', () => {
    const r = lookupTokens(source, 'spacing');
    expect(r.mode).toBe('category');
    expect(r.matches.map((m) => m.path)).toContain('spacing.md');
  });

  it('caps a large category and says how to narrow it', () => {
    const r = lookupTokens(source, 'color');
    expect(r.truncated).toBe(true);
    expect(r.returned).toBe(r.limit);
    expect(r.matchCount).toBeGreaterThan(r.limit);
    expect(r.refine).toContain('color.');
  });

  it('honours an explicit limit', () => {
    const r = lookupTokens(source, 'spacing', { limit: 2 });
    expect(r.returned).toBe(2);
    expect(r.truncated).toBe(true);
  });

  it('returns an empty result for an unknown path instead of guessing', () => {
    const r = lookupTokens(source, 'color.nonexistent.zz999');
    expect(r).toMatchObject({ mode: 'none', matchCount: 0, matches: [], refine: null });
  });

  it('is far smaller than shipping the whole token catalog', () => {
    const whole = JSON.stringify(source).length;
    expect(JSON.stringify(lookupTokens(source, 'color.primary.pr500')).length).toBeLessThan(
      whole / 100,
    );
  });
});
