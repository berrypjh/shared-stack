import { describe, expect, it } from 'vitest';

import { orderHistory, runArtifactSchema, summarizeRun, trendOf } from '../src/index.js';

import { evalRun } from './eval-fixtures.js';
import { artifact, collection, HASH, metadata } from './fixtures.js';

type Overrides = Record<string, unknown>;

const CX = 'bundle.size-limit.react-ui.cx-only';

const bundle = (value: number | null, overrides: Overrides = {}) => ({
  id: CX,
  caseName: '@berrypjh/react-ui — cx only',
  role: 'diagnostic',
  method: 'size-limit',
  tool: { name: 'size-limit', version: '12.1.0' },
  package: '@berrypjh/react-ui',
  entry: 'libs/react-ui/dist/index.esm.js',
  importSpec: '{ cx }',
  externals: ['react'],
  target: 'es2022',
  compression: 'brotli',
  adjustment: 'size-limit-empty-project-subtracted',
  unit: 'bytes',
  configHash: HASH,
  budget: null,
  ...(value === null
    ? { availability: 'unavailable', value: null, reason: 'dist 가 없다' }
    : { availability: 'available', value, reason: null }),
  ...overrides,
});

const summaryAt = (runId: string, startedAt: string, rest: Overrides = {}) =>
  summarizeRun(
    runArtifactSchema.parse(
      artifact({
        metadata: metadata({
          runId,
          profile: 'core',
          collection: collection({ startedAt, finishedAt: startedAt }),
        }),
        observations: [],
        ...rest,
      }),
    ),
  );

describe('summary series — 요약만으로 추세를 그린다', () => {
  it('값과 비교 키를 싣고 raw 경로·trace 를 싣지 않는다', () => {
    const summary = summaryAt('run-a', '2026-09-13T08:00:00.000Z', {
      bundles: [bundle(10574)],
      evals: [evalRun()],
    });
    const cx = summary.series?.find((point) => point.id === CX);
    expect(cx).toMatchObject({
      domain: 'bundle',
      unit: 'bytes',
      statistic: 'value',
      value: 10574,
      keyComplete: true,
    });
    expect(cx?.comparableKey).toContain('"compression":"brotli"');
    const evalPoint = summary.series?.find(
      (point) => point.id === 'eval:pr-smoke:full-source:verifiedTaskSuccessRate',
    );
    expect(evalPoint).toMatchObject({ unit: 'ratio', statistic: 'rate', keyComplete: false });
    const text = JSON.stringify(summary.series);
    expect(text).not.toContain('raw/');
    expect(text).not.toContain('redacted');
  });
});

describe('orderHistory', () => {
  it('수집 시각 순으로 두고 요약이 없는 실행은 자리를 지킨 gap 이다', () => {
    const entries = orderHistory([
      { runId: 'run-c', summary: summaryAt('run-c', '2026-09-13T10:00:00.000Z'), problem: null },
      { runId: 'run-gap', summary: null, problem: '요약 파일이 없습니다' },
      { runId: 'run-a', summary: summaryAt('run-a', '2026-09-13T08:00:00.000Z'), problem: null },
    ]);
    expect(entries.map((entry) => [entry.runId, entry.status])).toEqual([
      ['run-a', 'ready'],
      ['run-gap', 'missing'],
      ['run-c', 'ready'],
    ]);
  });
});

describe('trendOf — 비교 가능한 점만 잇는다', () => {
  it('gap·미측정·없는 지표는 잇지 않고 조건이 바뀌면 새 구간이다', () => {
    const entries = orderHistory([
      {
        runId: 'run-1',
        summary: summaryAt('run-1', '2026-09-13T01:00:00.000Z', { bundles: [bundle(10574)] }),
        problem: null,
      },
      { runId: 'run-2', summary: null, problem: '요약 없음' },
      {
        runId: 'run-3',
        summary: summaryAt('run-3', '2026-09-13T03:00:00.000Z', { bundles: [bundle(10474)] }),
        problem: null,
      },
      {
        runId: 'run-4',
        summary: summaryAt('run-4', '2026-09-13T04:00:00.000Z', { bundles: [bundle(10500)] }),
        problem: null,
      },
      {
        runId: 'run-5',
        summary: summaryAt('run-5', '2026-09-13T05:00:00.000Z', { bundles: [bundle(null)] }),
        problem: null,
      },
      {
        runId: 'run-6',
        summary: summaryAt('run-6', '2026-09-13T06:00:00.000Z', {
          bundles: [bundle(9000, { compression: 'gzip' })],
        }),
        problem: null,
      },
      {
        runId: 'run-7',
        summary: summaryAt('run-7', '2026-09-13T07:00:00.000Z', {
          bundles: [bundle(8900, { compression: 'gzip' })],
        }),
        problem: null,
      },
      { runId: 'run-8', summary: summaryAt('run-8', '2026-09-13T08:00:00.000Z'), problem: null },
    ]);
    const trend = trendOf(entries, CX);
    expect(trend.unit).toBe('bytes');
    expect(
      trend.points.map((point) => [point.runId, point.status, point.value, point.segment]),
    ).toEqual([
      ['run-1', 'point', 10574, 1],
      ['run-2', 'gap', null, null],
      ['run-3', 'point', 10474, 2],
      ['run-4', 'point', 10500, 2],
      ['run-5', 'not-measured', null, null],
      ['run-6', 'point', 9000, 3],
      ['run-7', 'point', 8900, 3],
      ['run-8', 'absent', null, null],
    ]);
    expect(trend.segmentCount).toBe(3);
  });

  it('비교 키가 불완전한 점은 어떤 구간에도 잇지 않는다', () => {
    const entries = orderHistory([
      {
        runId: 'run-1',
        summary: summaryAt('run-1', '2026-09-13T01:00:00.000Z', { evals: [evalRun()] }),
        problem: null,
      },
      {
        runId: 'run-2',
        summary: summaryAt('run-2', '2026-09-13T02:00:00.000Z', { evals: [evalRun()] }),
        problem: null,
      },
    ]);
    const trend = trendOf(entries, 'eval:pr-smoke:full-source:verifiedTaskSuccessRate');
    expect(trend.points.map((point) => [point.status, point.segment])).toEqual([
      ['unknown-conditions', null],
      ['unknown-conditions', null],
    ]);
    expect(trend.segmentCount).toBe(0);
  });
});
