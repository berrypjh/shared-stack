import path from 'node:path';

import {
  type CACHE_ORIGINS,
  type Coverage,
  type EXECUTION_STATUSES,
  isSafeRelativePath,
  sanitizeExcerpt,
  type TestSummary,
  testSummarySchema,
} from '@berrypjh/observability-contracts';

import type { ReportFormat, RunnerCase, RunnerReport } from '../adapters/report';

export type TestSource = {
  /** `runner:project`. 같은 project 라도 runner 가 다르면 다른 source 다. */
  sourceId: string;
  area: 'nx-project' | 'tools';
  project: string;
  runner: 'vitest' | 'jest' | 'playwright';
  runnerVersion: string;
  commandId: string;
  include: string[];
  includeHash: string;
  selectedProjects: string[];
  /** report 가 상대 경로로 파일을 적는 runner(playwright)의 기준 디렉터리. */
  fileBase?: string;
};

export type ExecutionRecord = {
  status: (typeof EXECUTION_STATUSES)[number];
  exitCode: number | null;
  timeoutMs: number | null;
  wallMs: number | null;
  excerpt: string | null;
  reason: string | null;
  cache: (typeof CACHE_ORIGINS)[number];
};

export type ReportInput =
  | { status: 'parsed'; path: string; sha256: string; report: RunnerReport }
  | {
      status: 'missing' | 'corrupt' | 'invalid' | 'not-requested';
      format: ReportFormat | null;
      path: string | null;
      sha256: string | null;
      reason: string;
    };

type NormalizeInput = {
  source: TestSource;
  execution: ExecutionRecord;
  report: ReportInput;
  workspaceRoot: string;
  sourceFiles: { value: number | null; reason: string | null };
  /** describeConformance 를 import 하는 파일 (parse-only scan 결과). */
  conformanceFiles: Set<string>;
  coverage?: Coverage;
};

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
];
const CONFORMANCE_ANCESTOR = 'component API';
const NOT_MEASURED: Coverage = { status: 'not-measured', reason: 'coverage 를 요청하지 않았다' };

const counted = (value: number, provenance = 'runner-report') => ({
  value,
  provenance,
  reason: null,
});
const notCounted = (reason: string) => ({ value: null, provenance: null, reason });
const reasonText = (text: string) => sanitizeExcerpt(text, 450);

/** report 경로를 저장소 상대 경로로. 저장소 밖이면 null. */
const toWorkspacePath = (workspaceRoot: string, file: string, fileBase?: string): string | null => {
  const relative = path.isAbsolute(file)
    ? path.relative(workspaceRoot, file)
    : path.join(fileBase ?? '', file);
  const posix = relative.split(path.sep).join('/');
  return isSafeRelativePath(posix) ? posix : null;
};

/** 제어 문자·ANSI·credential 형태를 지운 표시용 이름. */
const displayName = (text: string) =>
  sanitizeExcerpt(text)
    .replace(/\p{Cc}/gu, ' ')
    .trim() || '(이름 없음)';

const layerOf = (file: string, ancestors: string[], conformanceFiles: Set<string>) => {
  if (/^apps\/[^/]+-e2e\//.test(file))
    return { layer: 'e2e', layerEvidence: `${file} 가 e2e project 안에 있다` };
  if (conformanceFiles.has(file) && ancestors.includes(CONFORMANCE_ANCESTOR)) {
    return {
      layer: 'conformance',
      layerEvidence: `${file} 가 describeConformance 를 import 하고 ancestor '${CONFORMANCE_ANCESTOR}' 아래에 있다`,
    };
  }
  return { layer: 'unknown', layerEvidence: null };
};

const toCases = (input: NormalizeInput, runnerCases: RunnerCase[]) => {
  const seen = new Map<string, number>();
  return runnerCases.map((runnerCase) => {
    const file = toWorkspacePath(
      input.workspaceRoot,
      runnerCase.file,
      input.source.fileBase,
    ) as string;
    const fullName = displayName(runnerCase.fullName);
    const key = `${input.source.project}::${file}::${fullName}`;
    const occurrence = (seen.get(key) ?? 0) + 1;
    seen.set(key, occurrence);
    return {
      id: occurrence === 1 ? key : `${key}#${occurrence}`,
      file,
      fullName,
      status: runnerCase.status,
      attempts: runnerCase.attempts
        ? { ...runnerCase.attempts, reason: null }
        : notCounted('runner 가 시도 수를 보고하지 않았다'),
      durationMs: runnerCase.durationMs,
      ...layerOf(file, runnerCase.ancestors, input.conformanceFiles),
    };
  });
};

/** 시도 수를 모든 case 가 보고했을 때만 합계를 만든다. */
const attemptCounts = (runnerCases: RunnerCase[]) => {
  if (runnerCases.some((runnerCase) => runnerCase.attempts === null)) {
    const reason = 'runner 가 일부 case 의 시도 수를 보고하지 않았다';
    return { attempts: notCounted(reason), retriedCases: notCounted(reason) };
  }
  const provenance = runnerCases.some(
    (runnerCase) => runnerCase.attempts?.provenance === 'derived-from-report',
  )
    ? 'derived-from-report'
    : 'runner-report';
  const values = runnerCases.map((runnerCase) => runnerCase.attempts?.value ?? 0);
  return {
    attempts: counted(
      values.reduce((sum, value) => sum + value, 0),
      provenance,
    ),
    retriedCases: counted(values.filter((value) => value > 1).length, provenance),
  };
};

const outcomeOf = (
  execution: ExecutionRecord,
  report: RunnerReport,
  byStatus: Record<string, number>,
) => {
  const errors = [
    ...report.files.flatMap((file) => (file.error ? [file.error] : [])),
    ...report.errors,
  ];
  if (errors.length > 0 || report.interrupted) {
    return {
      outcome: 'fail',
      outcomeReason: reasonText(
        `실행하지 못한 파일·오류: ${errors.join(' / ') || 'runner 가 실행을 중단했다'}`,
      ),
    };
  }
  if (byStatus.failed > 0)
    return { outcome: 'fail', outcomeReason: `${byStatus.failed} case 실패` };
  if (report.cases.length === 0) return { outcome: null, outcomeReason: 'report 에 case 가 없다' };
  if (['failed', 'timeout', 'cancelled'].includes(execution.status)) {
    return {
      outcome: 'fail',
      outcomeReason: `실패 case 없이 ${execution.status}(exit ${execution.exitCode}) — coverage threshold 나 runner 실행 오류다`,
    };
  }
  return {
    outcome: 'pass',
    outcomeReason: `${report.cases.length} case 중 실패 없음 (skip ${byStatus.skipped}, todo ${byStatus.todo})`,
  };
};

/** 경로가 저장소 밖으로 나가는 report 는 parse 됐어도 믿지 않는다. */
const checkedReport = (input: NormalizeInput): ReportInput => {
  const { report } = input;
  if (report.status !== 'parsed') return report;
  const outside = report.report.cases.some(
    (runnerCase) =>
      toWorkspacePath(input.workspaceRoot, runnerCase.file, input.source.fileBase) === null,
  );
  return outside
    ? {
        status: 'invalid',
        format: report.report.format,
        path: report.path,
        sha256: report.sha256,
        reason: 'report 에 저장소 밖 경로가 있다',
      }
    : report;
};

/**
 * runner 한 번의 실행을 TestSummary 로. count 는 report 에서만, source 파일 수는 scan 에서만,
 * wall time 은 수집기 시계에서만 온다. report 가 없으면 결과를 만들지 않는다.
 */
export const normalizeTestRun = (input: NormalizeInput): TestSummary => {
  const { source, execution } = input;
  const report = checkedReport(input);
  const base = {
    sourceId: source.sourceId,
    area: source.area,
    project: source.project,
    runner: source.runner,
    runnerVersion: source.runnerVersion,
    execution: {
      status: execution.status,
      commandId: source.commandId,
      exitCode: execution.exitCode,
      timeoutMs: execution.timeoutMs,
      excerpt: execution.excerpt === null ? null : sanitizeExcerpt(execution.excerpt),
      reason: execution.reason,
    },
    cache: execution.cache,
    scope: {
      include: source.include,
      includeHash: source.includeHash,
      selectedProjects: source.selectedProjects,
    },
    coverage: input.coverage ?? NOT_MEASURED,
  };
  const sourceFiles =
    input.sourceFiles.value === null
      ? notCounted(input.sourceFiles.reason ?? 'source test 파일을 세지 않았다')
      : counted(input.sourceFiles.value, 'source-scan');
  const wallMs =
    execution.wallMs === null
      ? notCounted(execution.reason ?? '수집기가 프로세스 시간을 재지 않았다')
      : counted(execution.wallMs, 'collector-clock');

  if (report.status !== 'parsed') {
    return testSummarySchema.parse({
      ...base,
      report: {
        status: report.status,
        format: report.format,
        path: report.path,
        sha256: report.sha256,
        reason: report.reason,
      },
      counts: {
        sourceFiles,
        ...Object.fromEntries(REPORT_COUNT_KEYS.map((key) => [key, notCounted(report.reason)])),
      },
      durations: { wallMs, caseSumMs: notCounted(report.reason) },
      outcome: null,
      outcomeReason: reasonText(report.reason),
      cases: [],
    });
  }

  const runnerCases = report.report.cases;
  const byStatus = { passed: 0, failed: 0, skipped: 0, todo: 0 };
  for (const runnerCase of runnerCases) byStatus[runnerCase.status] += 1;
  const durations = runnerCases.flatMap((runnerCase) =>
    runnerCase.durationMs === null ? [] : [runnerCase.durationMs],
  );

  return testSummarySchema.parse({
    ...base,
    report: {
      status: 'parsed',
      format: report.report.format,
      path: report.path,
      sha256: report.sha256,
      reason: null,
    },
    counts: {
      sourceFiles,
      reportedFiles: counted(report.report.files.length),
      suites:
        report.report.suites === null
          ? notCounted(`${source.runner} 는 suite 수를 보고하지 않는다`)
          : counted(report.report.suites),
      cases: counted(runnerCases.length),
      passed: counted(byStatus.passed),
      failed: counted(byStatus.failed),
      skipped: counted(byStatus.skipped),
      todo: counted(byStatus.todo),
      ...attemptCounts(runnerCases),
    },
    durations: {
      wallMs,
      caseSumMs:
        durations.length === 0
          ? notCounted('duration 을 보고한 case 가 없다')
          : counted(
              durations.reduce((sum, value) => sum + value, 0),
              'derived-from-report',
            ),
    },
    ...outcomeOf(execution, report.report, byStatus),
    cases: toCases(input, runnerCases),
  });
};
