import { accessibilitySummarySchema } from '@berrypjh/observability-contracts';

import { BUNDLES_LIGHT, devhubSummary } from '../../test/evaluation/accessibility';

import { compareTarget, impactBars } from './accessibility';

const quality = (options?: Parameters<typeof devhubSummary>[0]) =>
  accessibilitySummarySchema.parse(devhubSummary(options));

const targetOf = (summary: ReturnType<typeof quality>, id: string) => {
  const found = summary.targets.find((target) => target.id === id);
  if (!found) throw new Error(`no ${id}`);
  return found;
};

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
    expect(impactBars(targetOf(summary, 'devhub:/evaluation/bundles:dark:desktop'))?.scale).toBe(1);
    expect(impactBars(targetOf(summary, 'devhub:/evaluation/ai:dark:mobile'))).toBeNull();
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
      reasons: ['baseline 에 같은 출처가 없다'],
    });
    expect(compareTarget(current, BUNDLES_LIGHT, [quality({ version: '4.10.0' })])).toEqual({
      status: 'not-comparable',
      reasons: ['engine differs'],
    });
    expect(compareTarget(current, 'devhub:/evaluation/ai:dark:mobile', [quality()])).toEqual({
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
