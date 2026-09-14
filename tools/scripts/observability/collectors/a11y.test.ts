import { accessibilitySummarySchema, type DesignSystem } from '@berrypjh/observability-contracts';

import { describe, expect, it } from 'vitest';

import type { RunnerCase, RunnerReport } from '../adapters/report';

import {
  MANUAL_CHECKLIST,
  ManualImportError,
  manualSummary,
  staticCssSummary,
  tokenContrastSummary,
  uiTestSummary,
} from './a11y';

const GUARDS: DesignSystem['contrastGuards'] = [
  {
    id: 'wcag-aa-text',
    label: 'WCAG 2.1 AA 텍스트 대비 (1.4.3)',
    ratio: 4.5,
    basis: 'wcag-2.1-aa',
    source: { path: 'libs/design-tokens/test/contrast.ts', line: 53 },
  },
  {
    id: 'wcag-aa-non-text',
    label: 'WCAG 2.1 AA 비텍스트 대비 (1.4.11)',
    ratio: 3,
    basis: 'wcag-2.1-aa',
    source: { path: 'libs/design-tokens/test/contrast.ts', line: 53 },
  },
  {
    id: 'divider-visibility',
    label: '프로젝트 가시성 가드 — WCAG 기준 아님',
    ratio: 1.2,
    basis: 'project-visibility-guard',
    source: { path: 'libs/design-tokens/src/lib/contrast.test.ts', line: 48 },
  },
];

const testCase = (file: string, title: string, status: RunnerCase['status']): RunnerCase => ({
  file: `/workspace/${file}`,
  ancestors: [],
  title,
  fullName: title,
  status,
  attempts: null,
  durationMs: 1,
});

const report = (cases: RunnerCase[]): RunnerReport => ({
  format: 'vitest-json',
  suites: null,
  files: [],
  cases,
  errors: [],
  interrupted: false,
});

const CONTRAST = 'libs/design-tokens/src/lib/contrast.test.ts';

describe('tokenContrastSummary — token pair 검사이고 DOM 대비가 아니다', () => {
  it('report 가 없으면 기준만 두고 not-run 이며 1.2 는 WCAG 기준으로 쓰지 않는다', () => {
    const summary = tokenContrastSummary({ guards: GUARDS, report: null });
    accessibilitySummarySchema.parse(summary);
    expect(summary.outcome).toBe('not-run');
    expect(summary.checks.map((check) => [check.id, check.status, check.threshold])).toEqual([
      ['token-contrast:wcag-aa-text', 'not-run', { ratio: 4.5, basis: 'wcag-2.1-aa-text' }],
      ['token-contrast:wcag-aa-non-text', 'not-run', { ratio: 3, basis: 'wcag-2.1-aa-non-text' }],
      [
        'token-contrast:divider-visibility',
        'not-run',
        { ratio: 1.2, basis: 'project-visibility-guard' },
      ],
    ]);
    expect(summary.limitations.join(' ')).toContain('실제 DOM 대비가 아닙니다');
    expect(summary.reason).toContain(
      '--outputFile="$PWD/tmp/quality-lab/imports/a11y/design-tokens.vitest.json"',
    );
  });

  it('case 제목의 기준으로 묶고, 해당 case 가 없으면 unknown 이다', () => {
    const summary = tokenContrastSummary({
      guards: GUARDS,
      report: report([
        testCase(CONTRAST, 'text on surface reaches 4.5:1', 'passed'),
        testCase(CONTRAST, 'link on card reaches 4.5:1', 'passed'),
        testCase(CONTRAST, 'divider stays visible', 'failed'),
        testCase('libs/design-tokens/src/lib/sd.test.ts', 'reaches 3:1 elsewhere', 'passed'),
      ]),
    });
    accessibilitySummarySchema.parse(summary);
    expect(summary.outcome).toBe('completed');
    const [text, nonText, divider] = summary.checks;
    expect(text).toMatchObject({ status: 'passed', cases: { passed: 2, failed: 0, skipped: 0 } });
    expect(nonText).toMatchObject({ status: 'unknown', cases: null });
    expect(divider).toMatchObject({
      status: 'failed',
      cases: { passed: 0, failed: 1, skipped: 0 },
    });
  });
});

describe('staticCssSummary', () => {
  it('compiled CSS 텍스트 검사이고 Windows 실제 forced-colors 관찰이 아니다', () => {
    const summary = staticCssSummary({
      report: report([
        testCase('libs/react-ui/src/components/forcedColors.test.ts', 'outline 을 켠다', 'passed'),
      ]),
    });
    accessibilitySummarySchema.parse(summary);
    expect(summary.checks[0]).toMatchObject({ kind: 'css-rule', status: 'passed' });
    expect(summary.limitations.join(' ')).toContain('Windows 실제 forced-colors 관찰이 아닙니다');
  });
});

describe('uiTestSummary', () => {
  it('source scan·DOM test 를 나누고 report 없는 쪽은 not-run, skip 만 있으면 unknown 이다', () => {
    const summary = uiTestSummary({
      reactUi: report([
        testCase('libs/react-ui/src/components/stories.aria.test.ts', 'id 참조', 'passed'),
      ]),
      demoWeb: report([testCase('apps/demo-web/src/app/pages/pages.spec.tsx', 'name', 'skipped')]),
      qualityLab: null,
    });
    accessibilitySummarySchema.parse(summary);
    expect(summary.checks.map((check) => [check.id, check.kind, check.status])).toEqual([
      ['ui-test:story-aria-refs', 'source-scan', 'passed'],
      ['ui-test:demo-web-names', 'dom-test', 'unknown'],
      ['ui-test:quality-lab-shell', 'dom-test', 'not-run'],
    ]);
    expect(summary.outcome).toBe('partial');
  });
});

describe('manualSummary — 사람의 관찰은 측정값이 아니다', () => {
  it('기록이 없으면 모든 항목이 not-run 이다 — pass 가 아니다', () => {
    const summary = manualSummary({ text: null });
    accessibilitySummarySchema.parse(summary);
    expect(summary.outcome).toBe('not-run');
    expect(summary.checks).toEqual([]);
    expect(summary.manual.map((item) => item.status)).toEqual(
      MANUAL_CHECKLIST.map(() => 'not-run'),
    );
  });

  it('관찰 기록은 환경·시각과 함께 들어오고 모르는 항목은 거부한다', () => {
    const text = JSON.stringify([
      {
        id: 'screen-reader',
        status: 'observed-issue',
        note: '표 caption 을 두 번 읽는다',
        checkedAt: '2026-09-13T12:00:00.000Z',
        environment: 'macOS VoiceOver · Safari 26',
      },
    ]);
    const summary = manualSummary({ text });
    accessibilitySummarySchema.parse(summary);
    expect(summary.outcome).toBe('partial');
    expect(summary.manual.find((item) => item.id === 'screen-reader')).toMatchObject({
      status: 'observed-issue',
      environment: 'macOS VoiceOver · Safari 26',
    });
    expect(() =>
      manualSummary({ text: JSON.stringify([{ id: 'score', status: 'observed-ok' }]) }),
    ).toThrow(ManualImportError);
    expect(() =>
      manualSummary({ text: JSON.stringify([{ id: 'screen-reader', status: 'passed' }]) }),
    ).toThrow(ManualImportError);
  });
});
