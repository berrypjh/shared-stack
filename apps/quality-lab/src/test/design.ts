/** test 전용 design-system 근거. 계약(`design-system.ts`) 모양 그대로 두 테마만 둔다. */
import { publicArtifact } from './fixtures';

const ref = (path: string, line: number) => ({ path, line });
const TOKEN_SOURCE = ref('libs/design-tokens/tokens/light/component.json', 7);

const artifact = (theme: string, kind: string, path: string, missing = false) => ({
  theme,
  kind,
  path,
  status: missing ? 'missing' : 'present',
  reason: missing ? `${path} 이 없다` : null,
});

type SignalInput = {
  component: string;
  platform: string;
  state: string;
  token: string | null;
  observationKind: string;
  declared?: boolean;
  consumed?: [string, number] | null;
  tested?: [string, number, string, string] | null;
  reason?: string | null;
};

const signal = ({
  component,
  platform,
  state,
  token,
  observationKind,
  declared = token !== null,
  consumed = null,
  tested = null,
  reason = null,
}: SignalInput) => ({
  id: `${component}.${platform}.${state}`,
  component,
  platform,
  state,
  token,
  label: `${state}: 색이 아닌 설명`,
  observationKind,
  declared: declared ? TOKEN_SOURCE : null,
  consumed: consumed ? ref(consumed[0], consumed[1]) : null,
  via: null,
  tested: tested
    ? {
        path: tested[0],
        line: tested[1],
        title: tested[2],
        evidenceKind: tested[3],
        execution: 'not-run',
      }
    : null,
  reason,
});

export const SIGNALS = [
  signal({
    component: 'Button',
    platform: 'react-native',
    state: 'pressed',
    token: 'component.pressedOffset',
    observationKind: 'tested',
    consumed: ['libs/react-native-ui/src/components/button/Button.styles.ts', 128],
    tested: [
      'libs/react-native-ui/src/components/button/Button.test.tsx',
      351,
      '눌리면 토큰 오프셋만큼 내려간다',
      'behavior-assertion',
    ],
  }),
  signal({
    component: 'Button',
    platform: 'web',
    state: 'pressed',
    token: 'component.pressedOffset',
    observationKind: 'consumed',
    consumed: ['libs/react-ui/src/components/button-base/button-base.scss', 197],
  }),
  signal({
    component: 'Checkbox',
    platform: 'react-native',
    state: 'focus-visible',
    token: 'component.field.focusRingWidth',
    observationKind: 'declared',
    reason: 'RN source 에서 선택 컨트롤의 포커스 표현 근거를 찾지 못했다',
  }),
  signal({
    component: 'Checkbox',
    platform: 'react-native',
    state: 'reduced-motion',
    token: null,
    observationKind: 'unknown',
    reason: 'RN source 에서 reduced-motion 처리 근거를 찾지 못했다',
  }),
  signal({
    component: 'Checkbox',
    platform: 'web',
    state: 'reduced-motion',
    token: null,
    observationKind: 'tested',
    consumed: ['libs/react-ui/src/components/checkbox/checkbox.scss', 122],
    tested: [
      'libs/react-ui/src/components/checkbox/Checkbox.test.tsx',
      472,
      'reduced-motion 은 전환만 끄고 포커스 표시는 건드리지 않는다',
      'source-assertion',
    ],
  }),
  signal({
    component: 'Fab',
    platform: 'web',
    state: 'pressed',
    token: 'component.pressedOffset',
    observationKind: 'not-applicable',
    consumed: ['libs/react-ui/src/components/fab/fab.scss', 49],
    reason: 'Fab 은 눌림을 pressedOffset 이 아니라 elevation 으로 표현한다',
  }),
];

export const designSystem = () => ({
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
  categories: {
    path: 'libs/design-tokens/src/lib/tokens.ts',
    line: 133,
    names: ['color', 'component'],
  },
  artifacts: [
    artifact('light', 'web-tokens', 'libs/design-tokens/src/.generated/web/themes/light/tokens.ts'),
    artifact('light', 'rn-tokens', 'libs/design-tokens/src/.generated/rn/themes/light/tokens.ts'),
    artifact('light', 'css', 'libs/design-tokens/dist/css/variables.light.css'),
    artifact('dark', 'web-tokens', 'libs/design-tokens/src/.generated/web/themes/dark/tokens.ts'),
    artifact(
      'dark',
      'rn-tokens',
      'libs/design-tokens/src/.generated/rn/themes/dark/tokens.ts',
      true,
    ),
    artifact('dark', 'css', 'libs/design-tokens/dist/css/variables.dark.css'),
  ],
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
  catalog: {
    path: 'libs/design-tokens/dist/tokens.json',
    status: 'valid',
    resolvedFor: 'web',
    themes: ['light', 'dark'],
    categories: ['color', 'component'],
    rowCount: 565,
    issues: [],
  },
  rnProvider: {
    path: 'libs/react-native-ui/src/theme/ThemeProvider.tsx',
    status: 'present',
    modes: ['light', 'dark'],
    satisfiesThemeName: true,
    missingThemes: [],
    extraModes: [],
    source: ref('libs/react-native-ui/src/theme/ThemeProvider.tsx', 15),
  },
  componentTokens: [
    {
      path: 'component.pressedOffset',
      cssVar: '--ds-component-pressed-offset',
      authored: { source: TOKEN_SOURCE, rawValue: '1', type: 'spacing' },
      lineage: { status: 'literal' },
      emitted: { catalog: true, web: '0.0625rem', rn: 1 },
      platformComparison: 'unit-conversion',
      documentedPolicy: { policy: 'undocumented', source: null },
      consumers: [ref('libs/react-ui/src/components/button-base/button-base.scss', 197)],
    },
  ],
  signals: SIGNALS,
  unmappedConsumers: [],
  contrastGuards: [
    {
      id: 'wcag-aa-text',
      label: 'WCAG 2.1 AA 텍스트 대비 (1.4.3)',
      ratio: 4.5,
      basis: 'wcag-2.1-aa',
      source: ref('libs/design-tokens/src/lib/contrast.ts', 55),
    },
    {
      id: 'divider-visibility',
      label: '프로젝트 가시성 가드 — WCAG 기준 아님',
      ratio: 1.2,
      basis: 'project-visibility-guard',
      source: ref('libs/design-tokens/src/lib/contrast.test.ts', 48),
    },
  ],
  findings: [],
});

export const designSystemArtifact = (runId = 'run-ds') => ({
  ...publicArtifact(runId),
  designSystem: designSystem(),
});
