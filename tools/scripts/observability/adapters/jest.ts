import { z } from 'zod';

import { type CaseStatus, parseReport, type ReportedCount, type RunnerReport } from './report';

const STATUS = {
  passed: 'passed',
  failed: 'failed',
  pending: 'skipped',
  skipped: 'skipped',
  disabled: 'skipped',
  todo: 'todo',
} as const satisfies Record<string, CaseStatus>;

const caseSchema = z.looseObject({
  ancestorTitles: z.array(z.string()),
  title: z.string(),
  fullName: z.string(),
  status: z.enum(['passed', 'failed', 'pending', 'skipped', 'disabled', 'todo']),
  duration: z.number().nonnegative().nullable().optional(),
  invocations: z.number().int().nonnegative().optional(),
});

const suiteSchema = z.looseObject({
  name: z.string().min(1),
  status: z.string(),
  message: z.string(),
  assertionResults: z.array(caseSchema),
});

const reportSchema = z.looseObject({
  numTotalTestSuites: z.number().int().nonnegative(),
  wasInterrupted: z.boolean().optional(),
  testResults: z.array(suiteSchema),
});

/** jest 는 `invocations` 로 시도 수를 직접 보고한다. 실행하지 않은 case 는 0 이다. */
const attemptsOf = (testCase: z.infer<typeof caseSchema>): ReportedCount | null => {
  const status = STATUS[testCase.status];
  if (status === 'skipped' || status === 'todo')
    return { value: 0, provenance: 'derived-from-report' };
  return testCase.invocations === undefined
    ? null
    : { value: testCase.invocations, provenance: 'runner-report' };
};

/**
 * `jest --json --outputFile=<path>` 의 결과. jest 의 suite 는 파일 단위다.
 * assertion 없이 실패한 suite 만 파일 오류로 본다 — 실패한 case 가 있는 suite 의 `message` 는
 * case 실패 출력을 모은 것이지 실행 실패가 아니다.
 */
export const parseJestReport = (text: string): RunnerReport => {
  const report = parseReport(text, reportSchema, 'jest-json');
  return {
    format: 'jest-json',
    suites: report.numTotalTestSuites,
    files: report.testResults.map((suite) => ({
      file: suite.name,
      error:
        suite.status === 'failed' && suite.assertionResults.length === 0
          ? suite.message || 'test suite failed to run'
          : null,
    })),
    cases: report.testResults.flatMap((suite) =>
      suite.assertionResults.map((testCase) => ({
        file: suite.name,
        ancestors: testCase.ancestorTitles,
        title: testCase.title,
        fullName: testCase.fullName,
        status: STATUS[testCase.status],
        attempts: attemptsOf(testCase),
        durationMs: testCase.duration ?? null,
      })),
    ),
    errors: [],
    interrupted: report.wasInterrupted === true,
  };
};
