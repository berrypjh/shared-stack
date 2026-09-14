import { describe, expect, it } from 'vitest';

import { bundleMeasurementSchema, compareBundle } from '../src/index.js';

import { sizeLimitMeasurement, treeshakeMeasurement } from './measurement-fixtures.js';

const ok = (input: unknown) => bundleMeasurementSchema.safeParse(input).success;
const parse = (input: unknown) => bundleMeasurementSchema.parse(input);

const budget = (value: number, limitBytes: number, extra: Record<string, unknown> = {}) =>
  sizeLimitMeasurement({
    value,
    budget: {
      limitBytes,
      limitSource: `${limitBytes} B`,
      headroomBytes: limitBytes - value,
      ...extra,
    },
  });

describe('BundleMeasurement', () => {
  it('size-limit budget 과 treeshake diagnostic fixture 가 통과한다', () => {
    expect(ok(sizeLimitMeasurement())).toBe(true);
    expect(ok(treeshakeMeasurement())).toBe(true);
  });

  it('단위는 bytes 이고 값은 비음수 정수다', () => {
    expect(ok(sizeLimitMeasurement({ unit: 'KB' }))).toBe(false);
    expect(ok(treeshakeMeasurement({ value: 10.5 }))).toBe(false);
    expect(ok(treeshakeMeasurement({ value: -1 }))).toBe(false);
  });

  describe('budget', () => {
    it('초과하면 음수 headroom 을 그대로 두고 fail 이다', () => {
      expect(ok(budget(15857, 15100, { outcome: 'fail', toolPassed: false }))).toBe(true);
      expect(
        parse(budget(15857, 15100, { outcome: 'fail', toolPassed: false })).budget?.headroomBytes,
      ).toBe(-757);
    });

    it('한도와 같으면 pass 다 (size-limit 의 판정과 같다)', () => {
      expect(ok(budget(11000, 11000, { outcome: 'pass', toolPassed: true }))).toBe(true);
      expect(ok(budget(11000, 11000, { outcome: 'fail', toolPassed: true }))).toBe(false);
    });

    it('headroom 은 같은 측정의 limit − current 다', () => {
      const wrong = sizeLimitMeasurement({
        budget: {
          limitBytes: 11000,
          limitSource: '11 KB',
          headroomBytes: 400,
          outcome: 'pass',
          toolPassed: true,
        },
      });
      expect(ok(wrong)).toBe(false);
    });

    it('도구 판정과 어긋나면 거부한다', () => {
      expect(ok(budget(10574, 11000, { outcome: 'pass', toolPassed: false }))).toBe(false);
    });

    it('값이 없으면 headroom·판정도 없고 이유가 있다', () => {
      const unavailable = {
        availability: 'unavailable',
        value: null,
        reason: 'libs/react-ui/dist/index.esm.js 가 없다',
        budget: {
          limitBytes: 11000,
          limitSource: '11 KB',
          headroomBytes: null,
          outcome: null,
          toolPassed: null,
        },
      };
      expect(ok(sizeLimitMeasurement(unavailable))).toBe(true);
      expect(ok(sizeLimitMeasurement({ ...unavailable, reason: null }))).toBe(false);
      expect(
        ok(sizeLimitMeasurement({ ...unavailable, budget: sizeLimitMeasurement().budget })),
      ).toBe(false);
    });
  });

  describe('역할과 방법', () => {
    it('diagnostic 은 한도를 갖지 않고 budget 은 반드시 갖는다', () => {
      expect(ok(treeshakeMeasurement({ budget: sizeLimitMeasurement().budget }))).toBe(false);
      expect(ok(sizeLimitMeasurement({ budget: null }))).toBe(false);
    });

    it('size-limit 값은 빈 프로젝트 차감값, treeshake 값은 차감 없는 standalone 값이다', () => {
      expect(ok(sizeLimitMeasurement({ adjustment: 'none' }))).toBe(false);
      expect(ok(treeshakeMeasurement({ adjustment: 'size-limit-empty-project-subtracted' }))).toBe(
        false,
      );
    });

    it('treeshake 는 brotli 를 재지 않는다', () => {
      expect(ok(treeshakeMeasurement({ compression: 'brotli' }))).toBe(false);
    });
  });
});

describe('compareBundle', () => {
  const current = parse(
    sizeLimitMeasurement({
      value: 10600,
      budget: {
        limitBytes: 11000,
        limitSource: '11 KB',
        headroomBytes: 400,
        outcome: 'pass',
        toolPassed: true,
      },
    }),
  );
  const baseline = parse(sizeLimitMeasurement());

  it('조건이 같으면 delta = current − baseline 이고 상대값을 계산한다', () => {
    expect(compareBundle(current, baseline)).toEqual({
      comparable: true,
      reasons: [],
      deltaBytes: 26,
      relativeDelta: 26 / 10574,
    });
  });

  it.each([
    ['compression', { compression: 'gzip' }],
    ['adjustment', { adjustment: 'none' }],
    ['entry', { entry: 'libs/react-ui/dist/other.js' }],
    ['importSpec', { importSpec: '{ Box }' }],
    ['target', { target: 'es2020' }],
    ['externals', { externals: ['react'] }],
    ['tool', { tool: { name: 'size-limit', version: '11.0.0' } }],
    ['configHash', { configHash: 'd'.repeat(64) }],
  ])('%s 가 다르면 비교하지 않는다', (field, change) => {
    const other = { ...baseline, ...change } as typeof baseline;
    const result = compareBundle(current, other);
    expect(result).toMatchObject({ comparable: false, deltaBytes: null, relativeDelta: null });
    expect(result.reasons.join(' ')).toContain(field);
  });

  it('baseline 이 0 이면 delta 는 있지만 상대값은 N/A 다', () => {
    const zero = parse(
      sizeLimitMeasurement({
        value: 0,
        budget: {
          limitBytes: 11000,
          limitSource: '11 KB',
          headroomBytes: 11000,
          outcome: 'pass',
          toolPassed: true,
        },
      }),
    );
    expect(compareBundle(current, zero)).toMatchObject({
      comparable: true,
      deltaBytes: 10600,
      relativeDelta: null,
    });
  });

  it('어느 쪽 값이 없으면 비교하지 않는다', () => {
    const missing = parse(
      sizeLimitMeasurement({
        availability: 'unavailable',
        value: null,
        reason: 'dist 없음',
        budget: {
          limitBytes: 11000,
          limitSource: '11 KB',
          headroomBytes: null,
          outcome: null,
          toolPassed: null,
        },
      }),
    );
    expect(compareBundle(current, missing)).toMatchObject({
      comparable: false,
      deltaBytes: null,
      relativeDelta: null,
    });
  });
});
