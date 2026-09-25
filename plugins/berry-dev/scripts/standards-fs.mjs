/**
 * standards CLI 의 파일 IO. 쓰기 · 삭제 · temp · lock 은 모두 `.claude/rules/_generated/` 안에서만 한다.
 *
 * `.claude` 와 `.claude/rules` 는 project setup 이 만든 실제 디렉터리여야 하고, 여기서는 만들지 않는다.
 * 경로를 이루는 어느 단계도 symlink(Windows junction 포함)일 수 없다.
 */
import { randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { lstat, mkdir, open, readdir, realpath, rename, rm, stat, unlink } from 'node:fs/promises';
import path from 'node:path';

import { StandardsError } from './standards-core.mjs';

export const CONFIG_PATH = '.claude/standards.json';
export const GENERATED_PATH = '.claude/rules/_generated';

const LOCK = '.lock';
const TEMP_PREFIX = '.tmp-';
const OWNED_NAME = /^(?:[a-z0-9]+(?:-[a-z0-9]+)*\.md|manifest\.json)$/;

const fail = (kind, message) => {
  throw new StandardsError(kind, message);
};

const lstatOrNull = (file) =>
  lstat(file).catch((error) => (error.code === 'ENOENT' ? null : Promise.reject(error)));

/** 쓰거나 지울 이름은 rule 파일 · manifest 뿐이다. 구분자 · traversal 이 끼어들 수 없다. */
const ownedFile = (dir, name) => {
  if (!OWNED_NAME.test(name)) {
    fail('ownership', `refusing to touch ${GENERATED_PATH}/<invalid name>`);
  }
  return path.join(dir, name);
};

/** `--project` 의 실제 경로. 디렉터리가 아니면 오류다. */
export const resolveProject = async (root) => {
  const real = await realpath(root).catch(() => fail('usage', '--project does not exist'));
  if (!(await stat(real)).isDirectory()) fail('usage', '--project is not a directory');
  return real;
};

/** `_generated` 의 위치와 존재 여부. 조상은 실제 디렉터리여야 하고, 결과가 project 밖으로 나가지 않는다. */
export const locateGenerated = async (project) => {
  for (const relative of ['.claude', '.claude/rules']) {
    const entry = await lstatOrNull(path.join(project, relative));
    if (!entry) fail('setup', `${relative} does not exist; project setup creates it`);
    if (entry.isSymbolicLink() || !entry.isDirectory()) {
      fail('ownership', `${relative} must be a real directory, not a link`);
    }
  }
  const dir = path.join(project, GENERATED_PATH);
  const entry = await lstatOrNull(dir);
  if (entry && (entry.isSymbolicLink() || !entry.isDirectory())) {
    fail('ownership', `${GENERATED_PATH} must be a real directory, not a link`);
  }
  if ((await realpath(path.dirname(dir))) !== path.dirname(dir)) {
    fail('ownership', `${GENERATED_PATH} resolves outside the project`);
  }
  return { dir, exists: Boolean(entry) };
};

/** `.claude/standards.json` 을 읽는다. symlink 는 따라가지 않는다. */
export const readConfig = async (project) => {
  const file = path.join(project, CONFIG_PATH);
  const entry = await lstatOrNull(file);
  if (!entry) fail('config', `${CONFIG_PATH} does not exist`);
  if (entry.isSymbolicLink() || !entry.isFile()) {
    fail('config', `${CONFIG_PATH} must be a regular file`);
  }
  const text = await readNoFollow(file);
  try {
    return JSON.parse(text.toString('utf8'));
  } catch {
    return fail('config', `${CONFIG_PATH} is not valid JSON`);
  }
};

/** O_NOFOLLOW 로 연다. 확인과 읽기 사이에 symlink 로 바뀌면 여기서 실패한다(POSIX). */
const readNoFollow = async (file) => {
  const handle = await open(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    return await handle.readFile();
  } finally {
    await handle.close();
  }
};

/**
 * `_generated` 의 항목 전부. 파일은 bytes 를 함께 읽는다.
 * kind: `file` · `symlink` · `lock` · `other`(디렉터리 등). sync 가 잡은 lock 은 `holdingLock` 으로 뺀다.
 */
export const scanGenerated = async (dir, { holdingLock = false } = {}) => {
  const entries = new Map();
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (holdingLock && entry.name === LOCK) continue;
    if (entry.isSymbolicLink()) entries.set(entry.name, { kind: 'symlink' });
    else if (entry.isFile()) {
      entries.set(entry.name, {
        kind: 'file',
        bytes: await readNoFollow(path.join(dir, entry.name)),
      });
    } else entries.set(entry.name, { kind: entry.name === LOCK ? 'lock' : 'other' });
  }
  return entries;
};

/** 부모(`.claude/rules`)는 이미 있어야 한다. recursive 로 만들지 않는다. */
export const createGeneratedDir = (dir) => mkdir(dir);

/** 같은 디렉터리의 temp 파일에 쓰고 rename 한다. 파일 하나 단위로만 원자적이다. */
export const writeGenerated = async (dir, name, content) => {
  const target = ownedFile(dir, name);
  const temp = path.join(dir, `${TEMP_PREFIX}${process.pid}-${randomUUID()}`);
  try {
    const handle = await open(temp, 'wx');
    try {
      await handle.writeFile(content, 'utf8');
    } finally {
      await handle.close();
    }
    await rename(temp, target);
  } finally {
    await rm(temp, { force: true });
  }
};

export const removeGenerated = (dir, name) => unlink(ownedFile(dir, name));

/** `_generated/.lock` 디렉터리 lock. 이미 있으면 다른 sync 가 돌거나 중단된 흔적이다 — 기다리지도 지우지도 않는다. */
export const withLock = async (dir, work) => {
  const lock = path.join(dir, LOCK);
  try {
    await mkdir(lock);
  } catch (error) {
    if (error.code === 'EEXIST') {
      fail(
        'ownership',
        `${GENERATED_PATH}/${LOCK} exists: another sync is running, or remove it after a crash`,
      );
    }
    throw error;
  }
  try {
    return await work();
  } finally {
    await rm(lock, { recursive: true, force: true });
  }
};
