import { describe, expect, it } from 'vitest';

import {
  accessibilitySummarySchema,
  automatedCheckSchema,
  manualCheckSchema,
  runArtifactSchema,
  summarizeRun,
} from '../src/index.js';

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
  id: 'quality-lab:/bundles:light:desktop',
  label: '/bundles · light · desktop 1280×800',
  route: '/bundles',
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
  id: 'a11y:quality-lab',
  sourceScope: 'quality-lab',
  source: 'axe-playwright',
  engine: { name: 'axe-core', version: '4.11.1' },
  tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
  enabledRules: ['color-contrast'],
  exclusions: [],
  index: null,
  startedAt: '2026-09-13T12:00:00.000Z',
  finishedAt: '2026-09-13T12:01:00.000Z',
  outcome: 'completed',
  reason: null,
  targets: [target()],
  checks: [],
  manual: [],
  limitations: [],
  ...overrides,
});

const ok = (overrides: Overrides) =>
  accessibilitySummarySchema.safeParse(summary(overrides)).success;

const check = (overrides: Overrides = {}) => ({
  id: 'token-contrast:wcag-aa-text',
  label: 'WCAG 2.1 AA 텍스트 대비 token pair',
  kind: 'token-pair',
  status: 'passed',
  threshold: { ratio: 4.5, basis: 'wcag-2.1-aa-text' },
  cases: { passed: 12, failed: 0, skipped: 0 },
  evidence: [{ path: 'libs/design-tokens/test/contrast.ts', line: 53 }],
  reason: null,
  ...overrides,
});

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
      id: 'quality-lab:/ai:dark:mobile',
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

  it('axe scope 에는 check·manual 을, token scope 에는 target 을 담지 않는다', () => {
    expect(ok({ checks: [check()] })).toBe(false);
    expect(
      ok({
        id: 'a11y:token-contrast',
        sourceScope: 'token-contrast',
        source: 'vitest-report',
        engine: null,
        tags: [],
        enabledRules: [],
        checks: [check()],
      }),
    ).toBe(false);
  });
});

describe('automated check — token pair 는 DOM 대비와 다르다', () => {
  const okCheck = (overrides: Overrides) =>
    automatedCheckSchema.safeParse(check(overrides)).success;

  it('WCAG basis 는 정해진 비율만, 1.2 는 프로젝트 가드다', () => {
    expect(okCheck({})).toBe(true);
    expect(okCheck({ threshold: { ratio: 3, basis: 'wcag-2.1-aa-non-text' } })).toBe(true);
    expect(okCheck({ threshold: { ratio: 1.2, basis: 'wcag-2.1-aa-non-text' } })).toBe(false);
    expect(okCheck({ threshold: { ratio: 1.2, basis: 'project-visibility-guard' } })).toBe(true);
  });

  it('passed·failed 는 case 근거가, not-run·unknown 은 이유가 있다', () => {
    expect(okCheck({ cases: null })).toBe(false);
    expect(okCheck({ cases: { passed: 3, failed: 1, skipped: 0 } })).toBe(false);
    expect(okCheck({ status: 'failed', cases: { passed: 3, failed: 1, skipped: 0 } })).toBe(true);
    expect(okCheck({ status: 'not-run', cases: null })).toBe(false);
    expect(
      okCheck({ status: 'not-run', cases: null, reason: 'report 를 import 하지 않았다' }),
    ).toBe(true);
  });
});

describe('manual check — 측정값과 섞지 않는다', () => {
  const manual = (overrides: Overrides = {}) => ({
    id: 'screen-reader',
    label: '스크린리더로 표 이름·행 머리 읽기',
    area: 'screen-reader',
    status: 'not-run',
    note: null,
    checkedAt: null,
    environment: null,
    ...overrides,
  });
  const okManual = (overrides: Overrides) => manualCheckSchema.safeParse(manual(overrides)).success;

  it('not-run 은 관찰 시각·환경이 없고, 관찰 결과는 둘 다 있다', () => {
    expect(okManual({})).toBe(true);
    expect(okManual({ checkedAt: '2026-09-13T12:00:00.000Z' })).toBe(false);
    expect(okManual({ status: 'observed-ok' })).toBe(false);
    expect(
      okManual({
        status: 'observed-ok',
        checkedAt: '2026-09-13T12:00:00.000Z',
        environment: 'macOS VoiceOver · Safari',
      }),
    ).toBe(true);
    expect(okManual({ status: 'passed' })).toBe(false);
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
