import fs from 'node:fs/promises';
import path from 'node:path';

import { runArtifactSchema } from '@berrypjh/observability-contracts';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { clock, fakeGit, makeWorkspace } from '../__fixtures__/fixtures';
import { normalizePackageScenarios } from '../normalizers/context';
import { COMMANDS, PROFILE_COMMANDS } from '../registry';

import { collectCore } from './core';
import type { Exec } from './exec';

let workspace: string;

const SIZE_CONFIG = `module.exports = [{ name: '@berrypjh/react-ui — cx only', path: 'libs/react-ui/dist/index.esm.js', import: '{ cx }', limit: '11 KB' }];`;
const SIZE_REPORT = JSON.stringify([
  { name: '@berrypjh/react-ui — cx only', passed: true, size: 10574, sizeLimit: 11000 },
]);
const TREESHAKE_REPORT = JSON.stringify({
  target: 'react-ui',
  pkg: '@berrypjh/react-ui',
  external: [],
  scenarios: [
    { name: 'all-exports (baseline)', kind: 'all-exports', symbols: [], raw: 86916, gzip: 14508 },
  ],
});

const CONTEXTS = normalizePackageScenarios({
  target: 'fixture',
  packageDir: 'libs/ui',
  tokenizer: {
    provider: 'openai-tiktoken-local',
    tokenModel: 'gpt-4o',
    tokenizerVersion: '1.0.22',
  },
  results: [{ scenario: 'baseline', files: ['package.json'], missing: [], chars: 10, tokens: 3 }],
});

const writeImport = (name: string, text: string) =>
  fs.writeFile(path.join(workspace, 'tmp/observability/imports', name), text);

beforeEach(async () => {
  workspace = await makeWorkspace();
  await fs.writeFile(path.join(workspace, '.size-limit.cjs'), SIZE_CONFIG);
  await fs.mkdir(path.join(workspace, 'tmp/observability/imports'), { recursive: true });
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

const neverExec: Exec = async (argv) => {
  throw new Error(`exec must not be called: ${argv.join(' ')}`);
};

const core = (overrides: Partial<Parameters<typeof collectCore>[0]> = {}) =>
  collectCore({
    workspaceRoot: workspace,
    runId: 'local-quality-01',
    git: fakeGit(),
    env: {},
    now: clock('2026-09-13T14:00:00.000Z', '2026-09-13T14:05:00.000Z'),
    toolVersions: {
      node: 'v24.20.0',
      'size-limit': '12.1.0',
      esbuild: '0.27.2',
    },
    exec: neverExec,
    timeoutMs: 60000,
    imports: {},
    onlyImports: false,
    collectContexts: async () => CONTEXTS,
    ...overrides,
  });

const observation = (artifact: { observations: { id: string }[] }, id: string) => {
  const found = artifact.observations.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`${id} observation is missing`);
  return found;
};

describe('collectCore — import 만 쓰는 수집', () => {
  it('실행하지 않고, import 가 없는 명령은 이유와 함께 not-run 이다', async () => {
    await writeImport('size-limit.json', SIZE_REPORT);
    const { artifact } = await core({
      onlyImports: true,
      imports: { 'bundle.size-limit': 'tmp/observability/imports/size-limit.json' },
    });

    expect(runArtifactSchema.parse(artifact)).toEqual(artifact);
    expect(artifact.metadata).toMatchObject({
      profile: 'core',
      state: 'partial',
      cache: 'disabled',
    });
    expect(artifact.observations.map((o) => o.id)).toEqual(COMMANDS.map((command) => command.id));

    expect(artifact.bundles.map((m) => [m.method, m.value])).toEqual([['size-limit', 10574]]);
    expect(observation(artifact, 'bundle.treeshake.react-ui')).toMatchObject({
      availability: 'not-run',
      reason: expect.stringContaining('--only-imports'),
    });
    expect(observation(artifact, 'eval.consumer-smoke')).toMatchObject({ availability: 'not-run' });
    expect(artifact.contexts).toEqual(CONTEXTS);
  });

  it('깨진 import report 는 invalid observation 이다', async () => {
    await writeImport('treeshake.json', '{"scenarios": [');
    const { artifact } = await core({
      onlyImports: true,
      imports: { 'bundle.treeshake.react-ui': 'tmp/observability/imports/treeshake.json' },
    });
    expect(observation(artifact, 'bundle.treeshake.react-ui')).toMatchObject({
      availability: 'invalid',
      value: null,
    });
  });
});

describe('collectCore — 실행', () => {
  it('registry 의 core 명령만 실행하고, 모두 결과가 있으면 complete 다', async () => {
    const calls: string[] = [];
    const exec: Exec = async (argv) => {
      const id = COMMANDS.find(
        (command) => argv.slice(0, command.argv.length).join(' ') === command.argv.join(' '),
      )?.id;
      if (!id) throw new Error(`unregistered argv: ${argv.join(' ')}`);
      calls.push(id);
      const stdout =
        id === 'bundle.size-limit'
          ? SIZE_REPORT
          : id === 'bundle.treeshake.react-ui'
            ? TREESHAKE_REPORT
            : '';
      return { exitCode: 0, signal: null, timedOut: false, wallMs: 10, stdout, stderr: '' };
    };

    const { artifact, raw } = await core({ exec });

    expect([...calls].sort()).toEqual([...PROFILE_COMMANDS.core].sort());
    expect(runArtifactSchema.parse(artifact).metadata.state).toBe('complete');
    expect(raw.map((file) => file.path)).toEqual([
      'static-inputs.json',
      'bundle/size-limit.json',
      'bundle/treeshake-react-ui.json',
    ]);
  });
});
