import { describe, expect, it } from 'vitest';

import { THEMES_SOURCE } from '../__fixtures__/fixtures';

import {
  comparePlatformValues,
  findAuthoredToken,
  leafAt,
  parseGeneratedTokens,
  parseNamespaces,
  parseRnProvider,
  parseThemeRegistry,
  parseTokenCategories,
  TOKEN_CATALOG_SCHEMA_TEXT,
  validateTokenCatalog,
} from './tokens';

describe('parseThemeRegistry — themes.ts 를 실행하지 않고 읽는다', () => {
  it('이름·selector·sourceDirs·순서를 source 에서 읽는다', () => {
    expect(parseThemeRegistry(THEMES_SOURCE)).toEqual([
      { name: 'light', selector: ':root', sourceDirs: ['light'], line: 4 },
      {
        name: 'midnight',
        selector: '[data-theme="midnight"], .theme-midnight',
        sourceDirs: ['light', 'dark', 'midnight'],
        line: 6,
      },
    ]);
  });

  it('배열이 없으면 추측하지 않고 실패한다', () => {
    expect(() => parseThemeRegistry('export const other = [];')).toThrow(/themes/);
  });
});

describe('parseTokenCategories', () => {
  it('TOKEN_CATEGORIES 를 순서대로 읽는다', () => {
    const source =
      "const x = 1;\nexport const TOKEN_CATEGORIES = [\n  'color',\n  'motion',\n] as const;\n";
    expect(parseTokenCategories(source)).toEqual({ names: ['color', 'motion'], line: 2 });
  });
});

const catalogText = (overrides: Record<string, unknown> = {}) =>
  JSON.stringify({
    schema: TOKEN_CATALOG_SCHEMA_TEXT,
    themes: ['light', 'midnight'],
    categories: ['borderWidth', 'component'],
    tokens: {
      'borderWidth.primitive.sm': ['--ds-primitive-border-sm', '0.125rem', '0.125rem'],
      'component.pressedOffset': ['--ds-component-pressed-offset', '0.0625rem', '0.0625rem'],
    },
    ...overrides,
  });

const validate = (text: string | null) =>
  validateTokenCatalog(text, ['light', 'midnight'], ['component', 'borderWidth']);

describe('validateTokenCatalog — [cssVar, ...themeValues] positional row', () => {
  it('registry 순서·카테고리·row 모양이 맞으면 valid 다', () => {
    const result = validate(catalogText());
    expect(result).toMatchObject({
      status: 'valid',
      themes: ['light', 'midnight'],
      categories: ['borderWidth', 'component'],
      rowCount: 2,
      issues: [],
    });
  });

  it('CSS 변수 이름은 row 의 실제 값이다 — path 에서 만들어 내지 않는다', () => {
    expect(validate(catalogText()).rows?.['borderWidth.primitive.sm'][0]).toBe(
      '--ds-primitive-border-sm',
    );
  });

  it('row 길이가 테마 수와 맞지 않으면 invalid 다', () => {
    const tokens = {
      'borderWidth.primitive.sm': ['--ds-primitive-border-sm', '0.125rem'],
      'component.pressedOffset': ['--ds-component-pressed-offset', '0.0625rem', '0.0625rem'],
    };
    const result = validate(catalogText({ tokens }));
    expect(result.status).toBe('invalid');
    expect(result.issues).toEqual([
      {
        code: 'row-length',
        message: 'borderWidth.primitive.sm has 1 values for 2 themes',
      },
    ]);
  });

  it('테마 순서가 registry 와 다르면 invalid 다', () => {
    const result = validate(catalogText({ themes: ['midnight', 'light'] }));
    expect(result.status).toBe('invalid');
    expect(result.issues.map((issue) => issue.code)).toContain('theme-order');
  });

  it('schema 문구·카테고리·cssVar·정렬이 틀리면 각각 알린다', () => {
    const codes = (overrides: Record<string, unknown>) =>
      validate(catalogText(overrides)).issues.map((issue) => issue.code);
    expect(codes({ schema: 'tokens[path] = value' })).toEqual(['schema-text']);
    expect(codes({ categories: ['component'] })).toEqual(['categories']);
    expect(
      codes({
        tokens: {
          'borderWidth.primitive.sm': ['primitive-border-sm', '0.125rem', '0.125rem'],
          'component.pressedOffset': ['--ds-component-pressed-offset', '0.0625rem', '0.0625rem'],
        },
      }),
    ).toEqual(['css-var']);
    expect(
      codes({
        tokens: {
          'component.pressedOffset': ['--ds-component-pressed-offset', '0.0625rem', '0.0625rem'],
          'borderWidth.primitive.sm': ['--ds-primitive-border-sm', '0.125rem', '0.125rem'],
        },
      }),
    ).toEqual(['row-order']);
  });

  it('파일이 없으면 missing, JSON 이 깨지면 invalid 다', () => {
    expect(validate(null)).toMatchObject({ status: 'missing', themes: null, rows: null });
    expect(validate('{').issues).toEqual([
      { code: 'json', message: 'tokens.json is not valid JSON' },
    ]);
  });
});

const GENERATED = `/* eslint-disable */
// AUTO-GENERATED — theme: light

export const tokens = {
  "component": {
    "field": {
      "height": {
        "md": 52,
        "sm": 40
      }
    },
    "pressedOffset": 1
  }
} as const;

export type Tokens = typeof tokens;
`;

describe('generated token tree', () => {
  it('생성된 tokens 객체를 실행하지 않고 읽는다', () => {
    const tree = parseGeneratedTokens(GENERATED);
    expect(leafAt(tree, 'component.field.height.sm')).toBe(40);
    expect(leafAt(tree, 'component.pressedOffset')).toBe(1);
    expect(leafAt(tree, 'component.field')).toBeNull();
    expect(leafAt(tree, 'component.button')).toBeNull();
  });

  it('형태를 알 수 없으면 null 이다', () => {
    expect(parseGeneratedTokens('export const tokens = 1;')).toBeNull();
  });

  it('namespace re-export 를 순서대로 읽는다', () => {
    const index =
      "// AUTO\nexport * as Light from './themes/light/tokens.js';\nexport * as Midnight from './themes/midnight/tokens.js';\n";
    expect(parseNamespaces(index)).toEqual(['Light', 'Midnight']);
  });
});

describe('parseRnProvider — DEFAULT_TOKENS_BY_MODE', () => {
  const provider = (satisfies: string) => `import x from 'y';

const DEFAULT_TOKENS_BY_MODE = {
  light: Native.Light.tokens,
  midnight: Native.Midnight.tokens,
}${satisfies};
`;

  it('mode 목록과 satisfies 계약을 읽는다', () => {
    expect(parseRnProvider(provider(' satisfies Record<ThemeName, RNTokens>'))).toEqual({
      modes: ['light', 'midnight'],
      satisfiesThemeName: true,
      line: 3,
    });
  });

  it('satisfies 가 없으면 그렇게 기록하고, map 이 없으면 null 이다', () => {
    expect(parseRnProvider(provider(''))?.satisfiesThemeName).toBe(false);
    expect(parseRnProvider('export const x = 1;')).toBeNull();
  });
});

describe('comparePlatformValues — Web rem 과 RN 숫자는 의도된 표현 차이다', () => {
  it.each([
    ['0.0625rem', 1, 'unit-conversion'],
    ['0.375rem 1rem', '6 16', 'unit-conversion'],
    ['#059669', '#059669', 'identical'],
    ['ease', 'ease', 'identical'],
    ['0.125rem', 3, 'divergent'],
    ['0.125rem', null, 'unavailable'],
  ] as const)('%j vs %j → %s', (web, rn, expected) => {
    expect(comparePlatformValues(web, rn)).toBe(expected);
  });
});

const COMPONENT_JSON = `{
  "component": {
    "button": {
      "$value": "{spacing.sm} {spacing.lg}",
      "$type": "spacing"
    },
    "pressedOffset": {
      "$value": "1",
      "$type": "spacing"
    },
    "field": {
      "focusRingWidth": {
        "$value": "{primitiveBorder.sm}",
        "$type": "borderWidth"
      }
    }
  }
}
`;

describe('findAuthoredToken — authoring source 의 원래 값', () => {
  it('literal 과 alias 참조를 source 위치와 함께 읽는다', () => {
    expect(findAuthoredToken(COMPONENT_JSON, 'component.pressedOffset')).toEqual({
      line: 7,
      rawValue: '1',
      type: 'spacing',
      references: [],
    });
    expect(findAuthoredToken(COMPONENT_JSON, 'component.button')?.references).toEqual([
      'spacing.sm',
      'spacing.lg',
    ]);
    expect(findAuthoredToken(COMPONENT_JSON, 'component.field.focusRingWidth')).toMatchObject({
      line: 12,
      references: ['primitiveBorder.sm'],
    });
  });

  it('authoring source 에 없으면 null 이다 — lineage 를 지어내지 않는다', () => {
    expect(findAuthoredToken(COMPONENT_JSON, 'component.field.height.sm')).toBeNull();
  });
});
