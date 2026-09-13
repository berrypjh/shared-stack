import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { fixtureArtifact, tempDir } from './__fixtures__/fixtures';
import { ArtifactError, BoundaryError } from './safe-fs';
import { DuplicateRunError, LockedError, readRun, readStoreIndex, writeRun } from './store';

let store: string;

beforeEach(async () => {
  store = await tempDir('store');
});

afterEach(async () => {
  await fs.rm(store, { recursive: true, force: true });
});

const runEntries = async () => (await fs.readdir(path.join(store, 'runs'))).sort();
const indexText = () => fs.readFile(path.join(store, 'index.json'), 'utf8');

const kindOf = async (promise: Promise<unknown>) => {
  try {
    await promise;
    return 'ok';
  } catch (error) {
    return error instanceof ArtifactError ? error.kind : String(error);
  }
};

describe('writeRun', () => {
  it('run 을 쓰고 manifest 로 검증해 다시 읽는다', async () => {
    const artifact = fixtureArtifact('run-a');
    await writeRun(store, { artifact, raw: [{ path: 'inventory.json', value: { ok: true } }] });

    expect(await readRun(store, 'run-a')).toEqual(artifact);
    const manifest = JSON.parse(
      await fs.readFile(path.join(store, 'runs/run-a/manifest.json'), 'utf8'),
    );
    expect(manifest.files.map((file: { path: string }) => file.path).sort()).toEqual([
      'raw/inventory.json',
      'run.json',
    ]);
    expect(await readStoreIndex(store)).toEqual({
      version: 1,
      runs: [{ id: 'run-a', path: 'runs/run-a/run.json' }],
    });
  });

  it('같은 run id 는 다시 쓰지 않고 기존 run 을 보존한다', async () => {
    await writeRun(store, { artifact: fixtureArtifact('run-a'), raw: [] });
    const before = await indexText();

    await expect(
      writeRun(store, { artifact: fixtureArtifact('run-a'), raw: [] }),
    ).rejects.toBeInstanceOf(DuplicateRunError);
    expect(await indexText()).toBe(before);
    expect(await readRun(store, 'run-a')).toEqual(fixtureArtifact('run-a'));
  });

  it('동시에 같은 id 를 쓰면 하나만 이긴다', async () => {
    const results = await Promise.allSettled([
      writeRun(store, { artifact: fixtureArtifact('run-a'), raw: [] }),
      writeRun(store, { artifact: fixtureArtifact('run-a'), raw: [] }),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );
    expect(
      rejected?.reason instanceof LockedError || rejected?.reason instanceof DuplicateRunError,
    ).toBe(true);
    expect((await readStoreIndex(store)).runs).toHaveLength(1);
  });

  it('다른 writer 의 lock 이 있으면 쓰지 않고 그 lock 을 지우지 않는다', async () => {
    await fs.mkdir(path.join(store, '.lock'), { recursive: true });

    await expect(
      writeRun(store, { artifact: fixtureArtifact('run-a'), raw: [] }),
    ).rejects.toBeInstanceOf(LockedError);
    expect(existsSync(path.join(store, 'runs/run-a'))).toBe(false);
    expect(existsSync(path.join(store, '.lock'))).toBe(true);
  });

  it('쓰는 도중 실패하면 staging 을 지우고 기존 run·index 를 보존한다', async () => {
    await writeRun(store, { artifact: fixtureArtifact('run-a'), raw: [] });
    const before = await indexText();

    // BigInt 는 JSON 으로 직렬화되지 않는다 — raw 를 쓰는 중간에 실패한다.
    const unserializable = { path: 'bad.json', value: { count: BigInt(1) } };
    await expect(
      writeRun(store, { artifact: fixtureArtifact('run-b'), raw: [unserializable] }),
    ).rejects.toThrow();

    expect(await runEntries()).toEqual(['run-a']);
    expect(await indexText()).toBe(before);
    expect(existsSync(path.join(store, '.lock'))).toBe(false);
    expect(await readRun(store, 'run-a')).toEqual(fixtureArtifact('run-a'));
  });

  it('schema 를 어기는 artifact 는 쓰기 전에 거부한다', async () => {
    const artifact = fixtureArtifact('run-a');
    const invalid = { ...artifact, observations: [{ ...artifact.observations[0], value: null }] };

    await expect(writeRun(store, { artifact: invalid as never, raw: [] })).rejects.toThrow();
    expect(existsSync(path.join(store, 'runs/run-a'))).toBe(false);
  });

  it('raw 경로가 run 밖을 가리키면 거부한다', async () => {
    const escape = { path: '../../escape.json', value: {} };
    await expect(
      writeRun(store, { artifact: fixtureArtifact('run-a'), raw: [escape] }),
    ).rejects.toBeInstanceOf(BoundaryError);
    expect(existsSync(path.join(store, 'escape.json'))).toBe(false);
    expect(await runEntries()).toEqual([]);
  });

  it('index 가 깨져 있으면 새 run 을 쓰지 않는다', async () => {
    await fs.writeFile(path.join(store, 'index.json'), '{');
    expect(await kindOf(writeRun(store, { artifact: fixtureArtifact('run-a'), raw: [] }))).toBe(
      'invalid-json',
    );
    expect(existsSync(path.join(store, 'runs/run-a'))).toBe(false);
    expect(await indexText()).toBe('{');
  });
});

describe('readRun', () => {
  it('index 에 없는 run 은 missing', async () => {
    expect(await kindOf(readRun(store, 'nope'))).toBe('missing');
  });

  it('run.json 이 manifest 와 다르면 corrupt', async () => {
    await writeRun(store, { artifact: fixtureArtifact('run-a'), raw: [] });
    const file = path.join(store, 'runs/run-a/run.json');
    await fs.writeFile(file, JSON.stringify(fixtureArtifact('run-a')));

    expect(await kindOf(readRun(store, 'run-a'))).toBe('corrupt');
  });
});
