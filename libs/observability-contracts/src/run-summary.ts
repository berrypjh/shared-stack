import { z } from 'zod';

import { EVAL_NOTICE_CODES, EXECUTOR_CLASSES } from './eval.js';
import { isPublicEvidencePath } from './evidence.js';
import { type Observation, observationSchema } from './observation.js';
import { countSchema, reasonSchema } from './primitives.js';
import { type RunArtifact, runMetadataSchema } from './run.js';

/**
 * 화면이 run 전체(eval trace 포함)를 받기 전에 읽는 요약.
 * 값을 다시 계산하지 않는다 — metadata·observation 은 그대로, 영역은 행 수만, 실패는 원본 판정이
 * fail 인 행만 옮긴다. not-run·unsupported 는 실패가 아니고 여기 오지 않는다.
 */

export const FAILURE_DOMAINS = ['bundle', 'context', 'eval'] as const;

const failureSchema = z.strictObject({
  domain: z.enum(FAILURE_DOMAINS),
  id: z.string().min(1).max(300),
  scope: z.string().min(1).max(200),
  reason: reasonSchema,
});

export const runSummarySchema = z
  .strictObject({
    metadata: runMetadataSchema,
    observations: z.array(observationSchema),
    /** 영역마다 담긴 행 수. 비어 있으면 그 영역을 수집하지 않은 run 이다. */
    sections: z.strictObject({
      bundles: countSchema,
      contexts: countSchema,
      evals: countSchema,
    }),
    failures: z.array(failureSchema),
    /** eval 은 executor 종류와 notice 만. 성공률은 run detail 에서 원본으로 읽는다. */
    evals: z.array(
      z.strictObject({
        sourceId: z.string().regex(/^eval:[\w.-]{1,120}$/),
        executorClass: z.enum(EXECUTOR_CLASSES).nullable(),
        notices: z.array(z.enum(EVAL_NOTICE_CODES)),
      }),
    ),
  })
  .superRefine((summary, ctx) => {
    const seen = new Set<string>();
    summary.observations.forEach((observation, i) => {
      if (seen.has(observation.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['observations', i, 'id'],
          message: `duplicate observation id ${observation.id}`,
        });
      }
      seen.add(observation.id);
      observation.evidence.forEach((evidence, j) => {
        if ('path' in evidence && !isPublicEvidencePath(evidence.path)) {
          ctx.addIssue({
            code: 'custom',
            path: ['observations', i, 'evidence', j, 'path'],
            message: `${evidence.path} is not publishable`,
          });
        }
      });
    });
  });

export type RunSummary = z.infer<typeof runSummarySchema>;
export type RunFailure = z.infer<typeof failureSchema>;

const clip = (text: string) => (text.length <= 500 ? text : `${text.slice(0, 499)}…`);
const integer = (value: number) => value.toLocaleString('en-US');

const observationFailure = (observation: Observation): RunFailure | null =>
  observation.outcome === 'fail'
    ? {
        domain: observation.domain,
        id: observation.id,
        scope: observation.scope,
        reason: `${observation.id} 의 원본 판정이 fail 이다`,
      }
    : null;

const failuresOf = (artifact: RunArtifact): RunFailure[] => {
  const failures: RunFailure[] = [];
  for (const observation of artifact.observations) {
    const failure = observationFailure(observation);
    if (failure) failures.push(failure);
  }
  for (const measurement of artifact.bundles) {
    const { budget } = measurement;
    if (budget?.outcome !== 'fail') continue;
    failures.push({
      domain: 'bundle',
      id: measurement.id,
      scope: measurement.package,
      reason: clip(
        budget.headroomBytes === null
          ? `${measurement.caseName}: 한도 ${budget.limitSource} 판정 fail`
          : `${measurement.caseName}: ${integer(-budget.headroomBytes)} B 초과 (한도 ${budget.limitSource})`,
      ),
    });
  }
  for (const evalRun of artifact.evals) {
    for (const [part, status] of Object.entries(evalRun.import)) {
      if (status.status !== 'invalid') continue;
      failures.push({
        domain: 'eval',
        id: evalRun.sourceId,
        scope: evalRun.sourceId,
        reason: clip(`${evalRun.sourceId} ${part} import invalid — ${status.reason ?? ''}`),
      });
    }
  }
  return failures;
};

export const summarizeRun = (artifact: RunArtifact): RunSummary => ({
  metadata: artifact.metadata,
  observations: artifact.observations,
  sections: {
    bundles: artifact.bundles.length,
    contexts: artifact.contexts.length,
    evals: artifact.evals.length,
  },
  failures: failuresOf(artifact),
  evals: artifact.evals.map((evalRun) => ({
    sourceId: evalRun.sourceId,
    executorClass: evalRun.executorClass,
    notices: evalRun.notices.map((notice) => notice.code),
  })),
});
