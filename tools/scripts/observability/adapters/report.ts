import { z } from 'zod';

export type ReportFormat =
  | 'vitest-json'
  | 'jest-json'
  | 'playwright-json'
  | 'size-limit-json'
  | 'treeshake-json';
export type CaseStatus = 'passed' | 'failed' | 'skipped' | 'todo';
export type ReportedCount = { value: number; provenance: 'runner-report' | 'derived-from-report' };

/** report 의 case 하나. `file` 은 report 가 쓴 경로 그대로다 — 저장소 기준 정규화는 normalizer 가 한다. */
export type RunnerCase = {
  file: string;
  ancestors: string[];
  title: string;
  fullName: string;
  status: CaseStatus;
  /** runner 가 알려주지 않으면 null. */
  attempts: ReportedCount | null;
  durationMs: number | null;
};

/** `error` 는 case 가 아니라 파일이 실행되지 못한 이유 (import 실패, test 없음). */
export type RunnerFile = { file: string; error: string | null };

/** runner 하나의 report 를 공통 모양으로. 콘솔 출력이 아니라 reporter 가 쓴 JSON 에서만 만든다. */
export type RunnerReport = {
  format: ReportFormat;
  /** runner 가 정의한 suite 수. 보고하지 않는 runner 는 null. */
  suites: number | null;
  files: RunnerFile[];
  cases: RunnerCase[];
  /** 특정 파일에 속하지 않는 실행 오류. */
  errors: string[];
  interrupted: boolean;
};

/** `corrupt` 는 JSON 이 아닌 것, `invalid` 는 JSON 이지만 이 adapter 가 읽는 필드가 없는 것이다. */
export class ReportParseError extends Error {
  readonly kind: 'corrupt' | 'invalid';

  constructor(kind: 'corrupt' | 'invalid', message: string) {
    super(message);
    this.kind = kind;
  }
}

export const parseReport = <T>(text: string, schema: z.ZodType<T>, format: ReportFormat): T => {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new ReportParseError('corrupt', `${format} report is not valid JSON`);
  }
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new ReportParseError(
      'invalid',
      `${format} report has an unexpected shape:\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
};
