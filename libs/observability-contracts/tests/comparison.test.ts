import { describe, expect, it } from 'vitest';

import {
  baselinePointerSchema,
  compareRuns,
  deltaOf,
  originalEvalComparisonSchema,
  runArtifactSchema,
} from '../src/index.js';

import { CONDITIONS, evalRun } from './eval-fixtures.js';
import { artifact, HASH, metadata, OTHER_SHA, source } from './fixtures.js';

type Overrides = Record<string, unknown>;

const bundle = (value: number | null, overrides: Overrides = {}) => ({
  id: 'bundle.size-limit.react-ui.cx-only',
  caseName: '@berrypjh/react-ui — cx only',
  role: 'budget',
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
  ...(value === null
    ? {
        availability: 'unavailable',
        value: null,
        reason: 'dist 가 없다',
        budget: {
          limitBytes: 11000,
          limitSource: '11 KB',
          headroomBytes: null,
          outcome: null,
          toolPassed: null,
        },
      }
    : {
        availability: 'available',
        value,
        reason: null,
        budget: {
          limitBytes: 11000,
          limitSource: '11 KB',
          headroomBytes: 11000 - value,
          outcome: value <= 11000 ? 'pass' : 'fail',
          toolPassed: value <= 11000,
        },
      }),
  ...overrides,
});

const context = (tokens: number, overrides: Overrides = {}) => ({
  id: 'context.package-scenario.react-ui.baseline.openai',
  scope: 'package-scenario',
  subject: 'react-ui/baseline',
  provider: 'openai-tiktoken-local',
  tokenModel: 'gpt-4o',
  tokenizerVersion: '1.0.22',
  tokenizerVersionReason: null,
  contentConstruction: 'measure-tokens-read-files',
  files: ['libs/react-ui/package.json'],
  missingPaths: [],
  availability: 'available',
  chars: tokens * 3,
  tokens,
  reason: null,
  reasonCode: null,
  ...overrides,
});

const run = (
  runId: string,
  { meta = {}, src = {}, ...rest }: Overrides & { meta?: Overrides; src?: Overrides } = {},
) =>
  runArtifactSchema.parse(
    artifact({
      metadata: metadata({ runId, profile: 'core', source: source(src), ...meta }),
      observations: [],
      ...rest,
    }),
  );

const rowOf = (comparison: ReturnType<typeof compareRuns>, id: string) => {
  const found = comparison.rows.find((row) => row.id === id);
  if (!found) throw new Error(`no row ${id}`);
  return found;
};

const CX = 'bundle.size-limit.react-ui.cx-only';

describe('deltaOf — 절대 차이·상대 차이·percentage point 를 구분한다', () => {
  it('부호 있는 절대 차이와 상대 차이', () => {
    expect(deltaOf({ unit: 'bytes', baseline: 10574, current: 10474 })).toEqual({
      absolute: -100,
      relative: -100 / 10574,
      relativeNote: null,
      percentagePoints: null,
    });
    expect(deltaOf({ unit: 'tokens', baseline: 7, current: 7 })).toMatchObject({
      absolute: 0,
      relative: 0,
    });
  });

  it('기준이 0 이면 상대 차이는 N/A 다', () => {
    expect(deltaOf({ unit: 'bytes', baseline: 0, current: 5 })).toEqual({
      absolute: 5,
      relative: null,
      relativeNote: 'zero-baseline',
      percentagePoints: null,
    });
  });

  it('비율은 percentage point 로 쓰고 상대 %를 만들지 않는다', () => {
    const delta = deltaOf({ unit: 'ratio', baseline: 0.5, current: 0.75 });
    expect(delta).toMatchObject({ relative: null, relativeNote: 'percentage-point' });
    expect(delta.absolute).toBeCloseTo(0.25);
    expect(delta.percentagePoints).toBeCloseTo(25);
  });
});

describe('compareRuns — run 단위 조건', () => {
  it('baseline 이 없으면 no-baseline 이고 행을 만들지 않는다', () => {
    const comparison = compareRuns(run('run-current', { bundles: [bundle(10474)] }), null);
    expect(comparison).toMatchObject({ state: 'no-baseline', reasons: [], rows: [] });
    expect(comparison.lineage.baseline).toBeNull();
    expect(comparison.lineage.current).toMatchObject({ runId: 'run-current', profile: 'core' });
  });

  it('source SHA·lockfile 차이는 비교 대상이라 막지 않고 참고 이유로 남긴다', () => {
    const comparison = compareRuns(
      run('run-current', { src: { sha: OTHER_SHA, lockfileHash: 'd'.repeat(64) } }),
      run('run-base'),
    );
    expect(comparison.state).toBe('comparable');
    expect(comparison.reasons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'source.sha', effect: 'informs' }),
        expect.objectContaining({ key: 'source.lockfileHash', effect: 'informs' }),
      ]),
    );
  });

  it('profile 이 다르거나 같은 실행이면 incompatible 이다', () => {
    const profile = compareRuns(
      run('run-current'),
      run('run-base', { meta: { profile: 'static' } }),
    );
    expect(profile.state).toBe('incompatible');
    expect(profile.reasons).toContainEqual(
      expect.objectContaining({ key: 'metadata.profile', effect: 'blocks' }),
    );
    expect(compareRuns(run('run-base'), run('run-base')).state).toBe('incompatible');
  });
});

describe('compareRuns — metric 행', () => {
  it('압축이 다르면 그 행은 비교 불가이고 delta 가 없다', () => {
    const comparison = compareRuns(
      run('run-current', { bundles: [bundle(10474, { compression: 'gzip' })] }),
      run('run-base', { bundles: [bundle(10574)] }),
    );
    const row = rowOf(comparison, CX);
    expect(row).toMatchObject({ status: 'incompatible', delta: null, gate: 'report-only' });
    expect(row.reasons.map((reason) => reason.message)).toContain('compression differs');
  });

  it('조건이 같으면 음수 delta 를 그대로 준다', () => {
    const row = rowOf(
      compareRuns(
        run('run-current', { bundles: [bundle(10474)] }),
        run('run-base', { bundles: [bundle(10574)] }),
      ),
      CX,
    );
    expect(row).toMatchObject({
      status: 'compared',
      baseline: 10574,
      current: 10474,
      delta: { absolute: -100 },
    });
  });

  it('미측정·추가·제거를 드러낸다', () => {
    const other = bundle(900, { id: 'bundle.size-limit.react-ui.box-only', importSpec: '{ Box }' });
    const comparison = compareRuns(
      run('run-current', { bundles: [bundle(null), other] }),
      run('run-base', { bundles: [bundle(10574)], contexts: [context(1000)] }),
    );
    expect(rowOf(comparison, CX)).toMatchObject({ status: 'not-measured', delta: null });
    expect(rowOf(comparison, 'bundle.size-limit.react-ui.box-only')).toMatchObject({
      status: 'added',
      baseline: null,
      current: 900,
    });
    expect(rowOf(comparison, 'context.package-scenario.react-ui.baseline.openai')).toMatchObject({
      status: 'removed',
      baseline: 1000,
      current: null,
    });
  });

  it('tokenizer 버전이 다르면 context 행은 비교 불가다', () => {
    const row = rowOf(
      compareRuns(
        run('run-current', { contexts: [context(900, { tokenizerVersion: '1.0.23' })] }),
        run('run-base', { contexts: [context(1000)] }),
      ),
      'context.package-scenario.react-ui.baseline.openai',
    );
    expect(row.status).toBe('incompatible');
    expect(row.reasons.map((reason) => reason.message)).toContain('tokenizerVersion differs');
  });

  it('보고 전용이다 — 통과·실패 판정 필드가 없고 raw·trace 를 싣지 않는다', () => {
    const comparison = compareRuns(
      run('run-current', { bundles: [bundle(10474)], evals: [evalRun()] }),
      run('run-base', { bundles: [bundle(10574)], evals: [evalRun()] }),
    );
    for (const row of comparison.rows) {
      expect(row.gate).toBe('report-only');
      expect(row).not.toHaveProperty('outcome');
    }
    const text = JSON.stringify(comparison);
    expect(text).not.toContain('redacted');
    expect(text).not.toContain('raw/');
  });
});

const EVAL_ROW = 'eval:pr-smoke:full-source:verifiedTaskSuccessRate';

const withOrigin = (origin: Overrides, overrides: Overrides = {}) =>
  evalRun({ origin: { ...evalRun().origin, ...origin }, ...overrides });

const KNOWN = {
  ...CONDITIONS,
  datasetTaskCount: 4,
  modelSettings: { temperature: 0 },
  timeoutMs: 60000,
};

describe('compareRuns — eval 대시보드 조건', () => {
  it('K 가 다르면 비교 불가다', () => {
    const row = rowOf(
      compareRuns(
        run('run-current', { evals: [withOrigin({ k: 10, conditions: KNOWN })] }),
        run('run-base', { evals: [withOrigin({ conditions: KNOWN })] }),
      ),
      EVAL_ROW,
    );
    expect(row.status).toBe('incompatible');
    expect(row.reasons).toContainEqual(expect.objectContaining({ key: 'k', effect: 'blocks' }));
  });

  it('조건이 없거나 모델 설정·timeout 을 모르거나 task 부분집합이면 unknown 이다 — compatible 로 가정하지 않는다', () => {
    const missing = rowOf(
      compareRuns(
        run('run-current', { evals: [withOrigin({ conditions: null })] }),
        run('run-base', { evals: [withOrigin({ conditions: KNOWN })] }),
      ),
      EVAL_ROW,
    );
    expect(missing).toMatchObject({ status: 'unknown', delta: null });
    const subset = rowOf(
      compareRuns(
        run('run-current', { evals: [evalRun()] }),
        run('run-base', { evals: [evalRun()] }),
      ),
      EVAL_ROW,
    );
    expect(subset.status).toBe('unknown');
    expect(subset.reasons.map((reason) => reason.key)).toEqual(
      expect.arrayContaining(['conditions.modelSettings', 'conditions.timeoutMs', 'task-subset']),
    );
  });

  it('조건을 모두 알면 rate 는 percentage point, median 은 median 차이로 비교한다', () => {
    const comparison = compareRuns(
      run('run-current', { evals: [withOrigin({ conditions: KNOWN })] }),
      run('run-base', { evals: [withOrigin({ conditions: KNOWN })] }),
    );
    expect(rowOf(comparison, EVAL_ROW)).toMatchObject({
      status: 'compared',
      unit: 'ratio',
      statistic: 'rate',
      delta: { relativeNote: 'percentage-point' },
    });
    expect(rowOf(comparison, 'eval:pr-smoke:full-source:medianInputTokens')).toMatchObject({
      statistic: 'median',
    });
  });

  it('evaluator 의 원래 비교 결과와 warnings 는 대시보드 판정과 따로 보존한다', () => {
    const original = {
      source: 'summary',
      status: 'compared',
      comparable: false,
      warnings: [{ field: 'model', baseline: '"a"', current: '"b"' }],
      reason: null,
    };
    const comparison = compareRuns(
      run('run-current', { evals: [evalRun({ originalComparison: original })] }),
      run('run-base', { evals: [evalRun()] }),
    );
    expect(comparison.originalEval).toEqual([{ sourceId: 'eval:pr-smoke', comparison: original }]);
  });
});

describe('schemas', () => {
  it('깨진 baseline 은 이유가 있고 no-baseline 과 다른 상태다', () => {
    const ok = (value: Overrides) => originalEvalComparisonSchema.safeParse(value).success;
    const base = { source: 'baseline-file', comparable: null, warnings: [] };
    expect(ok({ ...base, status: 'no-baseline', reason: null })).toBe(true);
    expect(ok({ ...base, status: 'corrupt-baseline', reason: null })).toBe(false);
    expect(ok({ ...base, status: 'corrupt-baseline', reason: 'JSON 이 아닙니다' })).toBe(true);
    expect(ok({ ...base, status: 'compared', reason: null })).toBe(false);
  });

  it('baseline 포인터는 profile 마다 하나이고 history 에 기록이 있어야 한다', () => {
    const entry = { profile: 'core', runId: 'local-quality-01', setAt: '2026-09-13T12:00:00.000Z' };
    const pointer = { version: 1, pointers: [entry], history: [{ ...entry, replaced: null }] };
    expect(baselinePointerSchema.safeParse(pointer).success).toBe(true);
    expect(baselinePointerSchema.safeParse({ ...pointer, pointers: [entry, entry] }).success).toBe(
      false,
    );
    expect(baselinePointerSchema.safeParse({ ...pointer, history: [] }).success).toBe(false);
  });
});

describe('compareRuns — 함께 가진 지표', () => {
  it('지표가 추가·제거만 있으면 비교할 것이 없어 incompatible 이고 이유를 준다', () => {
    const other = bundle(900, { id: 'bundle.size-limit.react-ui.box-only', importSpec: '{ Box }' });
    const comparison = compareRuns(
      run('run-current', { bundles: [other] }),
      run('run-base', { bundles: [bundle(10574)] }),
    );
    expect(comparison.state).toBe('incompatible');
    expect(comparison.reasons).toContainEqual(
      expect.objectContaining({ key: 'metrics.shared', effect: 'blocks' }),
    );
    expect(comparison.counts).toMatchObject({ added: 1, removed: 1, compared: 0 });
  });
});
