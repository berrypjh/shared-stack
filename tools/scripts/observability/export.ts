import fs from 'node:fs/promises';

import {
  isPublicEvidencePath,
  publicIndexSchema,
  publicRunArtifactSchema,
  type PublicRunIndex,
  publicRunPath,
  publicSummaryPath,
  type RunArtifact,
  runSummarySchema,
  SCHEMA_VERSION,
  summarizeRun,
} from '@berrypjh/observability-contracts';

import { missingAs, readJson, replaceJson, withLock } from './safe-fs';
import { readRun } from './store';

/** Vite 가 `/observability/*` 로 서빙하는 디렉터리. `.gitignore` 에 있다. */
export const PUBLIC_ROOT = 'apps/quality-lab/public/observability';

/** 공개할 수 없는 evidence(raw·tmp·held-out·credential 경로)를 걷어낸다. 값과 상태는 그대로다. */
export const toPublicArtifact = (artifact: RunArtifact): RunArtifact =>
  publicRunArtifactSchema.parse({
    ...artifact,
    observations: artifact.observations.map((observation) => ({
      ...observation,
      evidence: observation.evidence.filter(
        (evidence) => !('path' in evidence) || isPublicEvidencePath(evidence.path),
      ),
    })),
  });

type ExportInput = { storeRoot: string; publicRoot: string; runId: string };

/**
 * store 의 run 하나를 공개한다. 입력(run·기존 index)을 전부 검증한 뒤에만 쓰고,
 * run 파일 → index 순서로 교체한다. 실패하면 기존 public 파일은 그대로다.
 */
export const exportRun = async ({ storeRoot, publicRoot, runId }: ExportInput): Promise<string> => {
  const artifact = toPublicArtifact(await readRun(storeRoot, runId));
  const summary = runSummarySchema.parse(summarizeRun(artifact));
  await fs.mkdir(publicRoot, { recursive: true });

  return withLock(publicRoot, async () => {
    const index = await readJson(publicRoot, 'index.json', publicIndexSchema).catch(
      missingAs<PublicRunIndex>({ version: SCHEMA_VERSION, runs: [] }),
    );
    const entry = { id: runId, path: publicRunPath(runId), summary: publicSummaryPath(runId) };
    const runs = index.runs.some((run) => run.id === runId)
      ? index.runs.map((run) => (run.id === runId ? entry : run))
      : [...index.runs, entry];
    const nextIndex = publicIndexSchema.parse({ version: SCHEMA_VERSION, runs });

    // run → 요약 → index 순서. index 가 가리키는 파일은 이미 있다.
    await replaceJson(publicRoot, publicRunPath(runId), artifact);
    await replaceJson(publicRoot, publicSummaryPath(runId), summary);
    await replaceJson(publicRoot, 'index.json', nextIndex);
    return publicRunPath(runId);
  });
};
