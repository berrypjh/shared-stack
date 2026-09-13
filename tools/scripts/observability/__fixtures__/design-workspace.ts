/**
 * design-system·package-surface collector test 전용 workspace. 셀 source 파일은 실제
 * `STATE_CELLS` 패턴에서 만든다 — spec 과 fixture 가 따로 놀지 않는다.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

import { type CellSpec, STATE_CELLS } from '../state-evidence';

import { tempDir, THEMES_SOURCE } from './fixtures';

const DT = 'libs/design-tokens';

export const COMPONENT_JSON = `{
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

const ROWS: Record<string, [string, string]> = {
  'component.button': ['--ds-component-button', '0.375rem 1rem'],
  'component.field.focusRingWidth': ['--ds-component-field-focus-ring-width', '0.125rem'],
  'component.field.height.sm': ['--ds-component-field-height-sm', '2.5rem'],
  'component.pressedOffset': ['--ds-component-pressed-offset', '0.0625rem'],
};

export const catalogText = (themes = ['light', 'midnight']) =>
  [
    '{',
    '  "schema": "tokens[path] = [cssVar, ...valuesInThemesOrder]",',
    `  "themes": ${JSON.stringify(themes)},`,
    '  "categories": ["component"],',
    '  "tokens": {',
    Object.entries(ROWS)
      .map(
        ([id, [cssVar, value]]) =>
          `    ${JSON.stringify(id)}: ${JSON.stringify([cssVar, ...themes.map(() => value)])}`,
      )
      .join(',\n'),
    '  }',
    '}',
    '',
  ].join('\n');

const tree = (platform: 'web' | 'rn') =>
  platform === 'web'
    ? {
        button: '0.375rem 1rem',
        field: { focusRingWidth: '0.125rem', height: { sm: '2.5rem' } },
        pressedOffset: '0.0625rem',
      }
    : { button: '6 16', field: { focusRingWidth: 2, height: { sm: 40 } }, pressedOffset: 1 };

const generated = (platform: 'web' | 'rn', theme: string) =>
  `/* eslint-disable */\n// AUTO-GENERATED — theme: ${theme}\n\nexport const tokens = ${JSON.stringify({ component: tree(platform) }, null, 2)} as const;\n\nexport type Tokens = typeof tokens;\n`;

const NAMESPACES =
  "/* eslint-disable */\nexport * as Light from './themes/light/tokens.js';\nexport * as Midnight from './themes/midnight/tokens.js';\n";

export const PROVIDER = `import { Native } from '@berrypjh/design-tokens';

const DEFAULT_TOKENS_BY_MODE = {
  light: Native.Light.tokens,
  midnight: Native.Midnight.tokens,
} satisfies Record<ThemeName, RNTokens>;
`;

export const AGENTS_DOC = `# design-tokens

| \`component.pressedOffset\` | web \`.ui-button:active\`가 \`1px\`을 하드코딩했고 RN Button·IconButton은 아직 눌림 표현이 없다 |

\`component.button\`은 소비처가 없어 **internal로 남긴다** — 카테고리 통째 공개가 아니라
`;

/** 셀 spec 의 소비·test 패턴을 그대로 담은 파일. */
const cellFiles = (cell: CellSpec): Record<string, string> => ({
  ...(cell.consumed ? { [cell.consumed.path]: `// ${cell.consumed.pattern}\n` } : {}),
  ...(cell.test
    ? { [cell.test.path]: `it('fixture ${cell.state}', () => {\n  ${cell.test.pattern};\n});\n` }
    : {}),
});

const cell = (id: string) => {
  const found = STATE_CELLS.find(
    (spec) => `${spec.component}.${spec.platform}.${spec.state}` === id,
  );
  if (!found) throw new Error(`no cell ${id}`);
  return found;
};

export const designFiles = (): Record<string, string> => ({
  [`${DT}/src/themes.ts`]: THEMES_SOURCE,
  [`${DT}/src/lib/tokens.ts`]:
    "/** 토큰 path[0]을 9개 카테고리 중 하나로 치환한다. */\nexport const TOKEN_CATEGORIES = [\n  'component',\n] as const;\n",
  [`${DT}/tokens/light/component.json`]: COMPONENT_JSON,
  [`${DT}/dist/tokens.json`]: catalogText(),
  [`${DT}/src/.generated/web/index.ts`]: NAMESPACES,
  [`${DT}/src/.generated/rn/index.ts`]: NAMESPACES,
  ...Object.fromEntries(
    ['light', 'midnight'].flatMap((theme) => [
      [`${DT}/src/.generated/web/themes/${theme}/tokens.ts`, generated('web', theme)],
      [`${DT}/src/.generated/rn/themes/${theme}/tokens.ts`, generated('rn', theme)],
      [
        `${DT}/dist/css/variables.${theme}.css`,
        `:root { --ds-component-pressed-offset: 0.0625rem; }\n`,
      ],
    ]),
  ),
  [`${DT}/src/lib/contrast.ts`]:
    'export const relativeLuminance = () => 0;\n\nexport const WCAG_AA = { text: 4.5, nonText: 3 } as const;\n',
  [`${DT}/src/lib/contrast.test.ts`]: "import x from 'y';\n\nconst DIVIDER_MIN = 1.2;\n",
  [`${DT}/AGENTS.md`]: AGENTS_DOC,
  'libs/react-native-ui/src/theme/ThemeProvider.tsx': PROVIDER,
  ...cellFiles(cell('Button.react-native.pressed')),
  'libs/react-ui/src/components/chip/chip.scss':
    '.ui-chip {}\n.ui-chip:active {\n  transform: translateY(var(--ds-component-pressed-offset));\n}\n',
});

export const writeFiles = async (root: string, files: Record<string, string>) => {
  for (const [file, content] of Object.entries(files)) {
    await fs.mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await fs.writeFile(path.join(root, file), content);
  }
};

export const makeDesignWorkspace = async (overrides: Record<string, string | null> = {}) => {
  const root = await tempDir('design');
  const files = { ...designFiles(), ...overrides };
  await writeFiles(
    root,
    Object.fromEntries(
      Object.entries(files).filter((entry): entry is [string, string] => entry[1] !== null),
    ),
  );
  return root;
};
