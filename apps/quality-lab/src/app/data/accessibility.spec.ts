import { accessibilitySummarySchema } from '@berrypjh/observability-contracts';

import { describe, expect, it } from 'vitest';

import { BUNDLES_LIGHT, qualityLabSummary } from '../../test/accessibility';

import {
  casesText,
  compareTarget,
  impactBars,
  manualStatusText,
  thresholdText,
} from './accessibility';

const quality = (options?: Parameters<typeof qualityLabSummary>[0]) =>
  accessibilitySummarySchema.parse(qualityLabSummary(options));

const targetOf = (summary: ReturnType<typeof quality>, id: string) => {
  const found = summary.targets.find((target) => target.id === id);
  if (!found) throw new Error(`no ${id}`);
  return found;
};

describe('thresholdText — WCAG 기준과 프로젝트 가드를 섞지 않는다', () => {
  it('basis 마다 다른 글이다', () => {
    expect(thresholdText({ ratio: 4.5, basis: 'wcag-2.1-aa-text' })).toBe(
      '4.5:1 · WCAG 2.1 AA 텍스트',
    );
    expect(thresholdText({ ratio: 3, basis: 'wcag-2.1-aa-non-text' })).toBe(
      '3:1 · WCAG 2.1 AA 비텍스트',
    );
    expect(thresholdText({ ratio: 1.2, basis: 'project-visibility-guard' })).toBe(
      '1.2:1 · 프로젝트 가시성 가드 (WCAG 기준 아님)',
    );
    expect(thresholdText(null)).toBe('기준 없음');
  });

  it('case 수와 manual 상태를 통과로 뭉개지 않는다', () => {
    expect(casesText(null)).toBe('case 없음');
    expect(casesText({ passed: 12, failed: 0, skipped: 1 })).toBe('통과 12 · 실패 0 · skip 1');
    expect(manualStatusText('not-run')).toBe('확인 안 함 (통과 아님)');
    expect(manualStatusText('observed-ok')).toBe('문제 없음으로 관찰');
  });
});

describe('impactBars — collector 의 impact node 수 그대로', () => {
  it('impact 순서를 고정하고 모두 0 이어도 막대 축은 1 이다', () => {
    const summary = quality();
    expect(impactBars(targetOf(summary, BUNDLES_LIGHT))).toEqual({
      scale: 2,
      bars: [
        { impact: 'critical', value: 0 },
        { impact: 'serious', value: 2 },
        { impact: 'moderate', value: 1 },
        { impact: 'minor', value: 0 },
        { impact: 'unknown', value: 1 },
      ],
    });
    expect(impactBars(targetOf(summary, 'quality-lab:/bundles:dark:desktop'))?.scale).toBe(1);
    expect(impactBars(targetOf(summary, 'quality-lab:/ai:dark:mobile'))).toBeNull();
  });
});

describe('compareTarget — 같은 rule·scope·engine 일 때만', () => {
  const current = quality();

  it('baseline 이 없으면 비교하지 않는다', () => {
    expect(compareTarget(current, BUNDLES_LIGHT, null)).toEqual({ status: 'no-baseline' });
  });

  it('출처·engine·target·검사 여부가 다르면 이유를 준다', () => {
    expect(compareTarget(current, BUNDLES_LIGHT, [])).toEqual({
      status: 'not-comparable',
      reasons: ['baseline 에 같은 출처가 없습니다'],
    });
    expect(compareTarget(current, BUNDLES_LIGHT, [quality({ version: '4.10.0' })])).toEqual({
      status: 'not-comparable',
      reasons: ['engine differs'],
    });
    expect(compareTarget(current, 'quality-lab:/ai:dark:mobile', [quality()])).toEqual({
      status: 'not-comparable',
      reasons: ['target not scanned'],
    });
  });

  it('같으면 rule 별 위반 node 수와 차이를 준다', () => {
    expect(compareTarget(current, BUNDLES_LIGHT, [quality({ contrastNodes: 5 })])).toEqual({
      status: 'compared',
      rules: [
        { id: 'color-contrast', current: 2, base: 5, delta: -3 },
        { id: 'landmark-unique', current: 1, base: 1, delta: 0 },
        { id: 'region', current: 1, base: 1, delta: 0 },
      ],
    });
  });
});
