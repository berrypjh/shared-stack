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
  startedAt: AT,
  finishedAt: '2026-09-13T12:05:00.000Z',
  limitations: ['incomplete 는 사람이 확인해야 하는 결과이고 통과가 아닙니다'],
});

const desktop = { name: 'desktop', width: 1280, height: 800 };
const mobile = { name: 'mobile', width: 390, height: 844 };

export const BUNDLES_LIGHT = 'devhub:/evaluation/bundles:light:desktop';

/** DevHub 평가 화면을 localhost 에서 검사한 axe audit. */
export const devhubSummary = ({
  version = '4.11.1',
  contrastNodes = 2,
}: { version?: string; contrastNodes?: number } = {}) => ({
  ...axeBase('a11y:devhub', 'devhub', 'axe-playwright', version),
  outcome: 'partial',
  reason: 'target 3개 중 1개 검사 실패',
  targets: [
    scannedTarget(
      BUNDLES_LIGHT,
      '/evaluation/bundles · light · desktop 1280×800',
      { route: '/evaluation/bundles', theme: 'light', viewport: desktop, scope: 'document' },
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
      'devhub:/evaluation/bundles:dark:desktop',
      '/evaluation/bundles · dark · desktop 1280×800',
      { route: '/evaluation/bundles', theme: 'dark', viewport: desktop, scope: 'document' },
      { incomplete: [rule('color-contrast', 'serious', 3)] },
    ),
    unscannedTarget(
      'devhub:/evaluation/ai:dark:mobile',
      '/evaluation/ai · dark · mobile 390×844',
      { route: '/evaluation/ai', theme: 'dark', viewport: mobile, scope: 'document' },
      'scan-failed',
      '검사 실패 — page.goto: Timeout 20000ms exceeded',
    ),
  ],
});

export const accessibilityArtifact = (runId: string, summaries: unknown[] = [devhubSummary()]) => ({
  ...publicArtifact(runId, { profile: 'a11y' }),
  observations: [],
  accessibility: summaries,
});
