import { describe, expect, it } from 'vitest';

import { baseTheme, themes } from './themes.js';

describe('theme registry', () => {
  it('starts from light and keeps every name unique', () => {
    const names = themes.map((t) => t.name);
    expect(names[0]).toBe('light');
    expect(new Set(names).size).toBe(names.length);
  });

  it('names themes so the generated namespace is a valid identifier', () => {
    // `genTsTokens` 가 첫 글자만 대문자로 바꿔 `export * as <Name>` 을 만든다.
    for (const t of themes) expect(t.name).toMatch(/^[a-z][A-Za-z0-9]*$/);
  });

  it('treats the first entry as the base theme', () => {
    expect(baseTheme).toBe(themes[0]);
    expect(baseTheme.name).toBe('light');
    expect(baseTheme.selector).toBe(':root');
  });

  it('gives every non-base theme a data-theme selector', () => {
    expect(baseTheme.selector).toBe(':root');
    for (const theme of themes.slice(1)) {
      expect(theme.selector).toContain(`[data-theme="${theme.name}"]`);
    }
  });

  it('sources the base theme from its own directory only', () => {
    expect(baseTheme.sourceDirs).toEqual(['light']);
  });

  it('cascades every non-base theme on top of the base directory', () => {
    for (const theme of themes.slice(1)) {
      // 자기 디렉터리가 마지막이라 자신의 값이 항상 이긴다.
      expect(theme.sourceDirs[0]).toBe(baseTheme.name);
      expect(theme.sourceDirs.at(-1)).toBe(theme.name);
      // 중간 단계는 이미 등록된 테마여야 한다 (dark 의 시맨틱 재지정을 재사용하는 경우).
      const known = new Set(themes.map((t) => t.name));
      for (const dir of theme.sourceDirs) expect(known.has(dir)).toBe(true);
    }
  });
});
