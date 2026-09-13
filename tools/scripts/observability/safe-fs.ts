import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import { isSafeRelativePath } from '@berrypjh/observability-contracts';

import { z } from 'zod';

export const MAX_ARTIFACT_BYTES = 5 * 1024 * 1024;

/** root 밖으로 나가는 경로, 또는 symlink 를 지나는 경로. */
export class BoundaryError extends Error {}

export type ArtifactErrorKind =
  | 'missing'
  | 'too-large'
  | 'invalid-json'
  | 'invalid-schema'
  | 'corrupt';

/** 읽은 파일을 믿을 수 없는 이유. 종류마다 화면·CLI 가 다르게 말한다. */
export class ArtifactError extends Error {
  readonly kind: ArtifactErrorKind;

  constructor(kind: ArtifactErrorKind, message: string) {
    super(message);
    this.kind = kind;
  }
}

export const sha256 = (content: string) => createHash('sha256').update(content).digest('hex');

export const isMissing = (error: unknown) => (error as NodeJS.ErrnoException).code === 'ENOENT';

/** `missing` 이면 fallback, 나머지 오류는 그대로 던진다. */
export const missingAs =
  <T>(fallback: T) =>
  (error: unknown): T => {
    if (error instanceof ArtifactError && error.kind === 'missing') return fallback;
    throw error;
  };

/**
 * root 아래 상대 경로의 실제 경로. root 는 realpath 로 고정하고, 경로의 어느 segment 도
 * symlink 일 수 없으므로 결과가 root 밖으로 나가지 못한다.
 */
export const resolveInside = async (root: string, relative: string): Promise<string> => {
  if (!isSafeRelativePath(relative))
    throw new BoundaryError(`${relative} is not a safe relative path`);
  const realRoot = await fs.realpath(root);
  let current = realRoot;
  for (const segment of relative.split('/')) {
    current = path.join(current, segment);
    const stat = await fs.lstat(current).catch((error: unknown) => {
      if (isMissing(error)) return null;
      throw error;
    });
    if (stat === null) break;
    if (stat.isSymbolicLink()) throw new BoundaryError(`${relative} passes through a symlink`);
  }
  return path.join(realRoot, relative);
};

export const readText = async (root: string, relative: string, maxBytes = MAX_ARTIFACT_BYTES) => {
  const file = await resolveInside(root, relative).catch((error: unknown) => {
    if (isMissing(error)) throw new ArtifactError('missing', `${root} does not exist`);
    throw error;
  });
  const stat = await fs.stat(file).catch((error: unknown) => {
    if (isMissing(error)) throw new ArtifactError('missing', `${relative} does not exist`);
    throw error;
  });
  if (stat.size > maxBytes) {
    throw new ArtifactError('too-large', `${relative} is ${stat.size} bytes (limit ${maxBytes})`);
  }
  return fs.readFile(file, 'utf8');
};

export const parseJson = <T>(label: string, text: string, schema: z.ZodType<T>): T => {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new ArtifactError('invalid-json', `${label} is not valid JSON`);
  }
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new ArtifactError(
      'invalid-schema',
      `${label} does not match the contract:\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
};

/** 크기 상한 → JSON → schema 순서로 검증한 값만 돌려준다. */
export const readJson = async <T>(
  root: string,
  relative: string,
  schema: z.ZodType<T>,
  maxBytes = MAX_ARTIFACT_BYTES,
): Promise<T> => parseJson(relative, await readText(root, relative, maxBytes), schema);

const serialize = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

export type WrittenFile = { path: string; sha256: string; bytes: number };

/** 새 파일만 만든다 (`wx`). 직렬화는 디스크를 건드리기 전에 끝낸다. */
export const writeJson = async (
  root: string,
  relative: string,
  value: unknown,
): Promise<WrittenFile> => {
  const text = serialize(value);
  const file = await resolveInside(root, relative);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, text, { flag: 'wx' });
  return { path: relative, sha256: sha256(text), bytes: Buffer.byteLength(text) };
};

/** 같은 디렉터리의 임시 파일에 쓰고 rename 한다. 읽는 쪽은 이전 파일이나 새 파일만 본다. */
export const replaceJson = async (
  root: string,
  relative: string,
  value: unknown,
): Promise<void> => {
  const text = serialize(value);
  const file = await resolveInside(root, relative);
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.tmp-${process.pid}-${randomUUID()}`;
  try {
    await fs.writeFile(temp, text, { flag: 'wx' });
    await fs.rename(temp, file);
  } finally {
    await fs.rm(temp, { force: true });
  }
};

/** 디렉터리 lock. 이미 있으면 다른 writer 가 쓰는 중이다 — 기다리지도 지우지도 않는다. */
export class LockedError extends Error {}

export const withLock = async <T>(dir: string, work: () => Promise<T>): Promise<T> => {
  const lock = path.join(dir, '.lock');
  try {
    await fs.mkdir(lock);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      throw new LockedError(
        `${lock} exists: another writer is running, or remove it after a crash`,
      );
    }
    throw error;
  }
  try {
    return await work();
  } finally {
    await fs.rm(lock, { recursive: true, force: true });
  }
};
