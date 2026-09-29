import { z } from 'zod';

export type ReportFormat = 'size-limit-json' | 'treeshake-json';

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
