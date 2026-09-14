import fs from 'node:fs/promises';
import path from 'node:path';

import {
  type RunArtifact,
  runArtifactSchema,
  type RunIndex,
  runManifestSchema,
  SCHEMA_VERSION,
  storeIndexSchema,
  storeRunPath,
} from '@berrypjh/observability-contracts';

import {
  ArtifactError,
  isMissing,
  missingAs,
  parseJson,
  readJson,
  readText,
  replaceJson,
  resolveInside,
  sha256,
  withLock,
  writeJson,
  type WrittenFile,
} from './safe-fs';

export { LockedError } from './safe-fs';

/** 수집 run 저장소. `.gitignore` 의 `tmp` 가 덮으므로 source control 에 들어가지 않는다. */
export const STORE_ROOT = 'tmp/quality-lab';

const INDEX = 'index.json';

export class DuplicateRunError extends Error {}

export type RawFile = { path: string; value: unknown };
export type RunInput = { artifact: RunArtifact; raw: RawFile[] };

/** index 가 없으면 빈 index 다. 있는데 깨졌으면 그대로 실패한다. */
export const readStoreIndex = (storeRoot: string): Promise<RunIndex> =>
  readJson(storeRoot, INDEX, storeIndexSchema).catch(
    missingAs<RunIndex>({ version: SCHEMA_VERSION, runs: [] }),
  );

const exists = (file: string) =>
  fs.lstat(file).then(
    () => true,
    (error: unknown) => {
      if (isMissing(error)) return false;
      throw error;
    },
  );

/**
 * run 하나를 원자적으로 추가한다.
 *
 * lock 을 쥔 채 staging 디렉터리에 raw → run.json → manifest.json 순서로 쓰고, rename 으로
 * 공개한 뒤 index 를 마지막에 교체한다. 실패하면 staging 만 지우므로 기존 run·index 는 그대로다.
 */
export const writeRun = async (storeRoot: string, { artifact, raw }: RunInput): Promise<void> => {
  const parsed = runArtifactSchema.parse(artifact);
  const { runId, state } = parsed.metadata;
  await fs.mkdir(path.join(storeRoot, 'runs'), { recursive: true });

  await withLock(storeRoot, async () => {
    const index = await readStoreIndex(storeRoot);
    const target = await resolveInside(storeRoot, `runs/${runId}`);
    if (index.runs.some((run) => run.id === runId) || (await exists(target))) {
      throw new DuplicateRunError(`run ${runId} already exists`);
    }

    const staging = await fs.mkdtemp(path.join(storeRoot, 'runs', `.staging-${runId}-`));
    try {
      const files: WrittenFile[] = [];
      for (const file of raw) files.push(await writeJson(staging, `raw/${file.path}`, file.value));
      files.push(await writeJson(staging, 'run.json', parsed));
      const manifest = runManifestSchema.parse({
        schemaVersion: SCHEMA_VERSION,
        runId,
        state,
        files,
      });
      await writeJson(staging, 'manifest.json', manifest);
      await fs.rename(staging, target);
    } finally {
      await fs.rm(staging, { recursive: true, force: true });
    }

    const runs = [...index.runs, { id: runId, path: storeRunPath(runId) }];
    await replaceJson(storeRoot, INDEX, storeIndexSchema.parse({ version: SCHEMA_VERSION, runs }));
  });
};

/** index → manifest → run.json 순서로 읽고, run.json 이 manifest 해시와 같을 때만 믿는다. */
export const readRun = async (storeRoot: string, runId: string): Promise<RunArtifact> => {
  const entry = (await readStoreIndex(storeRoot)).runs.find((run) => run.id === runId);
  if (!entry) throw new ArtifactError('missing', `run ${runId} is not in ${INDEX}`);

  const manifest = await readJson(storeRoot, `runs/${runId}/manifest.json`, runManifestSchema);
  const recorded = manifest.files.find((file) => file.path === 'run.json');
  const text = await readText(storeRoot, entry.path);
  if (recorded?.sha256 !== sha256(text)) {
    throw new ArtifactError('corrupt', `${entry.path} does not match its manifest`);
  }
  return parseJson(entry.path, text, runArtifactSchema);
};
