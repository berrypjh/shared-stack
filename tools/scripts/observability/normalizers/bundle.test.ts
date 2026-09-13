import fs from 'node:fs/promises';
import path from 'node:path';

import { bundleMeasurementSchema, compareBundle } from '@berrypjh/observability-contracts';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { tempDir } from '../__fixtures__/fixtures';
import { readSizeLimitCases, type SizeLimitCase } from '../adapters/size-limit';

import { loadLimitParser, normalizeSizeLimit, normalizeTreeshake } from './bundle';

const REACT = ['react', 'react-dom', 'react/jsx-runtime'];

const sizeCase = (
  name: string,
  limit: string,
  extra: Partial<SizeLimitCase> = {},
): SizeLimitCase => ({
  name,
  path: 'libs/react-ui/dist/index.esm.js',
  importSpec: '{ cx }',
  limit,
  externals: REACT,
  target: 'es2022',
  compression: 'brotli',
  ...extra,
});

const CASES = [
  sizeCase('@berrypjh/react-ui — cx only', '11 KB'),
  sizeCase('@berrypjh/react-ui — at limit', '11 KB', { importSpec: '{ Box }' }),
  sizeCase('@berrypjh/react-native-ui — * (full)', '15.1 KB', {
    path: 'libs/react-native-ui/dist/index.esm.js',
    importSpec: '*',
    externals: ['react', 'react-native', 'react/jsx-runtime'],
  }),
];

const results = (
  entries: { name: string; size?: number; sizeLimit?: number; passed?: boolean }[],
) => ({
  status: 'results' as const,
  entries: entries.map((entry) => ({ size: null, sizeLimit: null, passed: null, ...entry })),
});

const parseLimit = loadLimitParser();

const normalize = (report: Parameters<typeof normalizeSizeLimit>[0]['report'], cases = CASES) =>
  normalizeSizeLimit({ cases, report, toolVersion: '12.1.0', parseLimit });

const byName = (measurements: { caseName: string }[], name: string) =>
  measurements.find((measurement) => measurement.caseName === name);

describe('loadLimitParser — 설치된 size-limit 의 단위 해석', () => {
  it('KB 는 1000, KiB 는 1024 바이트다', () => {
    expect(parseLimit('11 KB')).toBe(11000);
    expect(parseLimit('15.1 KB')).toBe(15100);
    expect(parseLimit('1 KiB')).toBe(1024);
  });
});

describe('normalizeSizeLimit', () => {
  const REPORT = results([
    { name: '@berrypjh/react-ui — cx only', size: 10574, sizeLimit: 11000, passed: true },
    { name: '@berrypjh/react-ui — at limit', size: 11000, sizeLimit: 11000, passed: true },
    { name: '@berrypjh/react-native-ui — * (full)', size: 15857, sizeLimit: 15100, passed: false },
  ]);

  it('모든 결과가 계약을 통과하고 size-limit 의미(brotli, 빈 프로젝트 차감)를 유지한다', () => {
    const { measurements } = normalize(REPORT);
    for (const measurement of measurements)
      expect(bundleMeasurementSchema.parse(measurement)).toEqual(measurement);
    expect(measurements[0]).toMatchObject({
      id: 'bundle.size-limit.react-ui.cx-only',
      role: 'budget',
      method: 'size-limit',
      unit: 'bytes',
      compression: 'brotli',
      adjustment: 'size-limit-empty-project-subtracted',
      entry: 'libs/react-ui/dist/index.esm.js',
      importSpec: '{ cx }',
      target: 'es2022',
      value: 10574,
      budget: {
        limitBytes: 11000,
        limitSource: '11 KB',
        headroomBytes: 426,
        outcome: 'pass',
        toolPassed: true,
      },
    });
  });

  it('초과하면 음수 headroom 을 보존한다', () => {
    expect(
      byName(normalize(REPORT).measurements, '@berrypjh/react-native-ui — * (full)'),
    ).toMatchObject({
      value: 15857,
      budget: { limitBytes: 15100, headroomBytes: -757, outcome: 'fail', toolPassed: false },
    });
  });

  it('한도와 같으면 headroom 0 으로 pass 다', () => {
    expect(byName(normalize(REPORT).measurements, '@berrypjh/react-ui — at limit')).toMatchObject({
      budget: { headroomBytes: 0, outcome: 'pass' },
    });
  });

  it('config 한도 해석이 size-limit 보고와 다르면 값을 믿지 않는다', () => {
    const report = results([
      { name: '@berrypjh/react-ui — cx only', size: 10574, sizeLimit: 11264, passed: true },
    ]);
    expect(
      byName(normalize(report, [CASES[0]]).measurements, '@berrypjh/react-ui — cx only'),
    ).toMatchObject({
      availability: 'invalid',
      value: null,
      budget: { limitBytes: 11000, headroomBytes: null, outcome: null },
    });
  });

  it('report 에 없는 case 는 unavailable, config 에 없는 report 항목은 따로 남긴다', () => {
    const report = results([
      { name: '@berrypjh/react-ui — cx only', size: 10574, sizeLimit: 11000, passed: true },
      { name: 'removed case', size: 1, sizeLimit: 2, passed: true },
    ]);
    const { measurements, unmatchedEntries } = normalize(report);
    expect(byName(measurements, '@berrypjh/react-ui — at limit')).toMatchObject({
      availability: 'unavailable',
      value: null,
    });
    expect(unmatchedEntries).toEqual(['removed case']);
  });

  it('size-limit 이 실패하면 모든 case 가 이유와 함께 값이 없다 — 한도는 config 에서 온다', () => {
    const { measurements } = normalize({
      status: 'error',
      message: 'Error: ENOENT /Users/park/shared-stack/libs/react-ui/dist/index.esm.js',
    });
    expect(measurements).toHaveLength(3);
    for (const measurement of measurements) {
      expect(measurement).toMatchObject({
        availability: 'unavailable',
        value: null,
        budget: { headroomBytes: null, outcome: null },
      });
      expect(measurement.reason).not.toContain('/Users/park');
    }
    expect(measurements[0].budget?.limitBytes).toBe(11000);
  });

  it('일부러 실행하지 않았으면 unavailable 이 아니라 not-run 이다', () => {
    const { measurements } = normalize({
      status: 'not-run',
      message: '--only-imports: size-limit 을 실행하지 않았다',
    });
    for (const measurement of measurements) {
      expect(measurement).toMatchObject({
        availability: 'not-run',
        value: null,
        budget: { headroomBytes: null, outcome: null },
      });
    }
  });

  it('report 가 깨졌으면 invalid 다', () => {
    const { measurements } = normalize({
      status: 'corrupt',
      message: 'size-limit-json report is not valid JSON',
    });
    expect(measurements.every((measurement) => measurement.availability === 'invalid')).toBe(true);
  });

  it('압축 설정이 다른 case 끼리는 비교하지 않는다', () => {
    const gzipCase = sizeCase('@berrypjh/react-ui — cx only', '11 KB', { compression: 'gzip' });
    const brotli = normalize(REPORT, [CASES[0]]).measurements[0];
    const gzip = normalize(REPORT, [gzipCase]).measurements[0];
    expect(compareBundle(brotli, gzip)).toMatchObject({ comparable: false, deltaBytes: null });
  });

  describe('주석의 과거 측정값', () => {
    let dir: string;

    beforeEach(async () => {
      dir = await tempDir('size-limit-history');
    });

    afterEach(async () => {
      await fs.rm(dir, { recursive: true, force: true });
    });

    it('observation 이 되지 않는다 — 측정되지 않은 case 는 값이 없다', async () => {
      const config = path.join(dir, '.size-limit.cjs');
      await fs.writeFile(
        config,
        `// 실측 raw 37,844 / brotli 10,840 (10.59 KB). baseline 12.84 KB -> 13.18 KB
module.exports = [{ name: '@berrypjh/react-ui — Stack only', path: 'libs/react-ui/dist/index.esm.js', import: '{ Stack }', limit: '11 KB' }];`,
      );
      const { measurements } = normalize(results([]), readSizeLimitCases(config));
      expect(measurements[0]).toMatchObject({ availability: 'unavailable', value: null });
      const serialized = JSON.stringify(measurements);
      for (const historical of ['37844', '10840', '12840', '13180', '10590'])
        expect(serialized).not.toContain(historical);
    });
  });
});

describe('normalizeTreeshake', () => {
  const REPORT = {
    target: 'react-ui',
    pkg: '@berrypjh/react-ui',
    external: REACT,
    scenarios: [
      {
        name: 'single: cx',
        kind: 'single' as const,
        symbols: ['cx'],
        raw: 34244,
        gzip: 10697,
        error: null,
      },
      {
        name: 'single: Nope',
        kind: 'single' as const,
        symbols: ['Nope'],
        raw: null,
        gzip: null,
        error:
          '✘ [ERROR] No matching export in "/Users/park/shared-stack/libs/react-ui/dist/index.esm.js" for import "Nope"',
      },
      {
        name: 'all-exports (baseline)',
        kind: 'all-exports' as const,
        symbols: [],
        raw: 86916,
        gzip: 14508,
        error: null,
      },
    ],
  };

  const measurements = normalizeTreeshake({ report: REPORT, toolVersion: '0.27.2' });

  it('raw 와 gzip 을 섞지 않고 각각 한도 없는 진단 값으로 남긴다', () => {
    for (const measurement of measurements)
      expect(bundleMeasurementSchema.parse(measurement)).toEqual(measurement);
    expect(
      measurements
        .filter((m) => m.caseName === 'single: cx')
        .map((m) => [m.compression, m.value, m.role, m.budget]),
    ).toEqual([
      ['none', 34244, 'diagnostic', null],
      ['gzip', 10697, 'diagnostic', null],
    ]);
  });

  it('import 표기는 scenario 에서 온다', () => {
    expect(measurements.find((m) => m.caseName === 'all-exports (baseline)')?.importSpec).toBe('*');
    expect(measurements.find((m) => m.caseName === 'single: cx')?.importSpec).toBe('{ cx }');
  });

  it('없는 export·esbuild 오류는 그 scenario 만 unavailable 이고 경로를 정제한다', () => {
    const failed = measurements.filter((m) => m.caseName === 'single: Nope');
    expect(failed).toHaveLength(2);
    for (const measurement of failed) {
      expect(measurement).toMatchObject({ availability: 'unavailable', value: null });
      expect(measurement.reason).toContain('No matching export');
      expect(measurement.reason).not.toContain('/Users/park');
    }
    expect(measurements.filter((m) => m.availability === 'available')).toHaveLength(4);
  });

  it('size-limit 값과 비교하지 않는다 — 방법·보정이 다르다', () => {
    const sizeLimit = normalizeSizeLimit({
      cases: [sizeCase('@berrypjh/react-ui — cx only', '11 KB', { compression: 'gzip' })],
      report: results([
        { name: '@berrypjh/react-ui — cx only', size: 10515, sizeLimit: 11000, passed: true },
      ]),
      toolVersion: '12.1.0',
      parseLimit,
    }).measurements[0];
    const treeshakeGzip = measurements.find(
      (m) => m.caseName === 'single: cx' && m.compression === 'gzip',
    );
    expect(treeshakeGzip && compareBundle(treeshakeGzip, sizeLimit)).toMatchObject({
      comparable: false,
    });
  });
});
