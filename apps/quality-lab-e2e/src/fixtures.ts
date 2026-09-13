import {
  baselinePointerSchema,
  publicIndexSchema,
  publicRunArtifactSchema,
  type RunArtifact,
  summarizeRun,
} from '@berrypjh/observability-contracts';

import type { Page } from '@playwright/test';

/**
 * E2E 전용 공개 JSON. 계약 schema 로 만들고 `page.route` 로만 주입한다 — `public/observability`
 * 에 쓰지 않으므로 실측 run 으로 배포되지 않는다. 앱 소스를 import 하지 않는다.
 */

const SHA = 'a'.repeat(40);
export const OTHER_SHA = 'b'.repeat(40);
const HASH = 'c'.repeat(64);

export const CX = 'bundle.size-limit.react-ui.cx-only';

type Overrides = Record<string, unknown>;

export const cxOnly = (value: number | null, overrides: Overrides = {}) => ({
  id: CX,
  caseName: '@berrypjh/react-ui — cx only',
  role: 'budget',
  method: 'size-limit',
  tool: { name: 'size-limit', version: '12.1.0' },
  package: '@berrypjh/react-ui',
  entry: 'libs/react-ui/dist/index.esm.js',
  importSpec: '{ cx }',
  externals: ['react', 'react-dom', 'react/jsx-runtime'],
  target: 'es2022',
  compression: 'brotli',
  adjustment: 'size-limit-empty-project-subtracted',
  unit: 'bytes',
  configHash: HASH,
  ...(value === null
    ? {
        availability: 'unavailable',
        value: null,
        reason: 'libs/react-ui/dist/index.esm.js 가 없다',
        budget: {
          limitBytes: 11000,
          limitSource: '11 KB',
          headroomBytes: null,
          outcome: null,
          toolPassed: null,
        },
      }
    : {
        availability: 'available',
        value,
        reason: null,
        budget: {
          limitBytes: 11000,
          limitSource: '11 KB',
          headroomBytes: 11000 - value,
          outcome: value <= 11000 ? 'pass' : 'fail',
          toolPassed: value <= 11000,
        },
      }),
  ...overrides,
});

export const coreRun = (
  runId: string,
  bundles: unknown[],
  { startedAt, sha = SHA }: { startedAt: string; sha?: string },
): RunArtifact =>
  publicRunArtifactSchema.parse({
    metadata: {
      schemaVersion: 1,
      runId,
      state: 'complete',
      profile: 'core',
      scope: ['workspace'],
      source: {
        kind: 'local',
        sha,
        time: '2026-09-13T13:16:29+09:00',
        ciRunId: 'unknown',
        dirty: false,
        workingTreeHash: HASH,
        lockfileHash: HASH,
      },
      collection: { sha, startedAt, finishedAt: startedAt },
      tools: { node: 'v24.20.0' },
      cache: 'disabled',
    },
    inventory: null,
    observations: [],
    tests: [],
    bundles,
    contexts: [],
    evals: [],
    designSystem: null,
    packageSurfaces: [],
    accessibility: [],
  });

export const COMPARE_RUNS = [
  coreRun('run-base', [cxOnly(10574)], { startedAt: '2026-09-13T08:00:00.000Z' }),
  coreRun('run-gzip', [cxOnly(9000, { compression: 'gzip' })], {
    startedAt: '2026-09-13T08:30:00.000Z',
  }),
  coreRun('run-current', [cxOnly(10474)], {
    startedAt: '2026-09-13T09:00:00.000Z',
    sha: OTHER_SHA,
  }),
];

export const POINTER = baselinePointerSchema.parse({
  version: 1,
  pointers: [{ profile: 'core', runId: 'run-base', setAt: '2026-09-13T10:00:00.000Z' }],
  history: [
    { profile: 'core', runId: 'run-base', setAt: '2026-09-13T10:00:00.000Z', replaced: null },
  ],
});

export type PublicFiles = Record<string, unknown>;

/** index·run·요약 한 벌. `extra` 로 baseline 포인터나 깨진 파일(문자열)을 덧붙인다. */
export const publicFiles = (runs: RunArtifact[], extra: PublicFiles = {}): PublicFiles => {
  const files: PublicFiles = {
    '/observability/index.json': publicIndexSchema.parse({
      version: 1,
      runs: runs.map(({ metadata: { runId } }) => ({
        id: runId,
        path: `runs/${runId}.json`,
        summary: `runs/${runId}.summary.json`,
      })),
    }),
  };
  for (const run of runs) {
    const { runId } = run.metadata;
    files[`/observability/runs/${runId}.json`] = run;
    files[`/observability/runs/${runId}.summary.json`] = summarizeRun(run);
  }
  return { ...files, ...extra };
};

/** `/observability/*` 요청만 가로챈다. 없는 파일은 404, 문자열은 그대로(깨진 JSON 재현) 응답한다. */
export const serveObservability = async (page: Page, files: PublicFiles) => {
  await page.route('**/observability/**', async (route) => {
    const { pathname } = new URL(route.request().url());
    if (!(pathname in files)) {
      await route.fulfill({ status: 404, contentType: 'text/plain', body: 'not found' });
      return;
    }
    const body = files[pathname];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
  });
};
