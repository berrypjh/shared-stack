/**
 * observability test 전용 fixture. 제품 코드에서 import 하지 않는다.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import type { RunArtifact } from '@berrypjh/observability-contracts';

import type { GitReader } from '../static';

export const SHA = 'a'.repeat(40);
export const HASH = 'c'.repeat(64);

export const sha256 = (text: string) => createHash('sha256').update(text).digest('hex');

export const tempDir = (label: string) =>
  fs.mkdtemp(path.join(os.tmpdir(), `quality-lab-${label}-`));

/** 실측 0 과 not-run 을 함께 담는다. 첫 observation 은 raw evidence 와 공개 evidence 를 모두 가진다. */
export const fixtureArtifact = (runId = 'fixture-01'): RunArtifact => ({
  metadata: {
    schemaVersion: 1,
    runId,
    state: 'complete',
    profile: 'static',
    scope: ['workspace'],
    source: {
      kind: 'local',
      sha: SHA,
      time: '2026-09-13T13:16:29+09:00',
      ciRunId: 'unknown',
      dirty: false,
      workingTreeHash: HASH,
      lockfileHash: HASH,
    },
    collection: {
      sha: SHA,
      startedAt: '2026-09-13T14:00:00.000Z',
      finishedAt: '2026-09-13T14:00:01.000Z',
    },
    tools: { node: 'v24.20.0' },
    cache: 'disabled',
  },
  inventory: null,
  observations: [
    {
      id: 'bundle.react-ui.gzip',
      domain: 'bundle',
      unit: 'bytes',
      scope: '@berrypjh/react-ui',
      availability: 'available',
      value: 0,
      denominator: null,
      outcome: null,
      reason: null,
      evidence: [
        { source: 'artifact', path: 'raw/size.json', sha256: HASH },
        { source: 'file', path: 'libs/react-ui/package.json', sha256: HASH, excerpt: null },
      ],
    },
    {
      id: 'test.quality-lab',
      domain: 'test',
      unit: 'count',
      scope: '@berrypjh/quality-lab',
      availability: 'not-run',
      value: null,
      denominator: null,
      outcome: null,
      reason: 'static profile 은 명령을 실행하지 않습니다',
      evidence: [],
    },
  ],
  tests: [],
  bundles: [],
  contexts: [],
});

const write = async (root: string, relative: string, content: string) => {
  const file = path.join(root, relative);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content);
};

export const THEMES_SOURCE = `throw new Error('static collector must not execute this file');

export const themes = [
  { name: 'light', selector: ':root', sourceDirs: ['light'] },
  {
    name: 'midnight',
    selector: '[data-theme="midnight"], .theme-midnight',
    sourceDirs: ['light', 'dark', 'midnight'],
  },
] as const;
`;

export const WORKFLOW_SOURCE = 'name: ci\n';
export const LOCKFILE_SOURCE = 'lockfileVersion: 9.0\n';

/** static collector 가 읽는 정의만 가진 최소 workspace. */
export const makeWorkspace = async (): Promise<string> => {
  const root = await tempDir('workspace');
  await write(
    root,
    'package.json',
    JSON.stringify({
      name: 'fixture-root',
      scripts: { test: 'nx run-many -t test', size: 'size-limit' },
    }),
  );
  await write(root, 'pnpm-lock.yaml', LOCKFILE_SOURCE);
  await write(
    root,
    'libs/ui/package.json',
    JSON.stringify({
      name: '@fixture/ui',
      exports: {
        '.': { import: './dist/index.js' },
        './styles.css': './dist/index.css',
        './package.json': './package.json',
      },
    }),
  );
  await write(
    root,
    'libs/private-lib/package.json',
    JSON.stringify({ name: '@fixture/private', private: true }),
  );
  await write(
    root,
    'apps/web/package.json',
    JSON.stringify({ name: '@fixture/web', private: true }),
  );
  await fs.mkdir(path.join(root, 'libs/no-manifest'), { recursive: true });
  await write(root, 'libs/design-tokens/src/themes.ts', THEMES_SOURCE);
  await write(root, '.github/workflows/ci.yml', WORKFLOW_SOURCE);
  return root;
};

export const fakeGit = (overrides: Partial<GitReader> = {}): GitReader => ({
  head: async () => SHA,
  commitTime: async () => '2026-09-13T13:16:29+09:00',
  status: async () => '',
  diff: async () => '',
  ...overrides,
});

/** 호출할 때마다 다음 시각을 돌려준다. 마지막 값에서 멈춘다. */
export const clock = (...times: string[]) => {
  let index = 0;
  return () => new Date(times[Math.min(index++, times.length - 1)]);
};
