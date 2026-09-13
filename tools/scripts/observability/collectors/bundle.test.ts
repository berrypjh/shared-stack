import fs from 'node:fs/promises';
import path from 'node:path';

import { bundleMeasurementSchema } from '@berrypjh/observability-contracts';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { sha256, tempDir } from '../__fixtures__/fixtures';
import { loadLimitParser } from '../normalizers/bundle';
import { commandById } from '../registry';
import { BoundaryError } from '../safe-fs';

import { collectSizeLimit, collectTreeshake } from './bundle';
import type { Exec, ExecResult } from './exec';

let workspace: string;

const CONFIG = `// 실측 raw 37,844 / brotli 10,840 — 과거 값이다.
module.exports = [
  { name: '@berrypjh/react-ui — cx only', path: 'libs/react-ui/dist/index.esm.js', import: '{ cx }', limit: '11 KB',
    ignore: ['react'], modifyEsbuildConfig: (config) => ({ ...config, target: 'es2022' }) },
  { name: '@berrypjh/react-native-ui — * (full)', path: 'libs/react-native-ui/dist/index.esm.js', import: '*', limit: '15.1 KB' },
];`;

const SIZE_REPORT = JSON.stringify([
  { name: '@berrypjh/react-ui — cx only', passed: true, size: 10574, sizeLimit: 11000 },
  { name: '@berrypjh/react-native-ui — * (full)', passed: false, size: 15857, sizeLimit: 15100 },
]);

beforeEach(async () => {
  workspace = await tempDir('bundle-workspace');
  await fs.writeFile(path.join(workspace, '.size-limit.cjs'), CONFIG);
  await fs.mkdir(path.join(workspace, 'tmp/quality-lab/imports'), { recursive: true });
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

const result = (overrides: Partial<ExecResult>): ExecResult => ({
  exitCode: 0,
  signal: null,
  timedOut: false,
  wallMs: 2100,
  stdout: '',
  stderr: '',
  ...overrides,
});

const recordingExec = (outcome: Partial<ExecResult> | Error) => {
  const calls: (readonly string[])[] = [];
  const exec: Exec = async (argv) => {
    calls.push(argv);
    if (outcome instanceof Error) throw outcome;
    return result(outcome);
  };
  return { exec, calls };
};

const sizeLimit = (exec: Exec, importPath: string | null = null) =>
  collectSizeLimit({
    workspaceRoot: workspace,
    exec,
    timeoutMs: 60000,
    importPath,
    toolVersion: '12.1.0',
    parseLimit: loadLimitParser(),
  });

describe('collectSizeLimit', () => {
  it('등록된 argv 로 실행하고, 한도 초과로 exit 1 이어도 report 값을 보존한다', async () => {
    const { exec, calls } = recordingExec({ exitCode: 1, stdout: SIZE_REPORT });
    const collected = await sizeLimit(exec);

    expect(calls).toEqual([commandById('bundle.size-limit').argv]);
    for (const measurement of collected.measurements)
      expect(bundleMeasurementSchema.parse(measurement)).toEqual(measurement);
    expect(
      collected.measurements.map((m) => [m.value, m.budget?.headroomBytes, m.budget?.outcome]),
    ).toEqual([
      [10574, 426, 'pass'],
      [15857, -757, 'fail'],
    ]);
    expect(collected.execution).toMatchObject({ status: 'failed', exitCode: 1 });
    expect(collected.raw).toEqual({
      path: 'bundle/size-limit.json',
      value: { sha256: sha256(SIZE_REPORT), text: SIZE_REPORT },
    });
  });

  it('size-limit 이 error 를 보고하면 한도만 있고 값은 없다', async () => {
    const { exec } = recordingExec({
      exitCode: 1,
      stdout: JSON.stringify({ error: 'Error: Cannot find module' }),
    });
    const { measurements } = await sizeLimit(exec);
    expect(
      measurements.every(
        (m) => m.availability === 'unavailable' && m.value === null && m.budget?.limitBytes,
      ),
    ).toBe(true);
  });

  it('JSON 이 아닌 출력은 parser 실패로 invalid 다', async () => {
    const { exec } = recordingExec({ stdout: '  ✔ cx only 10.57 kB' });
    const { measurements } = await sizeLimit(exec);
    expect(new Set(measurements.map((m) => m.availability))).toEqual(new Set(['invalid']));
  });

  it('실행을 못 하거나 시간을 넘기면 값이 없고 이유가 남는다', async () => {
    const spawnFailure = await sizeLimit(
      recordingExec(Object.assign(new Error('spawn pnpm ENOENT'), { code: 'ENOENT' })).exec,
    );
    expect(spawnFailure.measurements[0]).toMatchObject({
      availability: 'unavailable',
      value: null,
    });
    expect(spawnFailure.measurements[0].reason).toContain('ENOENT');

    const timeout = await sizeLimit(recordingExec({ exitCode: null, timedOut: true }).exec);
    expect(timeout.measurements[0]).toMatchObject({ availability: 'unavailable', value: null });
    expect(timeout.measurements[0].reason).toContain('제한 시간');
  });

  it('import 한 report 는 실행하지 않고 읽는다 — imports 밖 경로는 거부한다', async () => {
    await fs.writeFile(
      path.join(workspace, 'tmp/quality-lab/imports/size-limit.json'),
      SIZE_REPORT,
    );
    const { exec, calls } = recordingExec({ stdout: '' });
    const imported = await sizeLimit(exec, 'tmp/quality-lab/imports/size-limit.json');
    expect(calls).toEqual([]);
    expect(imported.execution).toBeNull();
    expect(imported.measurements[0].value).toBe(10574);

    await expect(
      sizeLimit(exec, 'tmp/quality-lab/imports/../../../.size-limit.cjs'),
    ).rejects.toBeInstanceOf(BoundaryError);
    await expect(sizeLimit(exec, '.size-limit.cjs')).rejects.toBeInstanceOf(BoundaryError);
  });

  it('주석의 과거 값은 결과에 없다', async () => {
    const { measurements } = await sizeLimit(recordingExec({ stdout: SIZE_REPORT }).exec);
    const serialized = JSON.stringify(measurements);
    expect(serialized).not.toContain('37844');
    expect(serialized).not.toContain('10840');
  });
});

describe('collectTreeshake', () => {
  const TREESHAKE_REPORT = JSON.stringify({
    target: 'react-ui',
    pkg: '@berrypjh/react-ui',
    external: ['react', 'react-dom', 'react/jsx-runtime'],
    scenarios: [
      { name: 'single: cx', kind: 'single', symbols: ['cx'], raw: 34244, gzip: 10697 },
      {
        name: 'single: Nope',
        kind: 'single',
        symbols: ['Nope'],
        error: 'No matching export for import "Nope"',
      },
      { name: 'all-exports (baseline)', kind: 'all-exports', symbols: [], raw: 86916, gzip: 14508 },
    ],
  });

  it('scenario 오류는 그 행만 값이 없고 나머지는 보존한다', async () => {
    const { exec, calls } = recordingExec({ stdout: TREESHAKE_REPORT });
    const collected = await collectTreeshake({
      workspaceRoot: workspace,
      exec,
      timeoutMs: 60000,
      importPath: null,
      toolVersion: '0.27.2',
    });
    expect(calls).toEqual([commandById('bundle.treeshake.react-ui').argv]);
    expect(collected.measurements.filter((m) => m.availability === 'available')).toHaveLength(4);
    expect(
      collected.measurements
        .filter((m) => m.caseName === 'single: Nope')
        .every((m) => m.value === null),
    ).toBe(true);
  });

  it('출력이 깨지면 측정값을 만들지 않고 실패 이유를 남긴다', async () => {
    const collected = await collectTreeshake({
      workspaceRoot: workspace,
      exec: recordingExec({ exitCode: 1, stdout: '', stderr: 'Error: esbuild failed' }).exec,
      timeoutMs: 60000,
      importPath: null,
      toolVersion: '0.27.2',
    });
    expect(collected.measurements).toEqual([]);
    expect(collected.failure).toMatchObject({ status: 'corrupt' });
  });
});
