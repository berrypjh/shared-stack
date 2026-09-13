import { z } from 'zod';

import { parseReport, type RunnerCase, type RunnerReport } from './report';

/** test 의 최종 결과 (`test.outcome()`). flaky 는 retry 끝에 통과한 것이다. */
const STATUS = {
  expected: 'passed',
  flaky: 'passed',
  unexpected: 'failed',
  skipped: 'skipped',
} as const;

const resultSchema = z.looseObject({
  status: z.enum(['passed', 'failed', 'timedOut', 'skipped', 'interrupted']),
  retry: z.number().int().nonnegative(),
  duration: z.number().nonnegative(),
});

const testSchema = z.looseObject({
  projectName: z.string(),
  status: z.enum(['expected', 'unexpected', 'flaky', 'skipped']),
  results: z.array(resultSchema),
});

const specSchema = z.looseObject({
  title: z.string(),
  file: z.string().min(1),
  tests: z.array(testSchema),
});

const suiteSchema = z.looseObject({
  title: z.string(),
  file: z.string(),
  specs: z.array(specSchema).optional(),
  get suites(): z.ZodOptional<z.ZodArray<typeof suiteSchema>> {
    return z.array(suiteSchema).optional();
  },
});

const reportSchema = z.looseObject({
  stats: z.looseObject({
    expected: z.number().int().nonnegative(),
    unexpected: z.number().int().nonnegative(),
    flaky: z.number().int().nonnegative(),
    skipped: z.number().int().nonnegative(),
  }),
  errors: z.array(z.looseObject({ message: z.string().optional() })),
  suites: z.array(suiteSchema),
});

type Suite = z.infer<typeof suiteSchema>;
type Spec = z.infer<typeof specSchema>;
type Test = z.infer<typeof testSchema>;

const toCase = (spec: Spec, test: Test, titles: string[]): RunnerCase => ({
  file: spec.file,
  ancestors: titles,
  title: spec.title,
  fullName: `${[...titles, spec.title].join(' › ')} [${test.projectName}]`,
  status: STATUS[test.status],
  attempts: { value: test.results.length, provenance: 'runner-report' },
  durationMs:
    test.results.length === 0
      ? null
      : test.results.reduce((sum, result) => sum + result.duration, 0),
});

/** 최상위 suite 는 파일이라 이름에 넣지 않는다. */
const casesOf = (suite: Suite, titles: string[]): RunnerCase[] => [
  ...(suite.specs ?? []).flatMap((spec) => spec.tests.map((test) => toCase(spec, test, titles))),
  ...(suite.suites ?? []).flatMap((child) => casesOf(child, [...titles, child.title])),
];

/** `PLAYWRIGHT_JSON_OUTPUT_FILE=<path> playwright test --reporter=json` 의 결과. */
export const parsePlaywrightReport = (text: string): RunnerReport => {
  const report = parseReport(text, reportSchema, 'playwright-json');
  const suites = report.suites as Suite[];
  const cases = suites.flatMap((suite) => casesOf(suite, []));
  const results = suites.flatMap(function collect(suite: Suite): z.infer<typeof resultSchema>[] {
    return [
      ...(suite.specs ?? []).flatMap((spec) => spec.tests.flatMap((test) => test.results)),
      ...(suite.suites ?? []).flatMap(collect),
    ];
  });
  return {
    format: 'playwright-json',
    suites: null,
    files: [...new Set(cases.map((testCase) => testCase.file))].map((file) => ({
      file,
      error: null,
    })),
    cases,
    errors: report.errors.map((error) => error.message ?? 'unknown playwright error'),
    interrupted: results.some((result) => result.status === 'interrupted'),
  };
};
