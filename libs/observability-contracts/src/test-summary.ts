import { z } from 'zod';

import { containsSecret, excerptSchema } from './evidence.js';
import {
  commandIdSchema,
  countSchema,
  nonNegativeSchema,
  orUnknown,
  reasonSchema,
  relativePathSchema,
  scopeSchema,
  sha256Schema,
} from './primitives.js';

export const TEST_RUNNERS = ['vitest', 'jest', 'playwright'] as const;

/** Nx project 인지, Nx affected 가 닿지 않는 독립 영역(`tools/`)인지. */
export const TEST_AREAS = ['nx-project', 'tools'] as const;

/** 프로세스 수준 상태. case 의 skip·todo·retry 는 여기가 아니라 case 상태다. */
export const EXECUTION_STATUSES = [
  'completed',
  'failed',
  'timeout',
  'cancelled',
  'imported',
  'not-run',
  'unsupported',
  'unavailable',
] as const;

/** 수집기가 프로세스를 띄우지 않은 상태. exit code 가 없다. */
const WITHOUT_PROCESS = ['imported', 'not-run', 'unsupported', 'unavailable'] as const;

export const CACHE_ORIGINS = ['fresh', 'restored', 'unknown', 'not-applicable'] as const;
export const REPORT_STATUSES = [
  'parsed',
  'missing',
  'corrupt',
  'invalid',
  'not-requested',
] as const;
export const REPORT_FORMATS = ['vitest-json', 'jest-json', 'playwright-json'] as const;
export const CASE_STATUSES = ['passed', 'failed', 'skipped', 'todo'] as const;
export const TEST_LAYERS = [
  'unit',
  'component',
  'conformance',
  'contract',
  'integration',
  'e2e',
  'unknown',
] as const;
export const COVERAGE_PROVIDERS = ['v8', 'istanbul', 'babel'] as const;

/**
 * 숫자가 어디서 왔는지.
 * - `runner-report`: runner 가 쓴 report 필드 그대로
 * - `derived-from-report`: report 필드에서 계산 (예: vitest 의 retry 횟수)
 * - `source-scan`: 저장소 파일 목록 — case 수가 아니다
 * - `collector-clock`: 수집기가 잰 프로세스 시간
 */
export const COUNT_PROVENANCES = [
  'runner-report',
  'derived-from-report',
  'source-scan',
  'collector-clock',
] as const;

const FROM_REPORT: readonly string[] = ['runner-report', 'derived-from-report'];

const measured = <T extends z.ZodType>(value: T) =>
  z.union([
    z.strictObject({ value, provenance: z.enum(COUNT_PROVENANCES), reason: z.null() }),
    z.strictObject({ value: z.null(), provenance: z.null(), reason: reasonSchema }),
  ]);

const measuredCountSchema = measured(countSchema);
const measuredDurationSchema = measured(nonNegativeSchema);

/** 사람이 읽는 test 이름·ID. 제어 문자와 credential 형태를 담지 않는다. */
export const safeText = (max: number) =>
  z
    .string()
    .min(1)
    .max(max)
    .refine((text) => !/\p{Cc}/u.test(text), 'contains control characters')
    .refine((text) => !containsSecret(text), 'contains credential-like text');

export const testCaseSchema = z
  .strictObject({
    /** `project::file::fullName` (같은 파일 안 중복은 `#n`). 이중 집계를 막는 안정 ID. */
    id: safeText(1200),
    file: relativePathSchema,
    fullName: safeText(500),
    status: z.enum(CASE_STATUSES),
    attempts: measuredCountSchema,
    durationMs: nonNegativeSchema.nullable(),
    layer: z.enum(TEST_LAYERS),
    layerEvidence: z.string().min(1).max(300).nullable(),
  })
  .superRefine((testCase, ctx) => {
    if ((testCase.layer === 'unknown') !== (testCase.layerEvidence === null)) {
      ctx.addIssue({
        code: 'custom',
        path: ['layerEvidence'],
        message: 'a layer needs evidence; unknown has none',
      });
    }
  });

const executionSchema = z
  .strictObject({
    status: z.enum(EXECUTION_STATUSES),
    commandId: commandIdSchema,
    exitCode: z.number().int().nullable(),
    timeoutMs: countSchema.nullable(),
    excerpt: excerptSchema.nullable(),
    reason: reasonSchema.nullable(),
  })
  .superRefine((execution, ctx) => {
    const issue = executionIssue(execution);
    if (issue) ctx.addIssue({ code: 'custom', path: ['status'], message: issue });
  });

const executionIssue = (execution: {
  status: (typeof EXECUTION_STATUSES)[number];
  exitCode: number | null;
  reason: string | null;
}): string | null => {
  const { status, exitCode, reason } = execution;
  if (status === 'completed') return exitCode === 0 ? null : 'completed means exit code 0';
  if (status === 'failed')
    return exitCode !== null && exitCode !== 0 ? null : 'failed needs a non-zero exit code';
  if (reason === null) return `${status} needs a reason`;
  if ((WITHOUT_PROCESS as readonly string[]).includes(status) && exitCode !== null) {
    return `${status} has no exit code`;
  }
  return null;
};

const reportSchema = z.union([
  z.strictObject({
    status: z.literal('parsed'),
    format: z.enum(REPORT_FORMATS),
    path: relativePathSchema,
    sha256: sha256Schema,
    reason: z.null(),
  }),
  z.strictObject({
    status: z.enum(['missing', 'corrupt', 'invalid', 'not-requested']),
    format: z.enum(REPORT_FORMATS).nullable(),
    path: relativePathSchema.nullable(),
    sha256: sha256Schema.nullable(),
    reason: reasonSchema,
  }),
]);

const coverageMetricSchema = z
  .strictObject({ covered: countSchema, total: countSchema })
  .refine((metric) => metric.covered <= metric.total, 'covered cannot exceed total');

/** coverage 는 요청했을 때만 있다. 없으면 null 이 아니라 이유가 있는 not-measured 다. */
export const coverageSchema = z.discriminatedUnion('status', [
  z.strictObject({ status: z.literal('not-measured'), reason: reasonSchema }),
  z.strictObject({
    status: z.literal('measured'),
    provider: z.enum(COVERAGE_PROVIDERS),
    reportPath: relativePathSchema,
    lines: coverageMetricSchema,
    statements: coverageMetricSchema,
    functions: coverageMetricSchema,
    branches: coverageMetricSchema,
  }),
]);

const REPORT_COUNT_KEYS = [
  'reportedFiles',
  'suites',
  'cases',
  'passed',
  'failed',
  'skipped',
  'todo',
  'retriedCases',
  'attempts',
] as const;

const testSummaryObjectSchema = z.strictObject({
  /** `runner:project`. RN Jest 와 eval 의 RN fixture 처럼 성격이 다른 결과는 다른 source 다. */
  sourceId: z.string().regex(/^[a-z0-9]+:[@\w./-]{1,120}$/, 'source id: runner:project'),
  area: z.enum(TEST_AREAS),
  project: scopeSchema,
  runner: z.enum(TEST_RUNNERS),
  runnerVersion: orUnknown(z.string().min(1).max(64)),
  execution: executionSchema,
  cache: z.enum(CACHE_ORIGINS),
  report: reportSchema,
  scope: z.strictObject({
    include: z.array(z.string().min(1).max(300)),
    includeHash: orUnknown(sha256Schema),
    selectedProjects: z.array(scopeSchema),
  }),
  counts: z.strictObject({
    /** 저장소의 test 파일 수. runner 가 실행한 case 수와 섞지 않는다. */
    sourceFiles: measuredCountSchema,
    reportedFiles: measuredCountSchema,
    suites: measuredCountSchema,
    cases: measuredCountSchema,
    passed: measuredCountSchema,
    failed: measuredCountSchema,
    skipped: measuredCountSchema,
    todo: measuredCountSchema,
    retriedCases: measuredCountSchema,
    attempts: measuredCountSchema,
  }),
  durations: z.strictObject({
    /** 프로세스 전체 시간. case 시간의 합과 다르다. */
    wallMs: measuredDurationSchema,
    caseSumMs: measuredDurationSchema,
  }),
  coverage: coverageSchema,
  outcome: z.enum(['pass', 'fail']).nullable(),
  outcomeReason: reasonSchema,
  cases: z.array(testCaseSchema).max(50000),
});

type TestSummaryShape = z.infer<typeof testSummaryObjectSchema>;
type Issue = { path: (string | number)[]; message: string };

/** 각 숫자가 자기 출처에서만 오는지. */
const provenanceIssues = (summary: TestSummaryShape): Issue[] => {
  const issues: Issue[] = [];
  const parsed = summary.report.status === 'parsed';
  const { sourceFiles } = summary.counts;
  if (sourceFiles.provenance !== null && sourceFiles.provenance !== 'source-scan') {
    issues.push({
      path: ['counts', 'sourceFiles'],
      message: 'source file count comes from a source scan',
    });
  }
  for (const key of REPORT_COUNT_KEYS) {
    const count = summary.counts[key];
    if (count.provenance !== null && !FROM_REPORT.includes(count.provenance)) {
      issues.push({ path: ['counts', key], message: `${key} comes from the runner report` });
    }
    if (!parsed && count.value !== null) {
      issues.push({ path: ['counts', key], message: `${key} needs a parsed report` });
    }
  }
  const { wallMs, caseSumMs } = summary.durations;
  if (wallMs.provenance !== null && wallMs.provenance !== 'collector-clock') {
    issues.push({
      path: ['durations', 'wallMs'],
      message: 'wall time comes from the collector clock',
    });
  }
  if (caseSumMs.provenance !== null && !FROM_REPORT.includes(caseSumMs.provenance)) {
    issues.push({
      path: ['durations', 'caseSumMs'],
      message: 'case durations come from the runner report',
    });
  }
  if (!parsed && caseSumMs.value !== null) {
    issues.push({
      path: ['durations', 'caseSumMs'],
      message: 'case durations need a parsed report',
    });
  }
  return issues;
};

/** report 가 없으면 결과도 없다. cache 복원·미실행은 새 report 를 만들지 않는다. */
const reportIssues = (summary: TestSummaryShape): Issue[] => {
  const issues: Issue[] = [];
  const parsed = summary.report.status === 'parsed';
  if (!parsed && summary.cases.length > 0)
    issues.push({ path: ['cases'], message: 'cases need a parsed report' });
  if (!parsed && summary.outcome !== null) {
    issues.push({ path: ['outcome'], message: 'without a parsed report there is no outcome' });
  }
  if (parsed && summary.cache === 'restored') {
    issues.push({ path: ['report'], message: 'a restored cache entry did not write a new report' });
  }
  if (parsed && ['not-run', 'unsupported', 'unavailable'].includes(summary.execution.status)) {
    issues.push({
      path: ['report'],
      message: `${summary.execution.status} cannot have a parsed report`,
    });
  }
  return issues;
};

/** case 배열과 count 가 같은 사실을 말하는지. 같은 ID 는 이중 집계다. */
const caseIssues = (summary: TestSummaryShape): Issue[] => {
  const issues: Issue[] = [];
  const byStatus = { passed: 0, failed: 0, skipped: 0, todo: 0 };
  const ids = new Set<string>();
  summary.cases.forEach((testCase, index) => {
    byStatus[testCase.status] += 1;
    if (ids.has(testCase.id))
      issues.push({ path: ['cases', index, 'id'], message: `duplicate case id ${testCase.id}` });
    ids.add(testCase.id);
  });
  if (summary.report.status !== 'parsed') return issues;
  const { cases } = summary.counts;
  if (cases.value !== null && cases.value !== summary.cases.length) {
    issues.push({ path: ['counts', 'cases'], message: 'case count must equal the reported cases' });
  }
  for (const status of CASE_STATUSES) {
    const { value } = summary.counts[status];
    if (value !== null && value !== byStatus[status]) {
      issues.push({
        path: ['counts', status],
        message: `${status} count must equal cases with that status`,
      });
    }
  }
  return issues;
};

/** pass 는 실행이 끝났고, 실패가 0 이고, 실제로 case 가 있을 때만이다. */
const outcomeIssues = (summary: TestSummaryShape): Issue[] => {
  if (summary.outcome !== 'pass') return [];
  const issues: Issue[] = [];
  if (summary.execution.status !== 'completed' && summary.execution.status !== 'imported') {
    issues.push({ path: ['outcome'], message: 'pass needs a completed execution' });
  }
  if (summary.counts.failed.value !== 0)
    issues.push({ path: ['outcome'], message: 'pass needs zero failed cases' });
  if (!summary.counts.cases.value)
    issues.push({ path: ['outcome'], message: 'zero reported cases cannot pass' });
  return issues;
};

export const testSummarySchema = testSummaryObjectSchema.superRefine((summary, ctx) => {
  const issues = [
    ...provenanceIssues(summary),
    ...reportIssues(summary),
    ...caseIssues(summary),
    ...outcomeIssues(summary),
  ];
  for (const issue of issues) ctx.addIssue({ code: 'custom', ...issue });
});

export type TestCase = z.infer<typeof testCaseSchema>;
export type TestSummary = z.infer<typeof testSummarySchema>;
export type Coverage = z.infer<typeof coverageSchema>;
export type MeasuredCount = z.infer<typeof measuredCountSchema>;
