import {
  type BaselinePointer,
  baselinePointerSchema,
  EMPTY_BASELINE_POINTER,
  publicIndexSchema,
} from '@berrypjh/observability-contracts';

import { missingAs, readJson, replaceJson, withLock } from './safe-fs';
import { readRun } from './store';

/**
 * baseline 포인터. profile 마다 사람이 고른 run ID 하나를 store 와 public 에 같은 내용으로 쓴다.
 * run 파일은 읽기만 하고, 최신 실행을 자동으로 고르지 않고, 다른 run 으로 바꾸려면 replace 가 필요하다.
 */

export const BASELINE_POINTER_PATH = 'baseline.json';

export class BaselineConflictError extends Error {}

/** 파일이 없으면 빈 포인터다. JSON·계약이 틀리면 `ArtifactError` 를 그대로 던진다 — 없음과 다르다. */
export const readBaselinePointer = (root: string): Promise<BaselinePointer> =>
  readJson(root, BASELINE_POINTER_PATH, baselinePointerSchema).catch(
    missingAs<BaselinePointer>(EMPTY_BASELINE_POINTER),
  );

type SetBaselineInput = {
  storeRoot: string;
  publicRoot: string;
  runId: string;
  now: () => Date;
  replace: boolean;
};

export type SetBaselineResult = { changed: boolean; pointer: BaselinePointer };

const assertExported = async (publicRoot: string, runId: string) => {
  const index = await readJson(publicRoot, 'index.json', publicIndexSchema).catch(missingAs(null));
  if (!index?.runs.some((run) => run.id === runId)) {
    throw new Error(`${runId} 는 export 되지 않았습니다 — pnpm quality:export --run-id=${runId}`);
  }
};

export const setBaseline = async ({
  storeRoot,
  publicRoot,
  runId,
  now,
  replace,
}: SetBaselineInput): Promise<SetBaselineResult> => {
  const { metadata } = await readRun(storeRoot, runId);
  await assertExported(publicRoot, runId);

  return withLock(storeRoot, async () => {
    const pointer = await readBaselinePointer(storeRoot);
    const existing = pointer.pointers.find((entry) => entry.profile === metadata.profile);
    if (existing?.runId === runId) return { changed: false, pointer };
    if (existing && !replace) {
      throw new BaselineConflictError(
        `${metadata.profile} baseline 은 이미 ${existing.runId} 입니다 — 바꾸려면 --replace-baseline`,
      );
    }
    const entry = { profile: metadata.profile, runId, setAt: now().toISOString() };
    const next = baselinePointerSchema.parse({
      version: 1,
      pointers: [...pointer.pointers.filter((item) => item !== existing), entry],
      history: [...pointer.history, { ...entry, replaced: existing?.runId ?? null }],
    });
    await replaceJson(storeRoot, BASELINE_POINTER_PATH, next);
    await replaceJson(publicRoot, BASELINE_POINTER_PATH, next);
    return { changed: true, pointer: next };
  });
};
