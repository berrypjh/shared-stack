import fs from 'node:fs/promises';
import path from 'node:path';

import { baselinePointerSchema } from '@berrypjh/observability-contracts';

import { describe, expect, it } from 'vitest';

import { fixtureArtifact, sha256, tempDir } from './__fixtures__/fixtures';
import { BaselineConflictError, readBaselinePointer, setBaseline } from './baseline';
import { exportRun } from './export';
import { ArtifactError } from './safe-fs';
import { writeRun } from './store';

const NOW = () => new Date('2026-09-13T12:00:00.000Z');
const LATER = () => new Date('2026-09-13T13:00:00.000Z');

const setup = async (ids: string[], { exported = true } = {}) => {
  const storeRoot = await tempDir('store');
  const publicRoot = await tempDir('public');
  for (const id of ids) {
    await writeRun(storeRoot, { artifact: fixtureArtifact(id), raw: [] });
    if (exported) await exportRun({ storeRoot, publicRoot, runId: id });
  }
  return { storeRoot, publicRoot };
};

const hashOf = async (file: string) => sha256(await fs.readFile(file, 'utf8'));

describe('readBaselinePointer', () => {
  it('파일이 없으면 빈 포인터이고, 깨졌으면 없음과 다른 오류다', async () => {
    const root = await tempDir('pointer');
    expect(await readBaselinePointer(root)).toEqual({ version: 1, pointers: [], history: [] });
    await fs.writeFile(path.join(root, 'baseline.json'), '{oops');
    const error = await readBaselinePointer(root).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ArtifactError);
    expect((error as ArtifactError).kind).not.toBe('missing');
  });
});

describe('setBaseline — run ID 포인터만 쓴다', () => {
  it('store·public 에 같은 포인터를 쓰고 run 파일은 건드리지 않는다', async () => {
    const { storeRoot, publicRoot } = await setup(['fixture-01']);
    const storeRun = path.join(storeRoot, 'runs/fixture-01/run.json');
    const publicRun = path.join(publicRoot, 'runs/fixture-01.json');
    const before = [await hashOf(storeRun), await hashOf(publicRun)];

    const result = await setBaseline({
      storeRoot,
      publicRoot,
      runId: 'fixture-01',
      now: NOW,
      replace: false,
    });

    expect(result.changed).toBe(true);
    expect(result.pointer.pointers).toEqual([
      { profile: 'static', runId: 'fixture-01', setAt: '2026-09-13T12:00:00.000Z' },
    ]);
    for (const root of [storeRoot, publicRoot]) {
      const written = baselinePointerSchema.parse(
        JSON.parse(await fs.readFile(path.join(root, 'baseline.json'), 'utf8')),
      );
      expect(written).toEqual(result.pointer);
    }
    expect([await hashOf(storeRun), await hashOf(publicRun)]).toEqual(before);
  });

  it('store 에 없거나 export 하지 않은 run 은 가리키지 않는다', async () => {
    const { storeRoot, publicRoot } = await setup(['fixture-01'], { exported: false });
    await expect(
      setBaseline({ storeRoot, publicRoot, runId: 'nope-01', now: NOW, replace: false }),
    ).rejects.toThrow();
    await expect(
      setBaseline({ storeRoot, publicRoot, runId: 'fixture-01', now: NOW, replace: false }),
    ).rejects.toThrow(/export/);
  });

  it('같은 profile 의 다른 run 으로 바꾸려면 replace 가 필요하고 기록이 남는다', async () => {
    const { storeRoot, publicRoot } = await setup(['fixture-01', 'fixture-02']);
    await setBaseline({ storeRoot, publicRoot, runId: 'fixture-01', now: NOW, replace: false });
    await expect(
      setBaseline({ storeRoot, publicRoot, runId: 'fixture-02', now: LATER, replace: false }),
    ).rejects.toBeInstanceOf(BaselineConflictError);
    expect((await readBaselinePointer(storeRoot)).pointers[0].runId).toBe('fixture-01');

    const replaced = await setBaseline({
      storeRoot,
      publicRoot,
      runId: 'fixture-02',
      now: LATER,
      replace: true,
    });
    expect(replaced.pointer.pointers).toEqual([
      { profile: 'static', runId: 'fixture-02', setAt: '2026-09-13T13:00:00.000Z' },
    ]);
    expect(replaced.pointer.history.map((entry) => [entry.runId, entry.replaced])).toEqual([
      ['fixture-01', null],
      ['fixture-02', 'fixture-01'],
    ]);
  });

  it('같은 run 을 다시 가리키면 바꾸지 않는다', async () => {
    const { storeRoot, publicRoot } = await setup(['fixture-01']);
    await setBaseline({ storeRoot, publicRoot, runId: 'fixture-01', now: NOW, replace: false });
    const again = await setBaseline({
      storeRoot,
      publicRoot,
      runId: 'fixture-01',
      now: LATER,
      replace: false,
    });
    expect(again.changed).toBe(false);
    expect(again.pointer.history).toHaveLength(1);
  });
});
