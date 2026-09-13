import { z } from 'zod';

import { EVAL_NOTICE_CODES, EXECUTOR_CLASSES } from './eval.js';
import { isPublicEvidencePath } from './evidence.js';
import { type Observation, observationSchema } from './observation.js';
import { countSchema, reasonSchema } from './primitives.js';
import { type RunArtifact, runMetadataSchema } from './run.js';

/**
 * 화면이 run 전체(test case·eval trace 포함)를 받기 전에 읽는 요약.
 * 값을 다시 계산하지 않는다 — metadata·observation 은 그대로, 영역은 행 수만, 실패는 원본 판정이
 * fail 인 행만 옮긴다. not-run·unsupported 는 실패가 아니고 여기 오지 않는다.
 */

export const FAILURE_DOMAINS = [
  'test',
  'verification',
  'bundle',
  'context',
  'eval',
  'a11y',
  'browser',
  'package-surface',
] as const;

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
      tests: countSchema,
      testCases: countSchema,
      bundles: countSchema,
      contexts: countSchema,
      evals: countSchema,
      designSystem: z.boolean(),
      packageSurfaces: countSchema,
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
const exitText = (exitCode: number | null) => (exitCode === null ? '' : ` (exit ${exitCode})`);

const observationFailure = (observation: Observation): RunFailure | null => {
  if (observation.outcome !== 'fail') return null;
  const base = { id: observation.id, scope: observation.scope };
  return observation.domain === 'verification'
    ? {
        ...base,
        domain: 'verification',
        reason: `${observation.kind} ${observation.status}${exitText(observation.exitCode)}`,
      }
    : { ...base, domain: observation.domain, reason: `${observation.id} 의 원본 판정이 fail 이다` };
};

const failuresOf = (artifact: RunArtifact): RunFailure[] => {
  const failures: RunFailure[] = [];
  for (const observation of artifact.observations) {
    const failure = observationFailure(observation);
    if (failure) failures.push(failure);
  }
  for (const summary of artifact.tests) {
    const { execution } = summary;
    const base = { domain: 'test' as const, id: summary.sourceId, scope: summary.project };
    if (execution.status === 'failed' || execution.status === 'timeout') {
      failures.push({
        ...base,
        reason: clip(
          `실행이 ${execution.status} 로 끝났다${exitText(execution.exitCode)} — ${summary.outcomeReason}`,
        ),
      });
    } else if (summary.outcome === 'fail') {
      failures.push({ ...base, reason: summary.outcomeReason });
    }
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
  for (const surface of artifact.packageSurfaces) {
    const base = { domain: 'package-surface' as const, id: surface.name, scope: surface.name };
    if (surface.build === 'partial' || surface.build === 'missing') {
      const present = surface.emitted.filter((entry) => entry.status === 'present').length;
      failures.push({
        ...base,
        reason: `${surface.name} build ${surface.build} — 산출물 ${present}/${surface.emitted.length} 개만 있다`,
      });
    }
    if (surface.tokensCopy?.identicalToDesignTokens === false) {
      failures.push({
        ...base,
        reason: `${surface.name} ${surface.tokensCopy.path} 이 design-tokens 원본과 다르다`,
      });
    }
    if (surface.catalog?.regenerated === 'differs') {
      failures.push({ ...base, reason: `${surface.name} catalog 재생성 결과가 dist 와 다르다` });
    }
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
    tests: artifact.tests.length,
    testCases: artifact.tests.reduce((sum, summary) => sum + summary.cases.length, 0),
    bundles: artifact.bundles.length,
    contexts: artifact.contexts.length,
    evals: artifact.evals.length,
    designSystem: artifact.designSystem !== null,
    packageSurfaces: artifact.packageSurfaces.length,
  },
  failures: failuresOf(artifact),
  evals: artifact.evals.map((evalRun) => ({
    sourceId: evalRun.sourceId,
    executorClass: evalRun.executorClass,
    notices: evalRun.notices.map((notice) => notice.code),
  })),
});
