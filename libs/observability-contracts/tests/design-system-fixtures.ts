/**
 * design-system·package-surface 계약 test 전용 fixture. 값은 현재 저장소의 실제 모양을 따른다.
 */
type Overrides = Record<string, unknown>;

export const ref = (path: string, line: number) => ({ path, line });

export const TOKEN_SOURCE = ref('libs/design-tokens/tokens/light/component.json', 7);

export const testRef = (overrides: Overrides = {}) => ({
  path: 'libs/react-native-ui/src/components/button/Button.test.tsx',
  line: 351,
  title: 'pressed 면 pressedOffset 만큼 내려간다',
  evidenceKind: 'behavior-assertion',
  execution: 'not-run',
  ...overrides,
});

export const signal = (overrides: Overrides = {}) => {
  const component = (overrides.component as string | undefined) ?? 'Button';
  const platform = (overrides.platform as string | undefined) ?? 'react-native';
  const state = (overrides.state as string | undefined) ?? 'pressed';
  return {
    id: `${component}.${platform}.${state}`,
    component,
    platform,
    state,
    token: 'component.pressedOffset',
    label: '눌림: 색은 그대로, pressedOffset 만큼 아래로 이동',
    observationKind: 'tested',
    declared: TOKEN_SOURCE,
    consumed: ref('libs/react-native-ui/src/components/button/Button.styles.ts', 128),
    via: null,
    tested: testRef(),
    reason: null,
    ...overrides,
  };
};

export const componentToken = (overrides: Overrides = {}) => ({
  path: 'component.pressedOffset',
  cssVar: '--ds-component-pressed-offset',
  authored: { source: TOKEN_SOURCE, rawValue: '1', type: 'spacing' },
  lineage: { status: 'literal' },
  emitted: { catalog: true, web: '0.0625rem', rn: 1 },
  platformComparison: 'unit-conversion',
  documentedPolicy: { policy: 'undocumented', source: null },
  consumers: [ref('libs/react-ui/src/components/button-base/button-base.scss', 197)],
  ...overrides,
});

export const CATEGORIES = [
  'color',
  'spacing',
  'radius',
  'borderWidth',
  'border',
  'typography',
  'shadow',
  'elevation',
  'component',
  'motion',
];

export const tokenCatalog = (overrides: Overrides = {}) => ({
  path: 'libs/design-tokens/dist/tokens.json',
  status: 'valid',
  resolvedFor: 'web',
  themes: ['light', 'dark'],
  categories: [...CATEGORIES].sort(),
  rowCount: 565,
  issues: [],
  ...overrides,
});

const artifacts = (theme: string) => [
  {
    theme,
    kind: 'web-tokens',
    path: `libs/design-tokens/src/.generated/web/themes/${theme}/tokens.ts`,
    status: 'present',
    reason: null,
  },
  {
    theme,
    kind: 'rn-tokens',
    path: `libs/design-tokens/src/.generated/rn/themes/${theme}/tokens.ts`,
    status: 'present',
    reason: null,
  },
  {
    theme,
    kind: 'css',
    path: `libs/design-tokens/dist/css/variables.${theme}.css`,
    status: 'present',
    reason: null,
  },
];

export const designSystem = (overrides: Overrides = {}) => ({
  registry: {
    path: 'libs/design-tokens/src/themes.ts',
    themes: [
      { name: 'light', selector: ':root', sourceDirs: ['light'], line: 14 },
      {
        name: 'dark',
        selector: '[data-theme="dark"], .theme-dark',
        sourceDirs: ['light', 'dark'],
        line: 15,
      },
    ],
  },
  categories: { path: 'libs/design-tokens/src/lib/tokens.ts', line: 133, names: CATEGORIES },
  artifacts: [...artifacts('light'), ...artifacts('dark')],
  namespaces: [
    {
      platform: 'web',
      path: 'libs/design-tokens/src/.generated/web/index.ts',
      status: 'present',
      namespaces: ['Light', 'Dark'],
    },
    {
      platform: 'react-native',
      path: 'libs/design-tokens/src/.generated/rn/index.ts',
      status: 'present',
      namespaces: ['Light', 'Dark'],
    },
  ],
  catalog: tokenCatalog(),
  rnProvider: {
    path: 'libs/react-native-ui/src/theme/ThemeProvider.tsx',
    status: 'present',
    modes: ['light', 'dark'],
    satisfiesThemeName: true,
    missingThemes: [],
    extraModes: [],
    source: ref('libs/react-native-ui/src/theme/ThemeProvider.tsx', 15),
  },
  componentTokens: [componentToken()],
  signals: [signal()],
  unmappedConsumers: [],
  contrastGuards: [
    {
      id: 'wcag-aa-text',
      label: 'WCAG 2.1 AA 텍스트 대비',
      ratio: 4.5,
      basis: 'wcag-2.1-aa',
      source: ref('libs/design-tokens/test/contrast.ts', 55),
    },
    {
      id: 'divider-visibility',
      label: '프로젝트 가시성 가드 (WCAG 기준 아님)',
      ratio: 1.2,
      basis: 'project-visibility-guard',
      source: ref('libs/design-tokens/src/lib/contrast.test.ts', 48),
    },
  ],
  findings: [],
  ...overrides,
});
