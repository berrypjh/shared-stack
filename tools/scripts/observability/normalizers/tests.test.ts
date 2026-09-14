import { testSummarySchema } from '@berrypjh/observability-contracts';

import { describe, expect, it } from 'vitest';

import type { RunnerCase, RunnerReport } from '../adapters/report';

import { type ExecutionRecord, normalizeTestRun, type ReportInput, type TestSource } from './tests';

const ROOT = '/ws';
const HASH = 'c'.repeat(64);

const SOURCE: TestSource = {
  sourceId: 'vitest:@berrypjh/react-ui',
  area: 'nx-project',
  project: '@berrypjh/react-ui',
  runner: 'vitest',
  runnerVersion: '4.0.17',
  commandId: 'test.react-ui',
  include: ['{src,test}/**/*.{test,spec}.{ts,tsx}'],
  includeHash: HASH,
  selectedProjects: ['@berrypjh/react-ui'],
};

const execution = (overrides: Partial<ExecutionRecord> = {}): ExecutionRecord => ({
  status: 'completed',
  exitCode: 0,
  timeoutMs: 600000,
  wallMs: 4100,
  excerpt: null,
  reason: null,
  cache: 'not-applicable',
  ...overrides,
});

const runnerCase = (
  file: string,
  fullName: string,
  overrides: Partial<RunnerCase> = {},
): RunnerCase => ({
  file: `${ROOT}/${file}`,
  ancestors: fullName.split(' ').slice(0, -1),
  title: fullName,
  fullName,
  status: 'passed',
  attempts: { value: 1, provenance: 'derived-from-report' },
  durationMs: 2,
  ...overrides,
});

const parsed = (report: Partial<RunnerReport>): ReportInput => ({
  status: 'parsed',
  path: 'raw/tests/test.react-ui.json',
  sha256: HASH,
  report: {
    format: 'vitest-json',
    suites: 3,
    files: [],
    cases: [],
    errors: [],
    interrupted: false,
    ...report,
  },
});

const A = 'libs/react-ui/src/a.test.tsx';
const B = 'libs/react-ui/src/b.test.tsx';

const normalize = (
  report: ReportInput,
  overrides: Partial<Parameters<typeof normalizeTestRun>[0]> = {},
) =>
  normalizeTestRun({
    source: SOURCE,
    execution: execution(),
    report,
    workspaceRoot: ROOT,
    sourceFiles: { value: 2, reason: null },
    conformanceFiles: new Set(),
    ...overrides,
  });

describe('normalizeTestRun — case 와 ID', () => {
  const report = parsed({
    files: [
      { file: `${ROOT}/${A}`, error: null },
      { file: `${ROOT}/${B}`, error: null },
    ],
    cases: [
      runnerCase(A, "group 'one' same name"),
      runnerCase(A, "group 'two' same name"),
      runnerCase(A, 'dup'),
      runnerCase(A, 'dup'),
      runnerCase(B, 'same name'),
      runnerCase(B, "group 'one' same name"),
    ],
  });
  const summary = normalize(report);

  it('계약을 통과한다', () => {
    expect(testSummarySchema.parse(summary)).toEqual(summary);
  });

  it('동적으로 확장된 case 는 runner 가 보고한 만큼이고, 같은 이름도 파일이 다르면 다른 ID 다', () => {
    expect(summary.cases.map((testCase) => testCase.id)).toEqual([
      `@berrypjh/react-ui::${A}::group 'one' same name`,
      `@berrypjh/react-ui::${A}::group 'two' same name`,
      `@berrypjh/react-ui::${A}::dup`,
      `@berrypjh/react-ui::${A}::dup#2`,
      `@berrypjh/react-ui::${B}::same name`,
      `@berrypjh/react-ui::${B}::group 'one' same name`,
    ]);
  });

  it('source 파일 수와 report 의 파일·suite·case 수를 따로 둔다', () => {
    expect(summary.counts).toMatchObject({
      sourceFiles: { value: 2, provenance: 'source-scan' },
      reportedFiles: { value: 2, provenance: 'runner-report' },
      suites: { value: 3, provenance: 'runner-report' },
      cases: { value: 6, provenance: 'runner-report' },
    });
  });

  it('경로는 저장소 상대 경로다', () => {
    expect(summary.cases[0].file).toBe(A);
  });

  it('workspace 밖 경로가 섞인 report 는 믿지 않는다', () => {
    const outside = normalize(parsed({ cases: [runnerCase('../etc/x.test.ts', 'x')] }));
    expect(outside).toMatchObject({ report: { status: 'invalid' }, outcome: null, cases: [] });
  });
});

describe('normalizeTestRun — 결과 해석', () => {
  it('프로세스가 실패해도 report 의 count 를 보존하고 fail 이다', () => {
    const summary = normalize(
      parsed({
        files: [{ file: `${ROOT}/${A}`, error: null }],
        cases: [runnerCase(A, 'ok'), runnerCase(A, 'bad', { status: 'failed' })],
      }),
      { execution: execution({ status: 'failed', exitCode: 1 }) },
    );
    expect(summary).toMatchObject({
      outcome: 'fail',
      counts: { passed: { value: 1 }, failed: { value: 1 } },
    });
    expect(summary.outcomeReason).toContain('1 case 실패');
  });

  it('실패 case 없이 0 이 아닌 코드로 끝나면 threshold·실행 오류로 fail 이다 — parser 실패와 다르다', () => {
    const summary = normalize(parsed({ cases: [runnerCase(A, 'ok')] }), {
      execution: execution({ status: 'failed', exitCode: 1 }),
    });
    expect(summary).toMatchObject({ outcome: 'fail', report: { status: 'parsed' } });
    expect(summary.outcomeReason).toContain('threshold');
  });

  it('test 가 없는 파일은 파일 오류로 fail 이고 case 는 0 이다', () => {
    const summary = normalize(
      parsed({
        files: [{ file: `${ROOT}/${A}`, error: 'No test suite found in file' }],
        cases: [],
      }),
      { execution: execution({ status: 'failed', exitCode: 1 }) },
    );
    expect(summary).toMatchObject({ outcome: 'fail', counts: { cases: { value: 0 } } });
    expect(summary.outcomeReason).toContain('No test suite found');
  });

  it('case 가 0 이면 pass 가 아니다 — 분모가 없다', () => {
    const summary = normalize(parsed({ cases: [] }));
    expect(summary).toMatchObject({
      outcome: null,
      counts: { cases: { value: 0, provenance: 'runner-report' } },
    });
  });

  it('깨진 report 는 count 를 만들지 않는다', () => {
    const summary = normalize(
      {
        status: 'corrupt',
        format: 'vitest-json',
        path: 'raw/tests/test.react-ui.json',
        sha256: HASH,
        reason: 'report 가 JSON 이 아니다',
      },
      { execution: execution({ status: 'failed', exitCode: 1 }) },
    );
    expect(testSummarySchema.parse(summary)).toEqual(summary);
    expect(summary).toMatchObject({
      outcome: null,
      cases: [],
      counts: { cases: { value: null }, sourceFiles: { value: 2 } },
    });
  });

  it('timeout 으로 report 가 없으면 count·outcome 이 없다', () => {
    const summary = normalize(
      {
        status: 'missing',
        format: 'vitest-json',
        path: null,
        sha256: null,
        reason: 'timeout 으로 report 가 쓰이지 않았다',
      },
      { execution: execution({ status: 'timeout', exitCode: null, reason: '600000ms 초과' }) },
    );
    expect(testSummarySchema.parse(summary)).toMatchObject({
      execution: { status: 'timeout' },
      outcome: null,
    });
  });

  it('report 없는 cache 복원은 새 측정이 아니다', () => {
    const summary = normalize(
      {
        status: 'missing',
        format: 'vitest-json',
        path: null,
        sha256: null,
        reason: 'Nx 가 cache 에서 복원해 report 가 없다',
      },
      { execution: execution({ cache: 'restored' }) },
    );
    expect(testSummarySchema.parse(summary)).toMatchObject({
      cache: 'restored',
      outcome: null,
      counts: { cases: { value: null } },
    });
  });

  it('skip·todo·retry 를 case 상태로 센다', () => {
    const summary = normalize(
      parsed({
        cases: [
          runnerCase(A, 'flaky', {
            attempts: { value: 2, provenance: 'derived-from-report' },
            durationMs: 3,
          }),
          runnerCase(A, 'skip', {
            status: 'skipped',
            attempts: { value: 0, provenance: 'derived-from-report' },
            durationMs: null,
          }),
          runnerCase(A, 'todo', {
            status: 'todo',
            attempts: { value: 0, provenance: 'derived-from-report' },
            durationMs: null,
          }),
        ],
      }),
    );
    expect(summary.counts).toMatchObject({
      passed: { value: 1 },
      skipped: { value: 1 },
      todo: { value: 1 },
      retriedCases: { value: 1, provenance: 'derived-from-report' },
      attempts: { value: 2, provenance: 'derived-from-report' },
    });
    expect(summary.durations).toEqual({
      wallMs: { value: 4100, provenance: 'collector-clock', reason: null },
      caseSumMs: { value: 3, provenance: 'derived-from-report', reason: null },
    });
  });

  it('runner 가 시도 수를 보고하지 않으면 retry 는 null 이다', () => {
    const summary = normalize(parsed({ cases: [runnerCase(A, 'ok', { attempts: null })] }));
    expect(summary.counts.attempts).toMatchObject({ value: null });
    expect(summary.counts.retriedCases).toMatchObject({ value: null });
  });

  it('coverage 를 주지 않으면 null 이 아니라 이유 있는 not-measured 다', () => {
    expect(normalize(parsed({ cases: [runnerCase(A, 'ok')] })).coverage).toEqual({
      status: 'not-measured',
      reason: 'coverage 를 요청하지 않았다',
    });
  });
});

describe('normalizeTestRun — layer', () => {
  it('describeConformance 파일의 component API case 만 conformance 이고 나머지는 unknown 이다', () => {
    const summary = normalize(
      parsed({
        cases: [
          runnerCase(A, '<Button /> component API ref', {
            ancestors: ['<Button />', 'component API'],
          }),
          runnerCase(A, '<Button /> loading spinner', { ancestors: ['<Button />', 'loading'] }),
          runnerCase(B, '<Other /> component API ref', {
            ancestors: ['<Other />', 'component API'],
          }),
        ],
      }),
      { conformanceFiles: new Set([A]) },
    );
    expect(summary.cases.map((testCase) => [testCase.layer, testCase.layerEvidence])).toEqual([
      [
        'conformance',
        `${A} 가 describeConformance 를 import 하고 ancestor 'component API' 아래에 있다`,
      ],
      ['unknown', null],
      ['unknown', null],
    ]);
  });

  it('case 이름의 제어 문자를 지운다', () => {
    const summary = normalize(
      parsed({ cases: [runnerCase(A, `bad${String.fromCharCode(27)}[31mname`)] }),
    );
    expect(summary.cases[0].fullName).not.toMatch(/\p{Cc}/u);
  });
});
