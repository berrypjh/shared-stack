import { createRequire } from 'node:module';

import { z } from 'zod';

import { parseReport } from './report';

export type SizeLimitCompression = 'brotli' | 'gzip' | 'none';

export type SizeLimitCase = {
  name: string;
  path: string;
  importSpec: string | null;
  /** config 에 적힌 원문 (`'11 KB'`). */
  limit: string | null;
  externals: string[];
  target: string;
  compression: SizeLimitCompression;
};

export type SizeLimitEntry = {
  name: string;
  size: number | null;
  sizeLimit: number | null;
  passed: boolean | null;
};

/** 성공하면 case 결과 배열, 실패하면 오류 하나다. 부분 결과는 없다. */
export type SizeLimitReport =
  | { status: 'results'; entries: SizeLimitEntry[] }
  | { status: 'error'; message: string };

const entrySchema = z.looseObject({
  name: z.string().min(1),
  size: z.number().int().optional(),
  sizeLimit: z.number().int().nonnegative().optional(),
  passed: z.boolean().optional(),
});

const reportSchema = z.union([z.array(entrySchema), z.looseObject({ error: z.string() })]);

/** `size-limit --json` 의 출력 (12.1.0 `create-reporter.js` 의 JSON reporter). */
export const parseSizeLimitReport = (text: string): SizeLimitReport => {
  const report = parseReport(text, reportSchema, 'size-limit-json');
  if (!Array.isArray(report)) return { status: 'error', message: report.error };
  return {
    status: 'results',
    entries: report.map((entry) => ({
      name: entry.name,
      size: entry.size ?? null,
      sizeLimit: entry.sizeLimit ?? null,
      passed: entry.passed ?? null,
    })),
  };
};

const caseSchema = z.looseObject({
  name: z.string().min(1),
  path: z.string().min(1),
  import: z.string().optional(),
  limit: z.string().optional(),
  ignore: z.array(z.string()).optional(),
  gzip: z.boolean().optional(),
  brotli: z.boolean().optional(),
  modifyEsbuildConfig: z
    .custom<
      (config: Record<string, unknown>) => Record<string, unknown>
    >((value) => typeof value === 'function')
    .optional(),
});

type RawCase = z.infer<typeof caseSchema>;

/** `@size-limit/file` 의 step60 과 같은 규칙: `gzip: true` → gzip, `brotli: false` → 무압축, 나머지 brotli. */
const compressionOf = (sizeCase: RawCase): SizeLimitCompression =>
  sizeCase.gzip === true ? 'gzip' : sizeCase.brotli === false ? 'none' : 'brotli';

const targetOf = (sizeCase: RawCase): string => {
  const target = sizeCase.modifyEsbuildConfig?.({}).target;
  return typeof target === 'string' ? target : 'size-limit-default';
};

/**
 * `.size-limit.cjs` 를 require 해 case 를 읽는다. 주석에 적힌 과거 측정값은 모듈 값이 아니므로
 * 여기 들어오지 않는다. target 은 case 의 `modifyEsbuildConfig` 를 빈 config 에 적용해 얻는다.
 */
export const readSizeLimitCases = (configPath: string): SizeLimitCase[] =>
  z
    .array(caseSchema)
    .parse(createRequire(configPath)(configPath))
    .map((sizeCase) => ({
      name: sizeCase.name,
      path: sizeCase.path,
      importSpec: sizeCase.import ?? null,
      limit: sizeCase.limit ?? null,
      externals: sizeCase.ignore ?? [],
      target: targetOf(sizeCase),
      compression: compressionOf(sizeCase),
    }));
