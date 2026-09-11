import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { TransformedToken } from 'style-dictionary/types';
import { beforeAll, describe, expect, it } from 'vitest';

import { themes } from '../themes.js';

import { buildThemeDictionaries, type ThemeBuild } from './sd.js';
import { getTokenType, getTokenValue } from './tokens.js';

const TOKENS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../tokens');

let builds: ThemeBuild[];

const byTheme = (name: string): ThemeBuild => {
  const build = builds.find((b) => b.theme === name);
  if (!build) throw new Error(`theme "${name}" not built`);
  return build;
};

const find = (tokens: readonly TransformedToken[], tokenPath: string): unknown => {
  const token = tokens.find((t) => t.path.join('.') === tokenPath);
  if (!token) throw new Error(`token "${tokenPath}" not found`);
  return getTokenValue(token);
};

beforeAll(async () => {
  builds = await buildThemeDictionaries(themes, TOKENS_DIR);
}, 60_000);

describe('buildThemeDictionaries', () => {
  it('builds one web and one rn dictionary per registered theme', () => {
    expect(builds.map((b) => b.theme)).toEqual(themes.map((t) => t.name));
    for (const build of builds) {
      expect(build.web.allTokens.length).toBeGreaterThan(0);
      expect(build.rn.allTokens).toHaveLength(build.web.allTokens.length);
    }
  });

  it('carries the theme selector through to the build', () => {
    expect(byTheme('light').selector).toBe(':root');
    expect(byTheme('dark').selector).toBe('[data-theme="dark"], .theme-dark');
  });

  it('gives every theme the same token set as the base theme', () => {
    const basePaths = byTheme('light')
      .web.allTokens.map((t) => t.path.join('.'))
      .sort();
    for (const build of builds) {
      expect(build.web.allTokens.map((t) => t.path.join('.')).sort()).toEqual(basePaths);
    }
  });
});

/**
 * Checkbox·Radio·Switch 의 선택 컨트롤 색 패밀리.
 *
 * 상태를 기계적으로 다 만들지 않는다. 기존 시맨틱과 뜻이 같은 상태는 그것을 쓴다 —
 * unchecked 경계 `field.border`, hover `field.borderHover`, error `stroke.error`,
 * focus `border.primary.color`, disabled `border.disabled.color`·`background.disable`.
 * 여기 있는 셋은 표현할 시맨틱이 없는 것뿐이다: 선택된 면, 그 위의 전경, 스위치 off 트랙.
 */
const SELECTION_CONTROL_KEYS = ['checked', 'indicator', 'trackOff'];

const readColorSource = (dir: string): Record<string, unknown> =>
  JSON.parse(fs.readFileSync(path.join(TOKENS_DIR, dir, 'color.json'), 'utf8'));

const selectionControlKeys = (dir: string): string[] =>
  Object.keys((readColorSource(dir).selectionControl as Record<string, unknown>) ?? {});

describe('selection control family', () => {
  it('authors the full family in the base theme', () => {
    expect(selectionControlKeys(themes[0].name).sort()).toEqual([...SELECTION_CONTROL_KEYS].sort());
  });

  it('never adds a key in a delta theme that the base lacks', () => {
    for (const theme of themes.slice(1)) {
      expect(
        selectionControlKeys(theme.name).filter((key) => !SELECTION_CONTROL_KEYS.includes(key)),
      ).toEqual([]);
    }
  });

  /**
   * base 의 램프 단계는 밝은 표면용이다. 표면이 뒤집히는 dark 에서만 다시 잡고, dark 를
   * 중간 단계로 끼우는 ember·midnight 는 그것을 물려받는다. 나머지 테마는 base alias 가
   * 자기 램프로 풀려 `contrast.test.ts` 를 통과한다 — 델타가 늘면 이 목록부터 다시 읽는다.
   */
  it('overrides the family only in dark', () => {
    const overriding = themes
      .slice(1)
      .filter((theme) => selectionControlKeys(theme.name).length > 0)
      .map((theme) => theme.name);

    expect(overriding).toEqual(['dark']);
  });

  it.each(themes.map((theme) => theme.name))(
    'resolves every key to the same color on web and rn — %s',
    (name) => {
      const build = byTheme(name);

      for (const key of SELECTION_CONTROL_KEYS) {
        const web = find(build.web.allTokens, `selectionControl.${key}`);

        expect(web).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(find(build.rn.allTokens, `selectionControl.${key}`)).toBe(web);
      }
    },
  );
});

describe('base source precedence', () => {
  it('overrides base values with the theme-specific source', () => {
    expect(find(byTheme('light').web.allTokens, 'primary.pr700')).toBe('#047857');
    expect(find(byTheme('dark').web.allTokens, 'primary.pr700')).toBe('#136F47');
    expect(find(byTheme('sepia').web.allTokens, 'primary.pr700')).toBe('#1A6E37');
  });

  it('inherits base values for heads the theme does not redefine', () => {
    for (const name of ['light', 'dark', 'sepia']) {
      expect(find(byTheme(name).web.allTokens, 'success.su500')).toBe('#12B76A');
    }
  });

  it('resolves semantic aliases against the winning primitive', () => {
    expect(find(byTheme('light').web.allTokens, 'background.primary')).toBe('#047857');
    expect(find(byTheme('dark').web.allTokens, 'background.primary')).toBe('#136F47');
  });
});

describe('web transforms', () => {
  const web = () => byTheme('light').web.allTokens;

  it('converts dimension-like tokens from px to rem', () => {
    expect(find(web(), 'spacing.md')).toBe('0.75rem');
    expect(find(web(), 'radius.md')).toBe('0.5rem');
    expect(find(web(), 'primitiveBorder.hairline')).toBe('0.03125rem');
  });

  it('converts font size and line height to rem', () => {
    expect(find(web(), 'fontSize.md')).toBe('1.125rem');
    expect(find(web(), 'lineHeight.md')).toBe('1.75rem');
  });

  it('keeps font weight numeric and leaves colors untouched', () => {
    expect(find(web(), 'fontWeight.bold')).toBe(700);
    expect(find(web(), 'background.primary')).toBe('#047857');
  });

  it('resolves composite spacing references with rem units', () => {
    expect(find(web(), 'component.button')).toBe('0.375rem 1rem');
  });
});

describe('rn transforms', () => {
  const rn = () => byTheme('light').rn.allTokens;

  it('emits unitless numbers for dimension-like tokens', () => {
    expect(find(rn(), 'spacing.md')).toBe(12);
    expect(find(rn(), 'radius.md')).toBe(8);
    expect(find(rn(), 'primitiveBorder.hairline')).toBe(0.5);
  });

  it('emits unitless numbers for font size, line height and letter spacing', () => {
    expect(find(rn(), 'fontSize.md')).toBe(18);
    expect(find(rn(), 'lineHeight.md')).toBe(28);
    expect(find(rn(), 'letterSpacing.sm')).toBe(-0.2);
  });

  it('keeps font weight numeric and leaves colors untouched', () => {
    expect(find(rn(), 'fontWeight.bold')).toBe(700);
    expect(find(rn(), 'background.primary')).toBe('#047857');
  });

  it('differs from web exactly on the unit-bearing token types', () => {
    const web = byTheme('light').web.allTokens;
    expect(find(web, 'spacing.md')).toBe('0.75rem');
    expect(find(rn(), 'spacing.md')).toBe(12);
  });
});

describe('font family platform split', () => {
  const web = () => byTheme('light').web.allTokens;
  const rn = () => byTheme('light').rn.allTokens;

  it('appends Korean fallbacks on web and keeps a bare name on RN', () => {
    expect(find(web(), 'fontFamilies.pretendard')).toBe(
      "Pretendard, 'Apple SD Gothic Neo', 'Malgun Gothic', system-ui, sans-serif",
    );
    // RN 은 등록된 서체 이름 하나만 받는다. 스택을 넘기면 조용히 무시된다.
    expect(find(rn(), 'fontFamilies.pretendard')).toBe('Pretendard');
  });

  it('applies the fallback exactly once to composite typography', () => {
    // transform 이 transitive 라 primitive 와 composite 양쪽에서 돈다. 두 번 붙으면 안 된다.
    const value = find(web(), 'body.medium.fontFamily');
    expect(value).toBe("Pretendard, 'Apple SD Gothic Neo', 'Malgun Gothic', system-ui, sans-serif");
    expect(String(value).split('Pretendard')).toHaveLength(2);
  });
});

describe('token type propagation', () => {
  const typeOf = (tokenPath: string) => {
    const token = byTheme('light').web.allTokens.find((t) => t.path.join('.') === tokenPath);
    return token ? getTokenType(token) : undefined;
  };

  it('aligns spacing, radius and border width onto the dimension type', () => {
    expect(typeOf('spacing.md')).toBe('dimension');
    expect(typeOf('radius.md')).toBe('dimension');
    expect(typeOf('primitiveBorder.hairline')).toBe('dimension');
  });

  it('keeps the dedicated typography types singular', () => {
    expect(typeOf('fontSize.md')).toBe('fontSize');
    expect(typeOf('lineHeight.md')).toBe('lineHeight');
    expect(typeOf('fontWeight.bold')).toBe('fontWeight');
    expect(typeOf('fontFamilies.pretendard')).toBe('fontFamily');
  });

  it('keeps color as color', () => {
    expect(typeOf('background.primary')).toBe('color');
  });

  it('exposes only the current closed set of token types', () => {
    const types = [...new Set(byTheme('light').web.allTokens.map(getTokenType))].sort();
    expect(types).toEqual([
      'color',
      'cubicBezier',
      'dimension',
      'duration',
      'fontFamily',
      'fontSize',
      'fontWeight',
      'letterSpacing',
      'lineHeight',
      'type',
    ]);
  });
});
