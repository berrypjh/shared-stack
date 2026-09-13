import { z } from 'zod';

import { MISSING_AVAILABILITIES } from './observation.js';
import {
  countSchema,
  metricIdSchema,
  orUnknown,
  reasonSchema,
  scopeSchema,
  sha256Schema,
} from './primitives.js';
import { safeText } from './test-summary.js';

/** `budget` 은 한도가 있는 게이트, `diagnostic` 은 보고만 하는 진단 값이다. */
export const BUNDLE_ROLES = ['budget', 'diagnostic'] as const;
export const BUNDLE_METHODS = ['size-limit', 'treeshake-esbuild'] as const;
export const COMPRESSIONS = ['brotli', 'gzip', 'none'] as const;

/**
 * 측정값에 보정이 들어갔는지. size-limit 은 esbuild 빈 프로젝트 상수(번들 내용에 따라 다르다)를
 * 빼고 보고하므로 standalone raw/gzip 값과 같은 단위가 아니다.
 */
export const SIZE_ADJUSTMENTS = ['size-limit-empty-project-subtracted', 'none'] as const;

const budgetSchema = z.strictObject({
  limitBytes: countSchema,
  /** config 에 적힌 원문 (`'11 KB'`). 해석은 설치된 size-limit 의 bytes-iec 규칙을 따른다. */
  limitSource: z.string().min(1).max(40),
  /** limit − current. 초과하면 음수다. */
  headroomBytes: z.number().int().nullable(),
  outcome: z.enum(['pass', 'fail']).nullable(),
  /** 도구가 보고한 판정 그대로. */
  toolPassed: z.boolean().nullable(),
});

const measurementBase = {
  id: metricIdSchema,
  caseName: safeText(200),
  role: z.enum(BUNDLE_ROLES),
  method: z.enum(BUNDLE_METHODS),
  tool: z.strictObject({
    name: z.string().min(1).max(64),
    version: orUnknown(z.string().min(1).max(64)),
  }),
  package: scopeSchema,
  /** size-limit 은 번들 파일 경로, treeshake 는 package specifier. */
  entry: safeText(300),
  importSpec: safeText(300),
  externals: z.array(z.string().min(1).max(200)),
  target: z.string().min(1).max(40),
  compression: z.enum(COMPRESSIONS),
  adjustment: z.enum(SIZE_ADJUSTMENTS),
  unit: z.literal('bytes'),
  /** 측정 조건(경로·import·externals·target·압축·한도) 해시. 다르면 비교하지 않는다. */
  configHash: sha256Schema,
  budget: budgetSchema.nullable(),
};

const availableBundleSchema = z.strictObject({
  ...measurementBase,
  availability: z.literal('available'),
  value: countSchema,
  reason: z.null(),
});

const missingBundleSchema = z.strictObject({
  ...measurementBase,
  availability: z.enum(MISSING_AVAILABILITIES),
  value: z.null(),
  reason: reasonSchema,
});

type BundleShape = z.infer<typeof availableBundleSchema> | z.infer<typeof missingBundleSchema>;

const methodIssues = (measurement: BundleShape): string[] => {
  if (measurement.method === 'size-limit') {
    return measurement.adjustment === 'size-limit-empty-project-subtracted'
      ? []
      : ['size-limit reports sizes with the empty-project constant subtracted'];
  }
  const issues: string[] = [];
  if (measurement.adjustment !== 'none')
    issues.push('treeshake values are standalone, without adjustment');
  if (measurement.compression === 'brotli') issues.push('treeshake measures raw and gzip only');
  return issues;
};

const budgetIssues = (measurement: BundleShape): string[] => {
  const { budget, value } = measurement;
  if ((measurement.role === 'budget') !== (budget !== null)) {
    return ['a budget measurement needs a limit; a diagnostic has none'];
  }
  if (budget === null) return [];
  if (value === null) {
    return budget.headroomBytes === null && budget.outcome === null && budget.toolPassed === null
      ? []
      : ['without a value there is no headroom or verdict'];
  }
  const issues: string[] = [];
  const outcome = value <= budget.limitBytes ? 'pass' : 'fail';
  if (budget.headroomBytes !== budget.limitBytes - value)
    issues.push('headroom must equal limit minus current');
  if (budget.outcome !== outcome)
    issues.push(`current ${value} against limit ${budget.limitBytes} is ${outcome}`);
  if (budget.toolPassed !== null && budget.toolPassed !== (outcome === 'pass')) {
    issues.push('the tool verdict disagrees with current <= limit');
  }
  return issues;
};

export const bundleMeasurementSchema = z
  .union([availableBundleSchema, missingBundleSchema])
  .superRefine((measurement, ctx) => {
    for (const message of [...methodIssues(measurement), ...budgetIssues(measurement)]) {
      ctx.addIssue({ code: 'custom', message });
    }
  });

export type BundleMeasurement = z.infer<typeof bundleMeasurementSchema>;

export type BundleComparison = {
  comparable: boolean;
  reasons: string[];
  deltaBytes: number | null;
  /** baseline 이 0 이면 N/A(null). */
  relativeDelta: number | null;
};

const BUNDLE_CONDITIONS = [
  'package',
  'method',
  'compression',
  'adjustment',
  'entry',
  'importSpec',
  'target',
  'configHash',
] as const;

const sameList = (a: string[], b: string[]) =>
  JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

/** 측정 조건이 모두 같을 때만 delta = current − baseline 을 준다. */
export const compareBundle = (
  current: BundleMeasurement,
  baseline: BundleMeasurement,
): BundleComparison => {
  const reasons = BUNDLE_CONDITIONS.filter((key) => current[key] !== baseline[key]).map(
    (key) => `${key} differs`,
  );
  if (current.tool.name !== baseline.tool.name || current.tool.version !== baseline.tool.version) {
    reasons.push('tool differs');
  }
  if (!sameList(current.externals, baseline.externals)) reasons.push('externals differ');
  if (current.value === null || baseline.value === null) {
    return {
      comparable: false,
      reasons: [...reasons, 'value missing'],
      deltaBytes: null,
      relativeDelta: null,
    };
  }
  if (reasons.length > 0)
    return { comparable: false, reasons, deltaBytes: null, relativeDelta: null };
  const deltaBytes = current.value - baseline.value;
  return {
    comparable: true,
    reasons: [],
    deltaBytes,
    relativeDelta: baseline.value === 0 ? null : deltaBytes / baseline.value,
  };
};
