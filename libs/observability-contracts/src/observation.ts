import { z } from 'zod';

import { evidenceRefSchema } from './evidence.js';
import { metricIdSchema, reasonSchema, scopeSchema } from './primitives.js';

/** 값이 없는 이유의 종류. 어느 것도 0 이나 pass 로 바꾸지 않는다. */
export const MISSING_AVAILABILITIES = [
  'not-run',
  'unsupported',
  'unavailable',
  'permission-required',
  'not-measured',
  'not-applicable',
  'invalid',
] as const;

/** `available` 만 실측값을 가진다. */
export const AVAILABILITIES = ['available', ...MISSING_AVAILABILITIES] as const;

/** 실측값을 해석한 판정. availability 와 별개의 축이다. */
export const OUTCOMES = ['pass', 'fail', 'warn', 'info'] as const;

export const DOMAINS = ['bundle', 'context', 'eval'] as const;

export const UNITS = [
  'count',
  'bytes',
  'bytes-delta',
  'tokens',
  'tokens-delta',
  'ms',
  'ratio',
] as const;

export type Availability = (typeof AVAILABILITIES)[number];
export type Outcome = (typeof OUTCOMES)[number];
export type Domain = (typeof DOMAINS)[number];
export type Unit = (typeof UNITS)[number];

/** domain 마다 의미 있는 unit. 목록 밖 unit 은 해석할 수 없으므로 거부한다. */
export const DOMAIN_UNITS = {
  bundle: ['bytes', 'bytes-delta'],
  context: ['tokens', 'tokens-delta', 'count'],
  eval: ['ratio', 'tokens', 'count', 'ms'],
} as const satisfies Record<Domain, readonly Unit[]>;

const INTEGER_UNITS: readonly Unit[] = ['count', 'bytes', 'bytes-delta', 'tokens', 'tokens-delta'];
const SIGNED_UNITS: readonly Unit[] = ['bytes-delta', 'tokens-delta'];

const evidenceListSchema = z.array(evidenceRefSchema).max(20);

const metricBase = {
  id: metricIdSchema,
  domain: z.enum(DOMAINS),
  unit: z.enum(UNITS),
  scope: scopeSchema,
  evidence: evidenceListSchema,
};

const availableMetricSchema = z.strictObject({
  ...metricBase,
  availability: z.literal('available'),
  value: z.number(),
  /** ratio 의 분모. 몇 개 중의 비율인지 없이는 비율을 읽을 수 없다. */
  denominator: z.number().int().positive().nullable(),
  outcome: z.enum(OUTCOMES).nullable(),
  reason: z.null(),
});

const missingMetricSchema = z.strictObject({
  ...metricBase,
  availability: z.enum(MISSING_AVAILABILITIES),
  value: z.null(),
  denominator: z.null(),
  outcome: z.null(),
  reason: reasonSchema,
});

const valueIssue = (unit: Unit, value: number, denominator: number | null): string | null => {
  if (unit === 'ratio') {
    if (denominator === null) return 'ratio needs a positive integer denominator';
    return value >= 0 && value <= 1 ? null : 'ratio must be within 0..1';
  }
  if (denominator !== null) return 'only ratio carries a denominator';
  if (!SIGNED_UNITS.includes(unit) && value < 0) return `${unit} cannot be negative`;
  if (INTEGER_UNITS.includes(unit) && !Number.isInteger(value)) return `${unit} must be an integer`;
  return null;
};

export const metricObservationSchema = z
  .union([availableMetricSchema, missingMetricSchema])
  .superRefine((observation, ctx) => {
    const units: readonly Unit[] = DOMAIN_UNITS[observation.domain];
    if (!units.includes(observation.unit)) {
      ctx.addIssue({
        code: 'custom',
        path: ['unit'],
        message: `${observation.unit} is not a ${observation.domain} unit`,
      });
    }
    if (observation.availability !== 'available') return;
    const issue = valueIssue(observation.unit, observation.value, observation.denominator);
    if (issue) ctx.addIssue({ code: 'custom', path: ['value'], message: issue });
  });

/** run 의 observation. 지금은 metric observation 한 종류다. */
export const observationSchema = metricObservationSchema;

export type MetricObservation = z.infer<typeof metricObservationSchema>;
export type Observation = MetricObservation;
