import { z } from 'zod';

export type ReportFormat = 'vitest-json' | 'size-limit-json' | 'treeshake-json';

/** vitest report 의 case 하나. `file` 은 report 가 쓴 경로 그대로다. */
export type RunnerCase = {
  file: string;
  title: string;
  status: 'passed' | 'failed' | 'skipped' | 'todo';
};

/** vitest report 의 case 목록. 콘솔 출력이 아니라 reporter 가 쓴 JSON 에서만 만든다. */
export type RunnerReport = { cases: RunnerCase[] };

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
