import { describe, expect, it } from 'vitest';

import {
  assessFreshness,
  publicIndexSchema,
  publicRunArtifactSchema,
  publicRunPath,
  RUN_STATES,
  runArtifactSchema,
  runManifestSchema,
  runMetadataSchema,
  SCHEMA_VERSION,
  storeIndexSchema,
  storeRunPath,
} from '../src/index.js';

import {
  artifact,
  available,
  collection,
  HASH,
  metadata,
  OTHER_SHA,
  SHA,
  source,
} from './fixtures.js';

const meta = (overrides: Record<string, unknown>) =>
  runMetadataSchema.safeParse(metadata(overrides));

describe('RunMetadata', () => {
  it('schemaVersion 은 1 이고 다른 버전은 거부한다', () => {
    expect(SCHEMA_VERSION).toBe(1);
    expect(meta({}).success).toBe(true);
    expect(meta({ schemaVersion: 2 }).success).toBe(false);
  });

  it('source 와 collection 을 따로 기록한다', () => {
    const parsed = runMetadataSchema.parse(
      metadata({ collection: collection({ sha: OTHER_SHA }) }),
    );
    expect(parsed.source.sha).toBe(SHA);
    expect(parsed.collection.sha).toBe(OTHER_SHA);
  });

  it('출처를 모르면 null 이 아니라 unknown 이다', () => {
    const unknownSource = source({
      kind: 'unknown',
      sha: 'unknown',
      time: 'unknown',
      dirty: 'unknown',
      workingTreeHash: 'unknown',
      lockfileHash: 'unknown',
    });
    expect(
      meta({ source: unknownSource, cache: 'unknown', tools: { pnpm: 'unknown' } }).success,
    ).toBe(true);
    expect(meta({ source: source({ sha: null }) }).success).toBe(false);
    const { dirty: _dirty, ...withoutDirty } = source();
    expect(meta({ source: withoutDirty }).success).toBe(false);
  });

  it('run 상태는 다섯이다', () => {
    expect([...RUN_STATES]).toEqual(['running', 'complete', 'partial', 'failed', 'cancelled']);
  });

  it('running 만 끝난 시각이 없다', () => {
    expect(meta({ state: 'running', collection: collection({ finishedAt: null }) }).success).toBe(
      true,
    );
    expect(meta({ state: 'running' }).success).toBe(false);
    expect(meta({ state: 'complete', collection: collection({ finishedAt: null }) }).success).toBe(
      false,
    );
  });

  it('끝난 시각이 시작보다 앞서면 거부한다', () => {
    const backwards = collection({ finishedAt: '2026-09-13T08:00:59+09:00' });
    expect(meta({ collection: backwards }).success).toBe(false);
  });

  it.each(['../x', 'Run 1', 'a/b', '', '-lead'])('run id %j 는 거부한다', (runId) => {
    expect(meta({ runId }).success).toBe(false);
  });
});

describe('RunArtifact', () => {
  it('fixture 가 통과한다', () => {
    expect(runArtifactSchema.safeParse(artifact()).success).toBe(true);
  });

  it('observation id 가 겹치면 거부한다', () => {
    expect(
      runArtifactSchema.safeParse(artifact({ observations: [available(), available()] })).success,
    ).toBe(false);
  });

  it('알 수 없는 top-level 필드는 거부한다', () => {
    expect(runArtifactSchema.safeParse({ ...artifact(), rawTrace: [] }).success).toBe(false);
  });

  it('공개 artifact 는 raw evidence 를 담을 수 없다', () => {
    const leaking = artifact({
      observations: [
        available({ evidence: [{ source: 'artifact', path: 'raw/vitest.json', sha256: HASH }] }),
      ],
    });
    expect(runArtifactSchema.safeParse(leaking).success).toBe(true);
    expect(publicRunArtifactSchema.safeParse(leaking).success).toBe(false);
  });
});

describe('index', () => {
  const entry = (id: string, path = publicRunPath(id)) => ({ id, path });

  it('version·id·상대 경로만 가진다', () => {
    expect(publicIndexSchema.safeParse({ version: 1, runs: [entry('a')] }).success).toBe(true);
    expect(
      publicIndexSchema.safeParse({ version: 1, runs: [{ ...entry('a'), createdAt: 'x' }] })
        .success,
    ).toBe(false);
    expect(publicIndexSchema.safeParse({ version: 2, runs: [] }).success).toBe(false);
  });

  it('중복 id 는 거부한다', () => {
    expect(
      publicIndexSchema.safeParse({ version: 1, runs: [entry('a'), entry('a')] }).success,
    ).toBe(false);
  });

  it('경로는 그 id 의 artifact 만 가리킨다', () => {
    expect(
      publicIndexSchema.safeParse({ version: 1, runs: [entry('a', 'runs/b.json')] }).success,
    ).toBe(false);
    expect(
      publicIndexSchema.safeParse({ version: 1, runs: [entry('a', '../a.json')] }).success,
    ).toBe(false);
    expect(
      storeIndexSchema.safeParse({ version: 1, runs: [entry('a', storeRunPath('a'))] }).success,
    ).toBe(true);
    expect(storeIndexSchema.safeParse({ version: 1, runs: [entry('a')] }).success).toBe(false);
  });
});

describe('manifest', () => {
  const file = { path: 'run.json', sha256: HASH, bytes: 10 };

  it('파일마다 해시와 크기를 가진다', () => {
    const manifest = { schemaVersion: 1, runId: 'a', state: 'complete', files: [file] };
    expect(runManifestSchema.safeParse(manifest).success).toBe(true);
    expect(
      runManifestSchema.safeParse({ ...manifest, files: [{ ...file, bytes: -1 }] }).success,
    ).toBe(false);
    expect(
      runManifestSchema.safeParse({ ...manifest, files: [{ ...file, path: '../x' }] }).success,
    ).toBe(false);
  });
});

describe('freshness', () => {
  const parsed = runMetadataSchema.parse(metadata());

  it('source SHA 가 기대값과 같으면 fresh', () => {
    expect(assessFreshness(parsed, SHA).status).toBe('fresh');
  });

  it('다르면 stale 이고 두 SHA 를 이유에 남긴다', () => {
    const result = assessFreshness(parsed, OTHER_SHA);
    expect(result.status).toBe('stale');
    expect(result.reason).toContain(SHA.slice(0, 7));
    expect(result.reason).toContain(OTHER_SHA.slice(0, 7));
  });

  it('어느 쪽이든 모르면 unknown — fresh 로 치지 않는다', () => {
    expect(assessFreshness(parsed, 'unknown').status).toBe('unknown');
    const unknownSha = runMetadataSchema.parse(metadata({ source: source({ sha: 'unknown' }) }));
    expect(assessFreshness(unknownSha, SHA).status).toBe('unknown');
  });
});
