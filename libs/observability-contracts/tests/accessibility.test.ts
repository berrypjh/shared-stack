import { describe, expect, it } from 'vitest';

import { accessibilitySummarySchema, runArtifactSchema, summarizeRun } from '../src/index.js';

import { artifact } from './fixtures.js';

type Overrides = Record<string, unknown>;

const rule = (overrides: Overrides = {}) => ({
  id: 'color-contrast',
  impact: 'serious',
  tags: ['wcag2aa', 'wcag143'],
  help: 'Elements must meet minimum color contrast ratio thresholds',
  helpUrl: 'https://dequeuniversity.com/rules/axe/4.11/color-contrast',
  nodeCount: 2,
  nodes: [
    { target: ['main > p'], excerpt: '<p class="muted">' },
    { target: ['nav a'], excerpt: null },
  ],
  ...overrides,
});

const counts = (overrides: Overrides = {}) => ({
  violationRules: 1,
  violationNodes: 2,
  incompleteRules: 0,
  incompleteNodes: 0,
  inapplicableRules: 40,
  passRules: 25,
  ...overrides,
});

const impacts = (overrides: Overrides = {}) => ({
  critical: 0,
  serious: 2,
  moderate: 0,
  minor: 0,
  unknown: 0,
  ...overrides,
});

const target = (overrides: Overrides = {}) => ({
  id: 'devhub:/evaluation/bundles:light:desktop',
  label: '/evaluation/bundles · light · desktop 1280×800',
  route: '/evaluation/bundles',
  storyId: null,
  theme: 'light',
  viewport: { name: 'desktop', width: 1280, height: 800 },
  scope: 'document',
  status: 'scanned',
  reason: null,
  scannedAt: '2026-09-13T12:00:00.000Z',
  counts: counts(),
  impactNodes: impacts(),
  violations: [rule()],
  incomplete: [],
  ...overrides,
});

const unscanned = { counts: null, impactNodes: null, scannedAt: null, violations: [] };

const summary = (overrides: Overrides = {}) => ({
  id: 'a11y:devhub',
  sourceScope: 'devhub',
  source: 'axe-playwright',
  engine: { name: 'axe-core', version: '4.11.1' },
  tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
  enabledRules: ['color-contrast'],
  exclusions: [],
  startedAt: '2026-09-13T12:00:00.000Z',
  finishedAt: '2026-09-13T12:01:00.000Z',
  outcome: 'completed',
  reason: null,
  targets: [target()],
  limitations: [],
  ...overrides,
});

const ok = (overrides: Overrides) =>
  accessibilitySummarySchema.safeParse(summary(overrides)).success;

describe('AccessibilitySummary — axe target', () => {
  it('위반 0 이어도 incomplete 는 따로 남는다', () => {
    expect(
      ok({
        targets: [
          target({
            violations: [],
            incomplete: [
              rule({
                id: 'aria-valid-attr-value',
                impact: 'unknown',
                nodeCount: 1,
                nodes: [{ target: ['#a'], excerpt: null }],
              }),
            ],
            counts: counts({
              violationRules: 0,
              violationNodes: 0,
              incompleteRules: 1,
              incompleteNodes: 1,
            }),
            impactNodes: impacts({ serious: 0 }),
          }),
        ],
      }),
    ).toBe(true);
  });

  it('count 는 rule·node 목록과 impact 합계에 맞아야 한다', () => {
    expect(ok({ targets: [target({ counts: counts({ violationNodes: 3 }) })] })).toBe(false);
    expect(ok({ targets: [target({ impactNodes: impacts({ serious: 1 }) })] })).toBe(false);
  });

  it('impact null 은 받지 않는다 — adapter 가 unknown 으로 바꾼 뒤에만 들어온다', () => {
    expect(ok({ targets: [target({ violations: [rule({ impact: null })] })] })).toBe(false);
    expect(
      ok({
        targets: [
          target({
            violations: [rule({ impact: 'unknown' })],
            impactNodes: impacts({ serious: 0, unknown: 2 }),
          }),
        ],
      }),
    ).toBe(true);
  });

  it('같은 rule 은 한 번만, nodeCount 는 실은 node 수 이상이다', () => {
    expect(
      ok({
        targets: [
          target({
            violations: [rule(), rule()],
            counts: counts({ violationRules: 2, violationNodes: 4 }),
            impactNodes: impacts({ serious: 4 }),
          }),
        ],
      }),
    ).toBe(false);
    expect(ok({ targets: [target({ violations: [rule({ nodeCount: 1 })] })] })).toBe(false);
  });

  it('검사하지 못한 target 은 count 없이 이유를 가진다', () => {
    const failed = target({ status: 'scan-failed', reason: 'page.goto: timeout', ...unscanned });
    expect(ok({ outcome: 'scan-failed', reason: '모든 target 실패', targets: [failed] })).toBe(
      true,
    );
    expect(
      ok({
        outcome: 'scan-failed',
        reason: 'x',
        targets: [target({ status: 'scan-failed', reason: 'x' })],
      }),
    ).toBe(false);
    expect(
      ok({
        outcome: 'scan-failed',
        reason: 'x',
        targets: [target({ status: 'scan-failed', ...unscanned })],
      }),
    ).toBe(false);
  });

  it('completed 는 실패 target 이 없고, 실패가 섞이면 partial 이다', () => {
    const failed = target({
      id: 'devhub:/evaluation/ai:dark:mobile',
      status: 'scan-failed',
      reason: 'x',
      ...unscanned,
    });
    expect(ok({ targets: [target(), failed] })).toBe(false);
    expect(ok({ outcome: 'partial', reason: '1개 target 실패', targets: [target(), failed] })).toBe(
      true,
    );
    expect(ok({ outcome: 'not-run', reason: null, targets: [] })).toBe(false);
  });
});

describe('run artifact', () => {
  it('accessibility 가 없던 run 은 빈 목록이고 요약은 그 수를 센다', () => {
    const parsed = runArtifactSchema.parse(artifact());
    expect(parsed.accessibility).toEqual([]);
    expect(summarizeRun(parsed).sections.accessibility).toBe(0);
    const withAudit = runArtifactSchema.parse({
      ...artifact(),
      metadata: { ...artifact().metadata, profile: 'a11y' },
      accessibility: [summary()],
    });
    expect(summarizeRun(withAudit).sections.accessibility).toBe(1);
  });
});
