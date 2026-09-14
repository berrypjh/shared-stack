/** test 전용 접근성 결과. 계약(`accessibility.ts`)의 count 규칙을 지키도록 rule 에서 합계를 만든다. */
import { publicArtifact } from './fixtures';

type Impact = 'critical' | 'serious' | 'moderate' | 'minor' | 'unknown';
type Rule = ReturnType<typeof rule>;

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const AT = '2026-09-13T12:00:00.000Z';

export const rule = (id: string, impact: Impact, nodeCount: number) => ({
  id,
  impact,
  tags: ['wcag2aa'],
  help: `${id} help`,
  helpUrl: `https://dequeuniversity.com/rules/axe/4.11/${id}`,
  nodeCount,
  nodes: Array.from({ length: Math.min(nodeCount, 20) }, (_, index) => ({
    target: [`#${id}-${index}`],
    excerpt: `<div id="${id}-${index}">`,
  })),
});

const total = (rules: Rule[]) => rules.reduce((sum, item) => sum + item.nodeCount, 0);

const impactsOf = (rules: Rule[]) =>
  Object.fromEntries(
    (['critical', 'serious', 'moderate', 'minor', 'unknown'] as const).map((impact) => [
      impact,
      total(rules.filter((item) => item.impact === impact)),
    ]),
  );

type Place = {
  route?: string | null;
  storyId?: string | null;
  theme?: string | null;
  viewport?: { name: string; width: number; height: number } | null;
  scope: string;
};

const place = ({ route = null, storyId = null, theme = null, viewport = null, scope }: Place) => ({
  route,
  storyId,
  theme,
  viewport,
  scope,
});

export const scannedTarget = (
  id: string,
  label: string,
  where: Place,
  { violations = [], incomplete = [] }: { violations?: Rule[]; incomplete?: Rule[] } = {},
) => ({
  id,
  label,
  ...place(where),
  status: 'scanned',
  reason: null,
  scannedAt: AT,
  counts: {
    violationRules: violations.length,
    violationNodes: total(violations),
    incompleteRules: incomplete.length,
    incompleteNodes: total(incomplete),
    inapplicableRules: 30,
    passRules: 20,
  },
  impactNodes: impactsOf(violations),
  violations,
  incomplete,
});

export const unscannedTarget = (
  id: string,
  label: string,
  where: Place,
  status: 'skipped' | 'scan-failed' | 'not-run',
  reason: string,
) => ({
  id,
  label,
  ...place(where),
  status,
  reason,
  scannedAt: null,
  counts: null,
  impactNodes: null,
  violations: [],
  incomplete: [],
});

const axeBase = (id: string, sourceScope: string, source: string, version: string) => ({
  id,
  sourceScope,
  source,
  engine: { name: 'axe-core', version },
  tags: WCAG_TAGS,
  enabledRules: ['color-contrast'],
  exclusions: [],
  index: null,
  startedAt: AT,
  finishedAt: '2026-09-13T12:05:00.000Z',
  checks: [],
  manual: [],
  limitations: ['incomplete 는 사람이 확인해야 하는 결과이고 통과가 아닙니다'],
});

const desktop = { name: 'desktop', width: 1280, height: 800 };
const mobile = { name: 'mobile', width: 390, height: 844 };

export const BUNDLES_LIGHT = 'quality-lab:/bundles:light:desktop';

export const qualityLabSummary = ({
  version = '4.11.1',
  contrastNodes = 2,
}: { version?: string; contrastNodes?: number } = {}) => ({
  ...axeBase('a11y:quality-lab', 'quality-lab', 'axe-playwright', version),
  outcome: 'partial',
  reason: 'target 3개 중 1개 검사 실패',
  targets: [
    scannedTarget(
      BUNDLES_LIGHT,
      '/bundles · light · desktop 1280×800',
      { route: '/bundles', theme: 'light', viewport: desktop, scope: 'document' },
      {
        violations: [
          rule('color-contrast', 'serious', contrastNodes),
          rule('region', 'moderate', 1),
          rule('landmark-unique', 'unknown', 1),
        ],
        incomplete: [rule('aria-valid-attr-value', 'unknown', 1)],
      },
    ),
    scannedTarget(
      'quality-lab:/bundles:dark:desktop',
      '/bundles · dark · desktop 1280×800',
      { route: '/bundles', theme: 'dark', viewport: desktop, scope: 'document' },
      { incomplete: [rule('color-contrast', 'serious', 3)] },
    ),
    unscannedTarget(
      'quality-lab:/ai:dark:mobile',
      '/ai · dark · mobile 390×844',
      { route: '/ai', theme: 'dark', viewport: mobile, scope: 'document' },
      'scan-failed',
      '검사 실패 — page.goto: Timeout 20000ms exceeded',
    ),
  ],
});

const story = (id: string) => ({ storyId: `buttons-button--${id}`, scope: '#storybook-root' });

export const storybookSummary = () => ({
  ...axeBase('a11y:storybook', 'storybook', 'storybook-test-runner', '4.11.1'),
  index: { path: 'libs/react-ui/storybook-static/index.json', storyCount: 5, testStoryCount: 4 },
  outcome: 'partial',
  reason: 'scan 실패 1개 · 기록 없음 1개 · 검사 1개',
  targets: [
    scannedTarget('storybook:buttons-button--one', 'Buttons/Button · one', story('one')),
    unscannedTarget(
      'storybook:buttons-button--two',
      'Buttons/Button · two',
      story('two'),
      'skipped',
      'story context 가 검사를 껐습니다 — parameters.a11y.disable',
    ),
    unscannedTarget(
      'storybook:buttons-button--three',
      'Buttons/Button · three',
      story('three'),
      'scan-failed',
      'axe 결과가 없습니다',
    ),
    unscannedTarget(
      'storybook:buttons-button--four',
      'Buttons/Button · four',
      story('four'),
      'not-run',
      'test-runner 기록에 이 story 가 없습니다 (test tag story 인데 방문 기록 없음)',
    ),
  ],
});

const checkBase = (sourceScope: string) => ({
  id: `a11y:${sourceScope}`,
  sourceScope,
  source: 'vitest-report',
  engine: null,
  tags: [],
  enabledRules: [],
  exclusions: [],
  index: null,
  startedAt: null,
  finishedAt: null,
  targets: [],
  manual: [],
});

const CONTRAST = { path: 'libs/design-tokens/test/contrast.ts', line: 53 };

export const tokenContrastSummary = () => ({
  ...checkBase('token-contrast'),
  outcome: 'completed',
  reason: null,
  checks: [
    {
      id: 'token-contrast:wcag-aa-text',
      label: 'WCAG 2.1 AA 텍스트 대비 (1.4.3) — token pair',
      kind: 'token-pair',
      status: 'passed',
      threshold: { ratio: 4.5, basis: 'wcag-2.1-aa-text' },
      cases: { passed: 12, failed: 0, skipped: 0 },
      evidence: [CONTRAST],
      reason: null,
    },
    {
      id: 'token-contrast:wcag-aa-non-text',
      label: 'WCAG 2.1 AA 비텍스트 대비 (1.4.11) — token pair',
      kind: 'token-pair',
      status: 'unknown',
      threshold: { ratio: 3, basis: 'wcag-2.1-aa-non-text' },
      cases: null,
      evidence: [CONTRAST],
      reason: 'report 에 이 검사의 case 가 없습니다',
    },
    {
      id: 'token-contrast:divider-visibility',
      label: '프로젝트 가시성 가드 — token pair',
      kind: 'token-pair',
      status: 'failed',
      threshold: { ratio: 1.2, basis: 'project-visibility-guard' },
      cases: { passed: 5, failed: 1, skipped: 0 },
      evidence: [{ path: 'libs/design-tokens/src/lib/contrast.test.ts', line: 48 }],
      reason: null,
    },
  ],
  limitations: ['token 색 쌍으로 계산한 test 결과입니다 — 실제 DOM 대비가 아닙니다'],
});

export const staticCssSummary = () => ({
  ...checkBase('static-css'),
  outcome: 'not-run',
  reason: 'react-ui vitest report 를 import 하지 않았습니다',
  checks: [
    {
      id: 'static-css:forced-colors',
      label: 'compiled CSS 의 forced-colors outline 규칙 (텍스트 검사)',
      kind: 'css-rule',
      status: 'not-run',
      threshold: null,
      cases: null,
      evidence: [{ path: 'libs/react-ui/src/components/forcedColors.test.ts', line: null }],
      reason: 'react-ui vitest report 를 import 하지 않았습니다',
    },
  ],
  limitations: ['Windows 실제 forced-colors 관찰이 아닙니다'],
});

export const manualSummary = () => ({
  ...checkBase('manual'),
  source: 'manual-record',
  checks: [],
  outcome: 'not-run',
  reason: '수동 확인 기록이 없습니다',
  manual: [
    {
      id: 'keyboard-tab-order',
      label: 'Tab 순서가 화면 순서와 맞고 모든 컨트롤에 닿는다',
      area: 'keyboard',
      status: 'not-run',
      note: null,
      checkedAt: null,
      environment: null,
    },
    {
      id: 'screen-reader',
      label: '스크린리더가 표 caption·행 머리·상태 알림을 읽는다',
      area: 'screen-reader',
      status: 'not-run',
      note: null,
      checkedAt: null,
      environment: null,
    },
  ],
  limitations: ['사람의 관찰 기록이고 자동 측정값이 아닙니다'],
});

export const accessibilityArtifact = (
  runId: string,
  summaries: unknown[] = [
    storybookSummary(),
    tokenContrastSummary(),
    staticCssSummary(),
    manualSummary(),
    qualityLabSummary(),
  ],
) => ({
  ...publicArtifact(runId, { profile: 'a11y' }),
  observations: [],
  accessibility: summaries,
});
