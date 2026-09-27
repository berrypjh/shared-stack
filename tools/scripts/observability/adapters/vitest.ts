import { z } from 'zod';

import { parseReport, type RunnerReport } from './report';

const caseSchema = z.looseObject({
  title: z.string(),
  status: z.enum(['passed', 'failed', 'skipped', 'todo']),
});

const reportSchema = z.looseObject({
  testResults: z.array(
    z.looseObject({ name: z.string().min(1), assertionResults: z.array(caseSchema) }),
  ),
});

/** `vitest run --reporter=json --outputFile=<path>` 의 case 결과. */
export const parseVitestReport = (text: string): RunnerReport => {
  const report = parseReport(text, reportSchema, 'vitest-json');
  return {
    cases: report.testResults.flatMap((file) =>
      file.assertionResults.map((testCase) => ({
        file: file.name,
        title: testCase.title,
        status: testCase.status,
      })),
    ),
  };
};
