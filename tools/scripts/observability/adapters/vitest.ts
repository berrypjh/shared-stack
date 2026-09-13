import { z } from 'zod';

import { parseReport, type ReportedCount, type RunnerReport } from './report';

const caseSchema = z.looseObject({
  ancestorTitles: z.array(z.string()),
  title: z.string(),
  fullName: z.string(),
  status: z.enum(['passed', 'failed', 'skipped', 'todo']),
  duration: z.number().nonnegative().nullable().optional(),
  failureMessages: z.array(z.string()),
});

const fileSchema = z.looseObject({
  name: z.string().min(1),
  status: z.string(),
  message: z.string(),
  assertionResults: z.array(caseSchema),
});

const reportSchema = z.looseObject({
  numTotalTestSuites: z.number().int().nonnegative(),
  testResults: z.array(fileSchema),
});

/**
 * vitest JSON 에는 retry 필드가 없다. 실패한 시도마다 `failureMessages` 에 메시지가 하나씩
 * 쌓이므로 (retry=2 probe 로 확인) 거기서 파생한다 — runner 가 직접 센 값이 아니다.
 */
const attemptsOf = (testCase: z.infer<typeof caseSchema>): ReportedCount => {
  const failures = testCase.failureMessages.length;
  const value =
    testCase.status === 'skipped' || testCase.status === 'todo'
      ? 0
      : testCase.status === 'passed'
        ? failures + 1
        : Math.max(1, failures);
  return { value, provenance: 'derived-from-report' };
};

/** `vitest run --reporter=json --outputFile=<path>` 의 결과. */
export const parseVitestReport = (text: string): RunnerReport => {
  const report = parseReport(text, reportSchema, 'vitest-json');
  return {
    format: 'vitest-json',
    suites: report.numTotalTestSuites,
    files: report.testResults.map((file) => ({
      file: file.name,
      error: file.status === 'failed' && file.message ? file.message : null,
    })),
    cases: report.testResults.flatMap((file) =>
      file.assertionResults.map((testCase) => ({
        file: file.name,
        ancestors: testCase.ancestorTitles,
        title: testCase.title,
        fullName: testCase.fullName,
        status: testCase.status,
        attempts: attemptsOf(testCase),
        durationMs: testCase.duration ?? null,
      })),
    ),
    errors: [],
    interrupted: false,
  };
};
