import { z } from 'zod';

import { isEvidenceId } from './evidence';

/**
 * Dataset / trace의 단일 schema 정의. 타입은 여기서 파생한다.
 *
 * 원칙
 * - gold에 exact tool sequence를 저장하지 않는다. logical capability ID만 저장한다.
 * - 측정 불가 값은 `null`로 남긴다. 0으로 대체하지 않는다.
 */

export const PLATFORMS = ['web', 'react-native', 'both', 'none'] as const;
export const SPLITS = ['dev', 'test'] as const;
export const VERIFICATION_KINDS = ['public-import', 'typecheck', 'test', 'build', 'lint'] as const;
/**
 * 실행하지 않은 check는 절대 `passed`가 아니다.
 * `unsupported`는 이 repository/harness가 그 검증을 지원하지 않는다는 뜻이고,
 * `not-run`은 지원하지만 실행되지 않았다는 뜻이다 — 둘을 섞지 않는다.
 */
export const VERIFICATION_STATUSES = [
  'passed',
  'failed',
  'not-run',
  'unsupported',
  'timeout',
] as const;

export const platformSchema = z.enum(PLATFORMS);
export const splitSchema = z.enum(SPLITS);
export const verificationKindSchema = z.enum(VERIFICATION_KINDS);
export const verificationStatusSchema = z.enum(VERIFICATION_STATUSES);

export type Platform = z.infer<typeof platformSchema>;
export type Split = z.infer<typeof splitSchema>;
export type VerificationKind = z.infer<typeof verificationKindSchema>;
export type VerificationStatus = z.infer<typeof verificationStatusSchema>;

const evidenceIdSchema = z
  .string()
  .refine(isEvidenceId, { message: 'not a valid evidence id (see runner/evidence.ts)' });

const packageNameSchema = z.string().regex(/^@?[\w.-]+(\/[\w.-]+)?$/, 'not a package name');

export const taskExpectationSchema = z.object({
  platform: platformSchema,
  packages: z.array(packageNameSchema).default([]),
  components: z.array(z.string()).default([]),
  requiredEvidence: z.array(evidenceIdSchema).default([]),
  requiredBehaviors: z.array(z.string()).default([]),
  /** logical capability ID (예: 'read-consumer-doc'). tool 이름·순서가 아니다. */
  allowedCapabilities: z.array(z.string()).default([]),
  forbiddenPackages: z.array(packageNameSchema).default([]),
  forbiddenComponents: z.array(z.string()).default([]),
  forbiddenBehaviors: z.array(z.string()).default([]),
});

export const verificationRequirementSchema = z.object({
  kind: verificationKindSchema,
  required: z.boolean(),
});

export const consumerEvalTaskSchema = z
  .object({
    taskId: z.string().regex(/^[a-z0-9-]+$/, 'taskId must be kebab-case'),
    category: z.string().min(1),
    prompt: z.string().min(1),
    /** `fixtures/` 아래 디렉터리 이름. */
    fixture: z.string().min(1),
    expected: taskExpectationSchema,
    verification: z.array(verificationRequirementSchema).min(1),
  })
  .refine((t) => t.verification.some((v) => v.required), {
    message: 'each task needs at least one required verification',
    path: ['verification'],
  })
  .refine((t) => (t.expected.platform === 'none' ? t.expected.packages.length === 0 : true), {
    message: "platform 'none' tasks must not expect UI packages",
    path: ['expected', 'packages'],
  });

export type ConsumerEvalTask = z.infer<typeof consumerEvalTaskSchema>;

/* ------------------------------------------------------------------ trace */

const nullableInt = z.number().int().nullable();

export const toolCallSchema = z.object({
  /** logical capability ID. 구체 tool 이름을 강제하지 않는다. */
  capability: z.string().min(1),
  target: z.string().nullable().default(null),
  /** 같은 target을 다시 읽었는지 — retrieval 낭비 진단용. */
  duplicate: z.boolean().default(false),
});

export const changedFileSchema = z.object({
  path: z.string().min(1),
  content: z.string(),
});

export const verificationRunSchema = z.object({
  kind: verificationKindSchema,
  required: z.boolean(),
  status: verificationStatusSchema,
  /** 실제로 실행한 명령. in-process check나 미실행이면 null. */
  command: z.string().nullable().default(null),
  exitCode: nullableInt,
  durationMs: nullableInt,
  /** 몇 번째 시도인지. 0이면 실행되지 않았다. */
  attempt: z.number().int().min(0).default(0),
  /** 반복 실패 판정용 결정적 지문. 실패가 아니면 null. */
  failureFingerprint: z.string().nullable().default(null),
  /** capped 발췌. 전체 로그는 trace에 싣지 않는다. */
  excerpt: z.string().nullable().default(null),
});

/** 실행된 것으로 칠지 — `not-run`/`unsupported`는 실행이 아니다. */
export const wasInvoked = (run: { status: VerificationStatus }): boolean =>
  run.status !== 'not-run' && run.status !== 'unsupported';

export const didPass = (run: { status: VerificationStatus }): boolean => run.status === 'passed';

/** Executor가 기록하는 raw trial 기록. grader 출력은 포함하지 않는다. */
export const traceSchema = z.object({
  runId: z.string().min(1),
  taskId: z.string().min(1),
  variant: z.string().min(1),
  trial: z.number().int().positive(),
  split: splitSchema,

  gitSha: z.string().nullable(),
  executor: z.string().min(1),
  model: z.string().nullable(),
  harnessVersion: z.string().min(1),

  expectedPlatform: platformSchema,
  selectedPlatform: platformSchema.nullable(),
  expectedPackages: z.array(packageNameSchema),
  selectedPackages: z.array(packageNameSchema).nullable(),

  /** ranked evidence ID 목록. 순서가 MRR에 쓰인다. */
  retrieved: z.array(z.string()),
  toolCalls: z.array(toolCallSchema),
  changedFiles: z.array(changedFileSchema),

  inputTokens: nullableInt,
  outputTokens: nullableInt,
  retrievedTokens: nullableInt,
  retrievedFiles: nullableInt,
  retrievedChunks: nullableInt,
  latencyMs: nullableInt,

  /**
   * agent의 완료 주장. `'unknown'`은 agent가 모른다고 답한 것이고,
   * `null`은 executor가 아예 보고하지 않은 것이다 — false로 강제하지 않는다.
   */
  claimedSuccess: z.union([z.boolean(), z.literal('unknown')]).nullable(),
  verification: z.array(verificationRunSchema),
  repairAttempts: z.number().int().min(0),
  repairTokens: nullableInt,
  /** repair를 시도하지 않았으면 null. */
  repairSucceeded: z.boolean().nullable().default(null),
  repeatedFailures: nullableInt.default(null),
});

export type Trace = z.infer<typeof traceSchema>;
export type ToolCall = z.infer<typeof toolCallSchema>;
export type ChangedFile = z.infer<typeof changedFileSchema>;
export type VerificationRun = z.infer<typeof verificationRunSchema>;
