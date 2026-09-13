import fs from 'node:fs/promises';
import path from 'node:path';

import { publicIndexSchema, publicRunArtifactSchema } from '@berrypjh/observability-contracts';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { fixtureArtifact, HASH, tempDir } from './__fixtures__/fixtures';
import { exportRun } from './export';
import { ArtifactError } from './safe-fs';
import { writeRun } from './store';

let store: string;
let publicRoot: string;

beforeEach(async () => {
  store = await tempDir('store');
  publicRoot = await tempDir('public');
  await writeRun(store, {
    artifact: fixtureArtifact('run-a'),
    raw: [{ path: 'size.json', value: { note: 'raw collector output' } }],
  });
});

afterEach(async () => {
  await fs.rm(store, { recursive: true, force: true });
  await fs.rm(publicRoot, { recursive: true, force: true });
});

const readPublic = async (relative: string) =>
  JSON.parse(await fs.readFile(path.join(publicRoot, relative), 'utf8'));

describe('exportRun', () => {
  it('raw evidence 와 raw 파일은 공개하지 않는다', async () => {
    await exportRun({ storeRoot: store, publicRoot, runId: 'run-a' });

    const text = await fs.readFile(path.join(publicRoot, 'runs/run-a.json'), 'utf8');
    expect(text).not.toContain('raw/');
    expect(text).not.toContain('raw collector output');
    const artifact = publicRunArtifactSchema.parse(JSON.parse(text));
    expect(artifact.observations[0].evidence).toEqual([
      { source: 'file', path: 'libs/react-ui/package.json', sha256: HASH, excerpt: null },
    ]);
    expect((await fs.readdir(publicRoot)).sort()).toEqual(['index.json', 'runs']);
  });

  it('실측 0 과 not-run null 이 그대로 남는다', async () => {
    await exportRun({ storeRoot: store, publicRoot, runId: 'run-a' });

    const [measured, notRun] = publicRunArtifactSchema.parse(
      await readPublic('runs/run-a.json'),
    ).observations;
    expect(measured).toMatchObject({ availability: 'available', value: 0 });
    expect(notRun).toMatchObject({ availability: 'not-run', value: null });
  });

  it('index 는 version·id·경로만 담고 같은 run 을 두 번 싣지 않는다', async () => {
    await writeRun(store, { artifact: fixtureArtifact('run-b'), raw: [] });
    await exportRun({ storeRoot: store, publicRoot, runId: 'run-a' });
    await exportRun({ storeRoot: store, publicRoot, runId: 'run-b' });
    await exportRun({ storeRoot: store, publicRoot, runId: 'run-a' });

    expect(publicIndexSchema.parse(await readPublic('index.json'))).toEqual({
      version: 1,
      runs: [
        { id: 'run-a', path: 'runs/run-a.json' },
        { id: 'run-b', path: 'runs/run-b.json' },
      ],
    });
  });

  it('store 에 없는 run 은 missing 으로 실패하고 public 을 건드리지 않는다', async () => {
    await expect(exportRun({ storeRoot: store, publicRoot, runId: 'nope' })).rejects.toMatchObject({
      kind: 'missing',
    });
    expect(await fs.readdir(publicRoot)).toEqual([]);
  });

  it('기존 public index 가 깨져 있으면 덮어쓰지 않는다', async () => {
    await fs.writeFile(path.join(publicRoot, 'index.json'), '{');

    const error = await exportRun({ storeRoot: store, publicRoot, runId: 'run-a' }).catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(ArtifactError);
    expect(await fs.readFile(path.join(publicRoot, 'index.json'), 'utf8')).toBe('{');
  });
});
