import { describe, expect, it } from 'vitest';

import { parsePlaywrightReport } from './playwright';
import { ReportParseError } from './report';

const result = (status: string, retry: number, duration = 100) => ({
  status,
  retry,
  duration,
  workerIndex: 0,
  errors: [],
});

const spec = (title: string, tests: unknown[], file = 'navigation.spec.ts') => ({
  title,
  ok: true,
  tags: [],
  tests,
  id: `${file}-${title}`,
  file,
  line: 1,
  column: 1,
});

const test = (status: string, results: unknown[]) => ({
  timeout: 30000,
  annotations: [],
  expectedStatus: 'passed',
  projectId: 'chromium',
  projectName: 'chromium',
  results,
  status,
});

/** playwright 1.59.1 json reporter 의 모양 (`--list` 로 확인한 구조 + results). */
const REPORT = {
  config: {},
  stats: {
    startTime: '2026-09-13T08:42:00.284Z',
    duration: 1000,
    expected: 1,
    skipped: 1,
    unexpected: 1,
    flaky: 1,
  },
  errors: [],
  suites: [
    {
      title: 'navigation.spec.ts',
      file: 'navigation.spec.ts',
      line: 0,
      column: 0,
      specs: [spec('첫 화면', [test('expected', [result('passed', 0)])])],
      suites: [
        {
          title: '사이드바',
          file: 'navigation.spec.ts',
          line: 3,
          column: 1,
          specs: [
            spec('모든 링크로 이동한다', [
              test('flaky', [result('failed', 0), result('passed', 1)]),
            ]),
            spec('현재 위치를 표시한다', [
              test('unexpected', [result('timedOut', 0, 30000), result('failed', 1)]),
            ]),
            spec('건너뛴다', [test('skipped', [])]),
          ],
        },
      ],
    },
  ],
};

describe('parsePlaywrightReport', () => {
  const report = parsePlaywrightReport(JSON.stringify(REPORT));

  it('중첩 suite 의 spec × project 가 case 다', () => {
    expect(report.cases.map((c) => [c.file, c.fullName, c.status])).toEqual([
      ['navigation.spec.ts', '첫 화면 [chromium]', 'passed'],
      ['navigation.spec.ts', '사이드바 › 모든 링크로 이동한다 [chromium]', 'passed'],
      ['navigation.spec.ts', '사이드바 › 현재 위치를 표시한다 [chromium]', 'failed'],
      ['navigation.spec.ts', '사이드바 › 건너뛴다 [chromium]', 'skipped'],
    ]);
  });

  it('시도 수는 results 수이고 duration 은 시도의 합이다', () => {
    expect(report.cases[1]).toMatchObject({
      attempts: { value: 2, provenance: 'runner-report' },
      durationMs: 200,
    });
    expect(report.cases[2]).toMatchObject({
      attempts: { value: 2, provenance: 'runner-report' },
      durationMs: 30100,
    });
    expect(report.cases[3]).toMatchObject({
      attempts: { value: 0, provenance: 'runner-report' },
      durationMs: null,
    });
  });

  it('playwright 는 suite 수를 보고하지 않는다', () => {
    expect(report.suites).toBeNull();
  });

  it('전역 오류를 보존한다', () => {
    const withError = parsePlaywrightReport(
      JSON.stringify({ ...REPORT, errors: [{ message: 'webServer timed out' }] }),
    );
    expect(withError.errors).toEqual(['webServer timed out']);
  });

  it('JSON 이 아니면 corrupt, 모양이 다르면 invalid', () => {
    const kind = (text: string) => {
      try {
        parsePlaywrightReport(text);
        return 'ok';
      } catch (error) {
        return error instanceof ReportParseError ? error.kind : String(error);
      }
    };
    expect(kind('')).toBe('corrupt');
    expect(kind(JSON.stringify({ suites: [] }))).toBe('invalid');
  });
});
