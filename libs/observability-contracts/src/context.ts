import { z } from 'zod';

import { MISSING_AVAILABILITIES } from './observation.js';
import { countSchema, metricIdSchema, reasonSchema, relativePathSchema } from './primitives.js';
import { safeText } from './test-summary.js';

/**
 * - `package-scenario`: measure-tokens 의 패키지별 시나리오 (정적 파일 묶음)
 * - `variant-initial`: consumer eval variant 의 초기 컨텍스트 (routing 거부 시 union)
 * - `variant-routed`: routing 된 플랫폼 하나의 컨텍스트
 * - `agent-input`: executor 가 보고한 실제 입력 토큰
 */
export const CONTEXT_SCOPES = [
  'package-scenario',
  'variant-initial',
  'variant-routed',
  'agent-input',
] as const;
export const TOKEN_PROVIDERS = ['openai-tiktoken-local', 'anthropic-count-tokens'] as const;

/** 파일을 이어 붙이는 방식이 다르면 같은 파일이어도 token 수가 다르다. */
export const CONTENT_CONSTRUCTIONS = [
  'measure-tokens-read-files',
  'eval-variant-context-join',
  'executor-reported',
] as const;

export const CONTEXT_REASON_CODES = [
  'missing-input',
  'provider-not-selected',
  'provider-error',
  'not-collected',
] as const;

const contextBase = {
  id: metricIdSchema,
  scope: z.enum(CONTEXT_SCOPES),
  subject: safeText(200),
  provider: z.enum(TOKEN_PROVIDERS),
  tokenModel: z.string().min(1).max(64),
  tokenizerVersion: z.string().min(1).max(64).nullable(),
  tokenizerVersionReason: reasonSchema.nullable(),
  contentConstruction: z.enum(CONTENT_CONSTRUCTIONS),
  files: z.array(relativePathSchema),
  /** 선언됐지만 없는 경로 (spec 원문). 하나라도 있으면 부분 합계를 두지 않는다. */
  missingPaths: z.array(z.string().min(1).max(300)),
};

const availableContextSchema = z.strictObject({
  ...contextBase,
  availability: z.literal('available'),
  chars: countSchema,
  tokens: countSchema,
  reason: z.null(),
  reasonCode: z.null(),
});

const missingContextSchema = z.strictObject({
  ...contextBase,
  availability: z.enum(MISSING_AVAILABILITIES),
  chars: z.null(),
  tokens: z.null(),
  reason: reasonSchema,
  reasonCode: z.enum(CONTEXT_REASON_CODES),
});

export const contextMeasurementSchema = z
  .union([availableContextSchema, missingContextSchema])
  .superRefine((measurement, ctx) => {
    if ((measurement.tokenizerVersion === null) === (measurement.tokenizerVersionReason === null)) {
      ctx.addIssue({
        code: 'custom',
        path: ['tokenizerVersion'],
        message: 'give the tokenizer version, or null with a reason',
      });
    }
    const hasMissing = measurement.missingPaths.length > 0;
    if (hasMissing !== (measurement.reasonCode === 'missing-input')) {
      ctx.addIssue({
        code: 'custom',
        path: ['missingPaths'],
        message: 'missing paths mean an unavailable measurement with reasonCode missing-input',
      });
    }
  });

export type ContextMeasurement = z.infer<typeof contextMeasurementSchema>;

export type ContextComparison = {
  comparable: boolean;
  reasons: string[];
  deltaTokens: number | null;
  relativeDelta: number | null;
};

export const CONTEXT_CONDITIONS = [
  'scope',
  'provider',
  'tokenModel',
  'tokenizerVersion',
  'contentConstruction',
] as const;

/** scope·provider·tokenizer·내용 구성이 같을 때만 token delta 를 준다. */
export const compareContext = (
  current: ContextMeasurement,
  baseline: ContextMeasurement,
): ContextComparison => {
  const reasons = CONTEXT_CONDITIONS.filter((key) => current[key] !== baseline[key]).map(
    (key) => `${key} differs`,
  );
  if (current.tokens === null || baseline.tokens === null) {
    return {
      comparable: false,
      reasons: [...reasons, 'tokens missing'],
      deltaTokens: null,
      relativeDelta: null,
    };
  }
  if (reasons.length > 0)
    return { comparable: false, reasons, deltaTokens: null, relativeDelta: null };
  const deltaTokens = current.tokens - baseline.tokens;
  return {
    comparable: true,
    reasons: [],
    deltaTokens,
    relativeDelta: baseline.tokens === 0 ? null : deltaTokens / baseline.tokens,
  };
};
