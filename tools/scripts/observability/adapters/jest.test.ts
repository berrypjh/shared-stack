import { describe, expect, it } from 'vitest';

import { parseJestReport } from './jest';
import { ReportParseError } from './report';

const testCase = (overrides: Record<string, unknown>) => ({
  ancestorTitles: ['루트'],
  title: 'View 래퍼로 앵커를 감싼다',
  fullName: '루트 View 래퍼로 앵커를 감싼다',
  status: 'passed',
  duration: 382,
  failureDetails: [],
  failureMessages: [],
  invocations: 1,
  location: null,
  numPassingAsserts: 2,
  retryReasons: [],
  ...overrides,
});

const suite = (name: string, assertionResults: unknown[], extra: Record<string, unknown> = {}) => ({
  name,
  status: 'passed',
  message: '',
  summary: '',
  startTime: 1,
  endTime: 2,
  assertionResults,
  ...extra,
});

/** jest 29.7.0 `--json` 의 실제 모양을 줄인 것 (react-native-ui). */
const REPORT = {
  numTotalTestSuites: 3,
  numRuntimeErrorTestSuites: 1,
  numTotalTests: 4,
  success: false,
  wasInterrupted: false,
  testResults: [
    suite('/ws/libs/react-native-ui/src/components/badge/Badge.test.tsx', [
      testCase({}),
      testCase({
        title: 'retried',
        fullName: '루트 retried',
        invocations: 3,
        retryReasons: ['e1', 'e2'],
      }),
      testCase({
        title: 'pending',
        fullName: '루트 pending',
        status: 'pending',
        duration: null,
        invocations: undefined,
      }),
      testCase({
        title: 'todo',
        fullName: '루트 todo',
        status: 'todo',
        duration: null,
        invocations: undefined,
      }),
    ]),
    suite(
      '/ws/libs/react-native-ui/src/components/chip/Chip.test.tsx',
      [testCase({ status: 'failed', failureMessages: ['boom'] })],
      {
        status: 'failed',
      },
    ),
    suite('/ws/libs/react-native-ui/src/broken.test.tsx', [], {
      status: 'failed',
      message: 'Test suite failed to run\n\nCannot find module',
    }),
  ],
};

describe('parseJestReport', () => {
  const report = parseJestReport(JSON.stringify(REPORT));

  it('status 를 공통 어휘로 옮긴다 — pending 은 skipped', () => {
    expect(report.cases.map((c) => c.status)).toEqual([
      'passed',
      'passed',
      'skipped',
      'todo',
      'failed',
    ]);
  });

  it('jest 는 시도 수를 직접 보고한다', () => {
    expect(report.cases[0].attempts).toEqual({ value: 1, provenance: 'runner-report' });
    expect(report.cases[1].attempts).toEqual({ value: 3, provenance: 'runner-report' });
    expect(report.cases[2].attempts).toEqual({ value: 0, provenance: 'derived-from-report' });
  });

  it('suite 수는 runner 가 보고한 값이다 (jest 는 파일 단위)', () => {
    expect(report.suites).toBe(3);
  });

  it('실행하지 못한 suite 는 파일 오류로 남는다', () => {
    expect(report.files[2]).toEqual({
      file: '/ws/libs/react-native-ui/src/broken.test.tsx',
      error: 'Test suite failed to run\n\nCannot find module',
    });
    expect(report.files[1].error).toBeNull();
  });

  it('중단된 실행을 표시한다', () => {
    expect(report.interrupted).toBe(false);
    expect(parseJestReport(JSON.stringify({ ...REPORT, wasInterrupted: true })).interrupted).toBe(
      true,
    );
  });

  it('JSON 이 아니면 corrupt, 모양이 다르면 invalid', () => {
    const kind = (text: string) => {
      try {
        parseJestReport(text);
        return 'ok';
      } catch (error) {
        return error instanceof ReportParseError ? error.kind : String(error);
      }
    };
    expect(kind('not json')).toBe('corrupt');
    expect(kind(JSON.stringify({ testResults: 'x' }))).toBe('invalid');
  });
});
