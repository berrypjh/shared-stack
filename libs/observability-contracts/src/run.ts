import { z } from 'zod';

import { bundleMeasurementSchema } from './bundle.js';
import { contextMeasurementSchema } from './context.js';
import { isPublicEvidencePath } from './evidence.js';
import { DOMAINS, observationSchema } from './observation.js';
import {
  commandIdSchema,
  countSchema,
  gitShaSchema,
  isoTimeSchema,
  orUnknown,
  relativePathSchema,
  runIdSchema,
  schemaVersionSchema,
  scopeSchema,
  sha256Schema,
} from './primitives.js';
import { testSummarySchema } from './test-summary.js';

export const RUN_STATES = ['running', 'complete', 'partial', 'failed', 'cancelled'] as const;
/** `static` 은 정의만 읽는다. `core` 는 test·check·bundle·context 를 수집한다. */
export const PROFILES = ['static', 'core'] as const;
export const SOURCE_KINDS = ['local', 'ci'] as const;
export const CACHE_STATES = ['hit', 'miss', 'mixed', 'disabled'] as const;

/** 측정 대상 코드의 출처. 수집 시점(`collection`)과 따로 둔다. */
export const sourceSchema = z.strictObject({
  kind: orUnknown(z.enum(SOURCE_KINDS)),
  sha: orUnknown(gitShaSchema),
  /** source commit 시각. */
  time: orUnknown(isoTimeSchema),
  /** CI 원천 run ID. local 수집이면 unknown. */
  ciRunId: orUnknown(z.string().regex(/^[\w.-]{1,64}$/)),
  dirty: orUnknown(z.boolean()),
  workingTreeHash: orUnknown(sha256Schema),
  lockfileHash: orUnknown(sha256Schema),
});

/** 수집을 수행한 수집기 코드와 시각. */
export const collectionSchema = z.strictObject({
  sha: orUnknown(gitShaSchema),
  startedAt: isoTimeSchema,
  finishedAt: isoTimeSchema.nullable(),
});

export const runMetadataSchema = z
  .strictObject({
    schemaVersion: schemaVersionSchema,
    runId: runIdSchema,
    state: z.enum(RUN_STATES),
    profile: z.enum(PROFILES),
    scope: z.array(scopeSchema).min(1),
    source: sourceSchema,
    collection: collectionSchema,
    tools: z.record(z.string().regex(/^[@\w./-]{1,64}$/), orUnknown(z.string().min(1).max(64))),
    cache: orUnknown(z.enum(CACHE_STATES)),
  })
  .superRefine((metadata, ctx) => {
    const { startedAt, finishedAt } = metadata.collection;
    if ((metadata.state === 'running') !== (finishedAt === null)) {
      ctx.addIssue({
        code: 'custom',
        path: ['collection', 'finishedAt'],
        message: 'only a running collection has no finishedAt',
      });
    }
    if (finishedAt !== null && Date.parse(finishedAt) < Date.parse(startedAt)) {
      ctx.addIssue({
        code: 'custom',
        path: ['collection', 'finishedAt'],
        message: 'finishedAt precedes startedAt',
      });
    }
  });

/** static profile 이 읽는 정의. 실행 결과가 아니라 등록된 사실이다. */
export const inventorySchema = z.strictObject({
  packages: z.array(
    z.strictObject({
      name: z.string().regex(/^@?[\w.-]+(\/[\w.-]+)?$/),
      path: relativePathSchema,
      private: z.boolean(),
      exports: z.array(z.string().min(1).max(200)),
    }),
  ),
  themes: z.array(z.string().regex(/^[a-z][a-zA-Z0-9]*$/)),
  /** root package.json script 이름. 본문은 싣지 않는다. */
  scripts: z.array(z.string().regex(/^[\w:.-]+$/)),
  /** 수집기가 실행할 수 있게 등록된 명령. */
  commands: z.array(
    z.strictObject({
      id: commandIdSchema,
      domain: z.enum(DOMAINS),
      argv: z.array(z.string().regex(/^[\w@./:=-]+$/)).min(1),
    }),
  ),
  workflows: z.array(z.strictObject({ path: relativePathSchema, sha256: sha256Schema })),
});

export const runArtifactSchema = z
  .strictObject({
    metadata: runMetadataSchema,
    inventory: inventorySchema.nullable(),
    observations: z.array(observationSchema),
    /** runner report 에서 온 test 결과. static profile 은 비어 있다. */
    tests: z.array(testSummarySchema),
    /** size-limit budget·treeshake 진단. 주석의 과거 숫자는 여기 들어오지 않는다. */
    bundles: z.array(bundleMeasurementSchema),
    /** 시나리오·variant·agent 입력 token. */
    contexts: z.array(contextMeasurementSchema),
  })
  .superRefine((artifact, ctx) => {
    const seen = new Set<string>();
    artifact.observations.forEach((observation, index) => {
      if (seen.has(observation.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['observations', index, 'id'],
          message: `duplicate observation id ${observation.id}`,
        });
      }
      seen.add(observation.id);
    });
  });

/** 공개 export 는 같은 모양이되 raw·trace·held-out·credential 경로를 담을 수 없다. */
export const publicRunArtifactSchema = runArtifactSchema.superRefine((artifact, ctx) => {
  artifact.observations.forEach((observation, i) =>
    observation.evidence.forEach((evidence, j) => {
      if ('path' in evidence && !isPublicEvidencePath(evidence.path)) {
        ctx.addIssue({
          code: 'custom',
          path: ['observations', i, 'evidence', j, 'path'],
          message: `${evidence.path} is not publishable`,
        });
      }
    }),
  );
  const paths = [
    ...[...(artifact.inventory?.packages ?? []), ...(artifact.inventory?.workflows ?? [])].map(
      (entry) => entry.path,
    ),
    ...artifact.tests.flatMap((summary) => summary.cases.map((testCase) => testCase.file)),
    ...artifact.contexts.flatMap((measurement) => measurement.files),
  ];
  for (const path of paths) {
    if (!isPublicEvidencePath(path)) {
      ctx.addIssue({ code: 'custom', path: ['inventory'], message: `${path} is not publishable` });
    }
  }
});

export const storeRunPath = (id: string) => `runs/${id}/run.json`;
export const publicRunPath = (id: string) => `runs/${id}.json`;

/** index 는 version·id·상대 경로만 가진다. 경로는 그 id 의 artifact 만 가리킬 수 있다. */
const indexSchema = (pathFor: (id: string) => string) =>
  z
    .strictObject({
      version: schemaVersionSchema,
      runs: z.array(z.strictObject({ id: runIdSchema, path: relativePathSchema })),
    })
    .superRefine((index, ctx) => {
      const seen = new Set<string>();
      index.runs.forEach((run, i) => {
        if (seen.has(run.id)) {
          ctx.addIssue({
            code: 'custom',
            path: ['runs', i, 'id'],
            message: `duplicate run id ${run.id}`,
          });
        }
        seen.add(run.id);
        if (run.path !== pathFor(run.id)) {
          ctx.addIssue({
            code: 'custom',
            path: ['runs', i, 'path'],
            message: `run ${run.id} must point to ${pathFor(run.id)}`,
          });
        }
      });
    });

export const storeIndexSchema = indexSchema(storeRunPath);
export const publicIndexSchema = indexSchema(publicRunPath);

/** run 디렉터리에서 마지막에 쓰는 파일. 목록에 없는 파일은 run 에 속하지 않는다. */
export const runManifestSchema = z.strictObject({
  schemaVersion: schemaVersionSchema,
  runId: runIdSchema,
  state: z.enum(RUN_STATES),
  files: z
    .array(z.strictObject({ path: relativePathSchema, sha256: sha256Schema, bytes: countSchema }))
    .min(1),
});

export type RunState = (typeof RUN_STATES)[number];
export type Profile = (typeof PROFILES)[number];
export type RunSource = z.infer<typeof sourceSchema>;
export type RunMetadata = z.infer<typeof runMetadataSchema>;
export type Inventory = z.infer<typeof inventorySchema>;
export type RunArtifact = z.infer<typeof runArtifactSchema>;
export type RunIndex = z.infer<typeof storeIndexSchema>;
export type RunManifest = z.infer<typeof runManifestSchema>;
