import { describe, expect, it } from 'vitest';

import { publicRunArtifactSchema, runArtifactSchema, testSummarySchema } from '../src/index.js';

import { artifact, counted, HASH, notCounted, testCase, testSummary } from './fixtures.js';

const ok = (input: unknown) => testSummarySchema.safeParse(input).success;

/** report 에서 오는 count 를 전부 비운다. */
const REPORT_COUNTS = [
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
const withoutReportCounts = (reason: string) => ({
  sourceFiles: counted(1, 'source-scan'),
  ...Object.fromEntries(REPORT_COUNTS.map((key) => [key, notCounted(reason)])),
});
const withoutReportDurations = (reason: string) => ({
  wallMs: counted(900, 'collector-clock'),
  caseSumMs: notCounted(reason),
});

describe('TestSummary', () => {
  it('fixture 가 통과한다', () => {
    expect(ok(testSummary())).toBe(true);
  });

  describe('count 는 값과 출처를 함께 가진다 — null 과 0 은 다르다', () => {
    it('실측 0 은 출처가 있는 0 이다', () => {
      expect(ok(testSummary())).toBe(true);
      expect(testSummarySchema.parse(testSummary()).counts.failed).toEqual(counted(0));
    });

    it('출처 없는 값, 이유 없는 null 은 거부한다', () => {
      const counts = testSummary().counts;
      expect(
        ok(
          testSummary({
            counts: { ...counts, failed: { value: 0, provenance: null, reason: null } },
          }),
        ),
      ).toBe(false);
      expect(
        ok(
          testSummary({
            counts: { ...counts, failed: { value: null, provenance: null, reason: null } },
          }),
        ),
      ).toBe(false);
    });

    it('source 파일 수를 case 수로 둘 수 없다', () => {
      const counts = testSummary().counts;
      expect(ok(testSummary({ counts: { ...counts, cases: counted(1, 'source-scan') } }))).toBe(
        false,
      );
      expect(
        ok(testSummary({ counts: { ...counts, sourceFiles: counted(1, 'runner-report') } })),
      ).toBe(false);
    });

    it('case 배열과 count 가 어긋나면 거부한다', () => {
      const counts = testSummary().counts;
      expect(
        ok(testSummary({ counts: { ...counts, cases: counted(2), passed: counted(2) } })),
      ).toBe(false);
      expect(ok(testSummary({ counts: { ...counts, skipped: counted(1) } }))).toBe(false);
    });
  });

  describe('case ID', () => {
    it('같은 이름이라도 파일이 다르면 서로 다른 case 다', () => {
      const other = testCase({
        id: '@berrypjh/react-ui::src/b.test.ts::renders',
        file: 'libs/react-ui/src/b.test.ts',
      });
      const first = testCase({
        id: '@berrypjh/react-ui::src/a.test.ts::renders',
        file: 'libs/react-ui/src/a.test.ts',
      });
      const counts = {
        ...testSummary().counts,
        reportedFiles: counted(2),
        cases: counted(2),
        passed: counted(2),
        attempts: counted(2, 'derived-from-report'),
      };
      expect(
        ok(testSummary({ cases: [first, other], counts, outcomeReason: '2 case 모두 통과' })),
      ).toBe(true);
    });

    it('ID 가 겹치면 이중 집계라 거부한다', () => {
      const counts = {
        ...testSummary().counts,
        cases: counted(2),
        passed: counted(2),
        attempts: counted(2, 'derived-from-report'),
      };
      expect(ok(testSummary({ cases: [testCase(), testCase()], counts }))).toBe(false);
    });
  });

  describe('execution 과 test 상태는 다른 축이다', () => {
    it('프로세스가 실패해도 report 가 유효하면 count 를 보존하고 fail 이다', () => {
      const failedCase = testCase({
        status: 'failed',
        attempts: counted(3, 'derived-from-report'),
      });
      const summary = testSummary({
        execution: { ...testSummary().execution, status: 'failed', exitCode: 1 },
        cases: [failedCase],
        counts: {
          ...testSummary().counts,
          passed: counted(0),
          failed: counted(1),
          retriedCases: counted(1, 'derived-from-report'),
          attempts: counted(3, 'derived-from-report'),
        },
        outcome: 'fail',
        outcomeReason: '1 case 실패',
      });
      expect(ok(summary)).toBe(true);
    });

    it('실패한 프로세스를 pass 로 둘 수 없고, completed 는 exit 0 이다', () => {
      expect(
        ok(
          testSummary({ execution: { ...testSummary().execution, status: 'failed', exitCode: 1 } }),
        ),
      ).toBe(false);
      expect(ok(testSummary({ execution: { ...testSummary().execution, exitCode: 1 } }))).toBe(
        false,
      );
    });

    it('timeout·cancelled 는 이유가 필요하다', () => {
      const timeout = { ...testSummary().execution, status: 'timeout', exitCode: null };
      expect(ok(testSummary({ execution: timeout, outcome: null }))).toBe(false);
    });

    it('timeout 으로 report 가 없으면 count 없이 outcome null', () => {
      const reason = 'timeout 으로 report 가 쓰이지 않았다';
      const summary = testSummary({
        execution: {
          ...testSummary().execution,
          status: 'timeout',
          exitCode: null,
          reason: '600000ms 초과',
        },
        report: { status: 'missing', format: 'vitest-json', path: null, sha256: null, reason },
        counts: withoutReportCounts(reason),
        durations: withoutReportDurations(reason),
        cases: [],
        outcome: null,
        outcomeReason: reason,
      });
      expect(ok(summary)).toBe(true);
    });

    it('실행하지 않았으면 report 도 결과도 없다', () => {
      const reason = '이 profile 은 실행하지 않는다';
      const notRun = testSummary({
        execution: {
          status: 'not-run',
          commandId: 'test.react-ui',
          exitCode: null,
          timeoutMs: null,
          excerpt: null,
          reason,
        },
        report: { status: 'not-requested', format: null, path: null, sha256: null, reason },
        counts: withoutReportCounts(reason),
        durations: { wallMs: notCounted(reason), caseSumMs: notCounted(reason) },
        cases: [],
        outcome: null,
        outcomeReason: reason,
      });
      expect(ok(notRun)).toBe(true);
      expect(ok({ ...notRun, report: testSummary().report })).toBe(false);
    });
  });

  describe('report', () => {
    it('깨진 report 는 parser 실패다 — count·case·outcome 을 만들지 않는다', () => {
      const reason = 'report 가 JSON 이 아니다';
      const corrupt = {
        report: {
          status: 'corrupt',
          format: 'vitest-json',
          path: 'raw/tests/test.react-ui.json',
          sha256: HASH,
          reason,
        },
        counts: withoutReportCounts(reason),
        durations: withoutReportDurations(reason),
        cases: [],
        outcome: null,
        outcomeReason: reason,
      };
      expect(ok(testSummary(corrupt))).toBe(true);
      expect(ok(testSummary({ ...corrupt, counts: testSummary().counts }))).toBe(false);
      expect(ok(testSummary({ ...corrupt, outcome: 'fail' }))).toBe(false);
    });

    it('Nx cache 복원은 새 report 가 아니다', () => {
      const reason = 'Nx 가 cache 에서 복원해 runner 가 report 를 쓰지 않았다';
      const restored = {
        cache: 'restored',
        report: { status: 'missing', format: 'vitest-json', path: null, sha256: null, reason },
        counts: withoutReportCounts(reason),
        durations: withoutReportDurations(reason),
        cases: [],
        outcome: null,
        outcomeReason: reason,
      };
      expect(ok(testSummary(restored))).toBe(true);
      expect(ok(testSummary({ cache: 'restored' }))).toBe(false);
    });
  });

  describe('분모', () => {
    it('case 가 0 이면 pass 가 아니다', () => {
      const zero = {
        cases: [],
        counts: {
          ...testSummary().counts,
          cases: counted(0),
          passed: counted(0),
          attempts: counted(0, 'derived-from-report'),
        },
      };
      expect(ok(testSummary({ ...zero, outcome: 'pass' }))).toBe(false);
      expect(
        ok(testSummary({ ...zero, outcome: null, outcomeReason: 'report 에 case 가 없다' })),
      ).toBe(true);
    });
  });

  describe('case 상태', () => {
    it('skip·todo 는 실행 시간이 없다', () => {
      const cases = [
        testCase({
          status: 'skipped',
          durationMs: null,
          attempts: counted(0, 'derived-from-report'),
        }),
      ];
      const counts = {
        ...testSummary().counts,
        passed: counted(0),
        skipped: counted(1),
        attempts: counted(0, 'derived-from-report'),
      };
      expect(
        ok(testSummary({ cases, counts, outcome: null, outcomeReason: '실행된 case 가 없다' })),
      ).toBe(true);
    });

    it('case 이름은 제어 문자·credential 을 담을 수 없다', () => {
      expect(
        ok(testSummary({ cases: [testCase({ fullName: `bad${String.fromCharCode(27)}[31m` })] })),
      ).toBe(false);
      expect(
        ok(testSummary({ cases: [testCase({ fullName: `token npm_${'a'.repeat(36)}` })] })),
      ).toBe(false);
    });

    it('layer 는 근거가 있을 때만 붙고 없으면 unknown 이다', () => {
      expect(
        ok(testSummary({ cases: [testCase({ layer: 'conformance', layerEvidence: null })] })),
      ).toBe(false);
      expect(
        ok(testSummary({ cases: [testCase({ layer: 'unknown', layerEvidence: 'guess' })] })),
      ).toBe(false);
      const conformance = testCase({
        layer: 'conformance',
        layerEvidence: "ancestor 'Button conformance'",
      });
      expect(ok(testSummary({ cases: [conformance] }))).toBe(true);
    });
  });

  describe('coverage', () => {
    it('없는 coverage 는 null 이 아니라 이유가 있는 not-measured 다', () => {
      expect(ok(testSummary({ coverage: null }))).toBe(false);
      expect(ok(testSummary({ coverage: { status: 'not-measured', reason: '' } }))).toBe(false);
    });

    it('covered 는 total 을 넘을 수 없다', () => {
      const metric = { covered: 5, total: 10 };
      const measured = {
        status: 'measured',
        provider: 'v8',
        reportPath: 'raw/coverage/test.react-ui/coverage-summary.json',
        lines: metric,
        statements: metric,
        functions: metric,
        branches: metric,
      };
      expect(ok(testSummary({ coverage: measured }))).toBe(true);
      expect(
        ok(testSummary({ coverage: { ...measured, lines: { covered: 11, total: 10 } } })),
      ).toBe(false);
    });
  });
});

describe('RunArtifact.tests', () => {
  it('artifact 는 test summary 를 담는다', () => {
    expect(runArtifactSchema.safeParse(artifact({ tests: [testSummary()] })).success).toBe(true);
  });

  it('공개 artifact 에 tmp 아래 case 경로를 싣지 않는다', () => {
    const leaking = testSummary({
      cases: [testCase({ file: 'tmp/llm-evals/heldout-1/case.test.ts' })],
    });
    expect(runArtifactSchema.safeParse(artifact({ tests: [leaking] })).success).toBe(true);
    expect(publicRunArtifactSchema.safeParse(artifact({ tests: [leaking] })).success).toBe(false);
  });
});
