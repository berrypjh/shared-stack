import fs from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { fixtureArtifact, tempDir } from './__fixtures__/fixtures';
import { ExportCollisionError, exportRun } from './export';
import { writeRun } from './store';

const setup = async () => {
  const storeRoot = await tempDir('store');
  const publicRoot = await tempDir('public');
  await writeRun(storeRoot, { artifact: fixtureArtifact('fixture-01'), raw: [] });
  return { storeRoot, publicRoot, publicRun: path.join(publicRoot, 'runs/fixture-01.json') };
};

describe('exportRun — 공개 run 은 덮어쓰지 않는다', () => {
  it('같은 실행을 다시 export 하면 같은 파일이다', async () => {
    const { storeRoot, publicRoot, publicRun } = await setup();
    await exportRun({ storeRoot, publicRoot, runId: 'fixture-01' });
    const first = await fs.readFile(publicRun, 'utf8');
    await exportRun({ storeRoot, publicRoot, runId: 'fixture-01' });
    expect(await fs.readFile(publicRun, 'utf8')).toBe(first);
  });

  it('같은 id 인데 다른 실행(수집 시각·source 가 다름)이 이미 공개돼 있으면 거부하고 그대로 둔다', async () => {
    const { storeRoot, publicRoot, publicRun } = await setup();
    await exportRun({ storeRoot, publicRoot, runId: 'fixture-01' });
    const published = JSON.parse(await fs.readFile(publicRun, 'utf8'));
    published.metadata.collection.startedAt = '2026-09-13T13:00:00.000Z';
    const tampered = `${JSON.stringify(published, null, 2)}\n`;
    await fs.writeFile(publicRun, tampered);

    await expect(exportRun({ storeRoot, publicRoot, runId: 'fixture-01' })).rejects.toBeInstanceOf(
      ExportCollisionError,
    );
    expect(await fs.readFile(publicRun, 'utf8')).toBe(tampered);
  });
});
