import fs from 'node:fs/promises';
import path from 'node:path';

import { runArtifactSchema } from '@berrypjh/observability-contracts';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  clock,
  fakeGit,
  LOCKFILE_SOURCE,
  makeWorkspace,
  SHA,
  sha256,
  tempDir,
  WORKFLOW_SOURCE,
} from './__fixtures__/fixtures';
import { COMMANDS } from './registry';
import { BoundaryError } from './safe-fs';
import { collectStatic, readInventory, readSource } from './static';

let workspace: string;

beforeEach(async () => {
  workspace = await makeWorkspace();
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe('readInventory — 정의만 읽는다', () => {
  it('manifest 와 exports 를 package 마다 기록한다', async () => {
    const { packages } = await readInventory(workspace);
    expect(packages).toEqual([
      { name: '@fixture/web', path: 'apps/web', private: true, exports: ['@fixture/web'] },
      {
        name: '@fixture/private',
        path: 'libs/private-lib',
        private: true,
        exports: ['@fixture/private'],
      },
      {
        name: '@fixture/ui',
        path: 'libs/ui',
        private: false,
        exports: ['@fixture/ui', '@fixture/ui/styles.css'],
      },
    ]);
  });

  it('등록 theme 은 실행하지 않고 parse 한다', async () => {
    // fixture themes.ts 는 첫 줄에서 throw 한다. import 했다면 여기 오지 못한다.
    expect((await readInventory(workspace)).themes).toEqual(['light', 'midnight']);
  });

  it('script 이름·등록 명령·workflow 해시를 기록한다', async () => {
    const inventory = await readInventory(workspace);
    expect(inventory.scripts).toEqual(['size', 'test']);
    expect(inventory.commands.map((command) => command.id)).toEqual(
      COMMANDS.map((command) => command.id),
    );
    expect(inventory.workflows).toEqual([
      { path: '.github/workflows/ci.yml', sha256: sha256(WORKFLOW_SOURCE) },
    ]);
  });

  it('workspace 밖을 가리키는 package symlink 는 거부한다', async () => {
    const outside = await tempDir('outside');
    await fs.writeFile(path.join(outside, 'package.json'), JSON.stringify({ name: '@evil/pkg' }));
    await fs.symlink(outside, path.join(workspace, 'libs/evil'));

    await expect(readInventory(workspace)).rejects.toBeInstanceOf(BoundaryError);
    await fs.rm(outside, { recursive: true, force: true });
  });
});

describe('readSource — 모르면 unknown', () => {
  it('깨끗한 local checkout', async () => {
    const source = await readSource(workspace, fakeGit(), {});
    expect(source).toEqual({
      kind: 'local',
      sha: SHA,
      time: '2026-09-13T13:16:29+09:00',
      ciRunId: 'unknown',
      dirty: false,
      workingTreeHash: sha256('\0'),
      lockfileHash: sha256(LOCKFILE_SOURCE),
    });
  });

  it('변경이 있으면 dirty 이고 해시가 달라진다', async () => {
    const clean = await readSource(workspace, fakeGit(), {});
    const dirty = await readSource(
      workspace,
      fakeGit({ status: async () => ' M a.ts', diff: async () => '+x' }),
      {},
    );
    expect(dirty.dirty).toBe(true);
    expect(dirty.workingTreeHash).not.toBe(clean.workingTreeHash);
  });

  it('git 을 읽지 못하면 SHA·시각·dirty·해시는 unknown', async () => {
    const none = async () => null;
    const source = await readSource(
      workspace,
      { head: none, commitTime: none, status: none, diff: none },
      {},
    );
    expect(source).toMatchObject({
      sha: 'unknown',
      time: 'unknown',
      dirty: 'unknown',
      workingTreeHash: 'unknown',
    });
  });

  it('형식이 맞지 않는 git 출력은 믿지 않는다', async () => {
    const source = await readSource(
      workspace,
      fakeGit({ head: async () => 'garbage', commitTime: async () => 'soon' }),
      {},
    );
    expect(source).toMatchObject({ sha: 'unknown', time: 'unknown' });
  });

  it('GitHub Actions 면 ci 와 run id, 다른 CI 면 kind unknown', async () => {
    expect(
      await readSource(workspace, fakeGit(), { GITHUB_ACTIONS: 'true', GITHUB_RUN_ID: '123' }),
    ).toMatchObject({
      kind: 'ci',
      ciRunId: '123',
    });
    expect((await readSource(workspace, fakeGit(), { CI: 'true' })).kind).toBe('unknown');
  });

  it('lockfile 이 없으면 lockfileHash 는 unknown', async () => {
    await fs.rm(path.join(workspace, 'pnpm-lock.yaml'));
    expect((await readSource(workspace, fakeGit(), {})).lockfileHash).toBe('unknown');
  });
});

describe('collectStatic', () => {
  const collect = () =>
    collectStatic({
      workspaceRoot: workspace,
      runId: 'local-static-01',
      git: fakeGit(),
      env: {},
      now: clock('2026-09-13T14:00:00.000Z', '2026-09-13T14:00:02.000Z'),
      toolVersions: { node: 'v24.20.0', pnpm: 'unknown' },
    });

  it('계약을 통과하는 complete static run 을 만든다', async () => {
    const { artifact } = await collect();
    expect(runArtifactSchema.parse(artifact)).toEqual(artifact);
    expect(artifact.metadata).toMatchObject({
      runId: 'local-static-01',
      state: 'complete',
      profile: 'static',
      cache: 'disabled',
      collection: {
        sha: SHA,
        startedAt: '2026-09-13T14:00:00.000Z',
        finishedAt: '2026-09-13T14:00:02.000Z',
      },
      tools: { node: 'v24.20.0', pnpm: 'unknown' },
    });
  });

  it('실행하지 않은 명령은 전부 not-run 이고 값이 없다 — fake 값이 없다', async () => {
    const { artifact } = await collect();
    expect(artifact.observations.map((observation) => observation.id)).toEqual(
      COMMANDS.map((command) => command.id),
    );
    for (const observation of artifact.observations) {
      expect(observation.availability).toBe('not-run');
      expect(observation.reason).toBeTruthy();
      if (observation.domain === 'verification') expect(observation.status).toBe('not-run');
      else expect(observation.value).toBeNull();
    }
  });

  it('읽은 입력의 해시를 raw 로 남긴다', async () => {
    const { raw } = await collect();
    expect(raw.map((file) => file.path)).toEqual(['static-inputs.json']);
    expect(JSON.stringify(raw[0].value)).toContain(sha256(WORKFLOW_SOURCE));
  });
});
