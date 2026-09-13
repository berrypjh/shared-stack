import { bundleMeasurementSchema } from '@berrypjh/observability-contracts';

import { describe, expect, it } from 'vitest';

import { cxOnly, treeshake, TREESHAKE_ROWS } from '../../test/bundles';
import { bundle } from '../../test/fixtures';

import {
  baselineCellOf,
  budgetBarOf,
  groupedBars,
  sizeLimitRows,
  treeshakeGroups,
  treeshakeKindOf,
} from './bundles';

const parse = (value: unknown) => bundleMeasurementSchema.parse(value);

describe('budgetBarOf — 같은 측정의 current·limit 만 그린다', () => {
  it('한도를 넘으면 초과로 그리고 비율은 원본 값에서만 온다', () => {
    expect(budgetBarOf(parse(bundle()))).toEqual({
      kind: 'budget',
      value: 15857,
      limit: 15100,
      over: true,
    });
  });

  it('값이 없으면 0 막대가 아니라 gap 과 이유다', () => {
    expect(budgetBarOf(parse(cxOnly(null)))).toEqual({
      kind: 'gap',
      reason: 'libs/react-ui/dist/index.esm.js 가 없다',
    });
  });

  it('한도가 없는 진단 값에는 budget 막대가 없다', () => {
    expect(budgetBarOf(parse(treeshake('single: cx', '{ cx }', 'gzip', 10697)))).toEqual({
      kind: 'none',
      reason: '한도가 없는 진단 값입니다',
    });
  });
});

describe('baselineCellOf — 조건이 같을 때만 delta', () => {
  const current = parse(cxOnly(10574));

  it('baseline 실행이 없으면 no-baseline 이다 — 0 delta 가 아니다', () => {
    expect(baselineCellOf(current, null)).toEqual({
      status: 'no-baseline',
      reason: 'baseline 으로 비교할 실행을 고르지 않았습니다',
    });
  });

  it('baseline 실행에 같은 case 가 없으면 missing 이다', () => {
    expect(baselineCellOf(current, { runId: 'run-base', bundles: [] })).toEqual({
      status: 'missing',
      reason: 'run-base 에 이 case 가 없습니다',
    });
  });

  it('method 가 다르면 비교하지 않고 이유를 준다', () => {
    const other = parse({
      ...treeshake('single: cx', '{ cx }', 'gzip', 10697),
      id: 'bundle.size-limit.react-ui.cx-only',
    });
    const cell = baselineCellOf(current, { runId: 'run-base', bundles: [other] });
    expect(cell.status).toBe('not-comparable');
    expect(cell.status === 'not-comparable' && cell.reasons).toEqual(
      expect.arrayContaining(['method differs', 'compression differs']),
    );
  });

  it('조건이 같으면 current − baseline 을 정확한 bytes 로 준다', () => {
    const cell = baselineCellOf(current, { runId: 'run-base', bundles: [parse(cxOnly(10474))] });
    expect(cell).toMatchObject({ status: 'compared', deltaBytes: 100 });
    expect(cell.status === 'compared' && cell.relativeDelta).toBeCloseTo(100 / 10474);
  });
});

describe('sizeLimitRows', () => {
  it('size-limit 행만 모으고 standalone treeshake 값과 섞지 않는다', () => {
    const rows = sizeLimitRows(
      [parse(cxOnly()), parse(bundle()), ...TREESHAKE_ROWS.map(parse)],
      null,
    );
    expect(rows.map((row) => row.measurement.id)).toEqual([
      'bundle.size-limit.react-ui.cx-only',
      'bundle.size-limit.react-native-ui.full',
    ]);
  });
});

describe('treeshake', () => {
  it('collector 가 붙인 scenario 이름으로 종류를 나눈다', () => {
    expect(treeshakeKindOf('single: cx')).toBe('single');
    expect(treeshakeKindOf('multi: Box+Button')).toBe('multi');
    expect(treeshakeKindOf('all-exports (baseline)')).toBe('all-exports');
    expect(treeshakeKindOf('something else')).toBe('other');
  });

  it('package 안에서 scenario 마다 raw 와 gzip 을 짝짓는다', () => {
    const [group] = treeshakeGroups(TREESHAKE_ROWS.map(parse));
    expect(group.package).toBe('@berrypjh/react-ui');
    expect(
      group.scenarios.map((scenario) => [
        scenario.caseName,
        scenario.kind,
        scenario.raw?.value,
        scenario.gzip?.value,
      ]),
    ).toEqual([
      ['single: cx', 'single', 34245, 10697],
      ['multi: Box+Button', 'multi', 38120, null],
      ['all-exports (baseline)', 'all-exports', 152300, 41200],
    ]);
  });

  it('grouped bar 의 축은 한 압축 안에서만 잡고 값 없는 막대는 gap 으로 남긴다', () => {
    const [group] = treeshakeGroups(TREESHAKE_ROWS.map(parse));
    expect(groupedBars(group, 'gzip')).toEqual({
      max: 41200,
      bars: [
        { caseName: 'single: cx', kind: 'single', value: 10697, reason: null },
        {
          caseName: 'multi: Box+Button',
          kind: 'multi',
          value: null,
          reason: 'esbuild 번들 실패: No matching export "Missing"',
        },
        { caseName: 'all-exports (baseline)', kind: 'all-exports', value: 41200, reason: null },
      ],
    });
    expect(groupedBars(group, 'none').max).toBe(152300);
  });
});
