import { describe, expect, it } from 'vitest';

import { ReportParseError } from './report';
import { parseVitestReport } from './vitest';

const file = (name: string, assertionResults: unknown[], extra: Record<string, unknown> = {}) => ({
  name,
  status: 'passed',
  message: '',
  startTime: 1,
  endTime: 2,
  assertionResults,
  ...extra,
});

const testCase = (overrides: Record<string, unknown>) => ({
  ancestorTitles: [],
  title: 'case',
  fullName: 'case',
  status: 'passed',
  duration: 1,
  failureMessages: [],
  meta: {},
  ...overrides,
});

/** vitest 4.0.17 `--reporter=json` 의 실제 모양을 줄인 것 (retry=2 probe). */
const PROBE = {
  numTotalTestSuites: 5,
  numPassedTests: 4,
  numFailedTests: 1,
  numPendingTests: 1,
  numTodoTests: 1,
  success: false,
  testResults: [
    file(
      '/ws/a/cases.test.ts',
      [
        testCase({
          ancestorTitles: ["group 'one'"],
          title: 'same name',
          fullName: "group 'one' same name",
        }),
        testCase({
          ancestorTitles: ["group 'two'"],
          title: 'same name',
          fullName: "group 'two' same name",
        }),
        testCase({
          title: 'skipped case',
          fullName: 'skipped case',
          status: 'skipped',
          duration: undefined,
        }),
        testCase({
          title: 'todo case',
          fullName: 'todo case',
          status: 'todo',
          duration: undefined,
        }),
        testCase({
          title: 'flaky',
          fullName: 'flaky',
          failureMessages: ['AssertionError: expected 1 to be greater than 1'],
        }),
        testCase({
          title: 'fails',
          fullName: 'fails',
          status: 'failed',
          failureMessages: ['e1', 'e2', 'e3'],
        }),
      ],
      { status: 'failed' },
    ),
    file('/ws/b/cases.test.ts', [testCase({ title: 'same name', fullName: 'same name' })]),
    file('/ws/b/empty.test.ts', [], {
      status: 'failed',
      message: 'No test suite found in file /ws/b/empty.test.ts',
    }),
  ],
};

describe('parseVitestReport', () => {
  const report = parseVitestReport(JSON.stringify(PROBE));

  it('case 는 report 의 assertion 결과 그대로다 — describe.each 확장도 runner 가 센 만큼', () => {
    expect(report.cases.map((c) => [c.file, c.title, c.status])).toEqual([
      ['/ws/a/cases.test.ts', 'same name', 'passed'],
      ['/ws/a/cases.test.ts', 'same name', 'passed'],
      ['/ws/a/cases.test.ts', 'skipped case', 'skipped'],
      ['/ws/a/cases.test.ts', 'todo case', 'todo'],
      ['/ws/a/cases.test.ts', 'flaky', 'passed'],
      ['/ws/a/cases.test.ts', 'fails', 'failed'],
      ['/ws/b/cases.test.ts', 'same name', 'passed'],
    ]);
  });

  it('test 가 없는 파일은 case 를 남기지 않는다', () => {
    expect(report.cases.some((c) => c.file === '/ws/b/empty.test.ts')).toBe(false);
  });

  it('assertion 이 없어도 빈 report 는 유효하다', () => {
    const empty = parseVitestReport(
      JSON.stringify({ ...PROBE, numTotalTestSuites: 0, testResults: [] }),
    );
    expect(empty).toEqual({ cases: [] });
  });

  it('JSON 이 아니면 corrupt, 모양이 다르면 invalid', () => {
    const kind = (text: string) => {
      try {
        parseVitestReport(text);
        return 'ok';
      } catch (error) {
        return error instanceof ReportParseError ? error.kind : String(error);
      }
    };
    expect(kind('{"testResults": [')).toBe('corrupt');
    expect(kind('{}')).toBe('invalid');
    expect(
      kind(
        JSON.stringify({
          ...PROBE,
          testResults: [file('/ws/x.test.ts', [testCase({ status: 'pending!' })])],
        }),
      ),
    ).toBe('invalid');
  });
});
