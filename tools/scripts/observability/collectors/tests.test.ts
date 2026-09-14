import fs from 'node:fs/promises';
import path from 'node:path';

import { testSummarySchema } from '@berrypjh/observability-contracts';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { sha256, tempDir } from '../__fixtures__/fixtures';
import { commandById } from '../registry';
import { BoundaryError } from '../safe-fs';

import type { Exec, ExecResult } from './exec';
import { collectTestSource, TEST_SOURCES } from './tests';

let workspace: string;

const spec = (commandId: string) => {
  const found = TEST_SOURCES.find((source) => source.commandId === commandId);
  if (!found) throw new Error(`${commandId} is not a test source`);
  return found;
};

const vitestReport = (file: string, cases: { fullName: string; status: string }[]) =>
  JSON.stringify({
    numTotalTestSuites: 1,
    testResults: [
      {
        name: path.join(workspace, file),
        status: cases.some((c) => c.status === 'failed') ? 'failed' : 'passed',
        message: '',
        assertionResults: cases.map((c) => ({
          ancestorTitles: [],
          title: c.fullName,
          fullName: c.fullName,
          status: c.status,
          duration: 1,
          failureMessages: c.status === 'failed' ? ['boom'] : [],
        })),
      },
    ],
  });

const write = async (relative: string, content: string) => {
  const file = path.join(workspace, relative);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content);
};

beforeEach(async () => {
  workspace = await tempDir('tests-workspace');
  await write('apps/demo-web/src/app/app.spec.tsx', 'it("a", () => {})');
  await write('apps/demo-web/src/app/pages/pages.spec.tsx', 'it("b", () => {})');
  await write('apps/demo-web/src/app/nav.spec.ts', 'it("c", () => {})');
  await write('apps/demo-web/node_modules/pkg/ignored.spec.ts', 'it("x", () => {})');
  await write('apps/demo-web/src/app/nav.ts', 'export const nav = [];');
  await fs.mkdir(path.join(workspace, 'tmp/quality-lab/imports'), { recursive: true });
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

const outputFileOf = (argv: readonly string[]) =>
  argv.find((arg) => arg.startsWith('--outputFile='))?.slice('--outputFile='.length);

/** runner 처럼 `--outputFile` 경로에 report 를 쓰는 가짜 실행기. */
const runnerExec = (behave: { report?: string; result?: Partial<ExecResult> } | Error) => {
  const calls: (readonly string[])[] = [];
  const exec: Exec = async (argv) => {
    calls.push(argv);
    if (behave instanceof Error) throw behave;
    const target = outputFileOf(argv);
    if (behave.report !== undefined && target) await fs.writeFile(target, behave.report);
    return {
      exitCode: 0,
      signal: null,
      timedOut: false,
      wallMs: 3000,
      stdout: '',
      stderr: '',
      ...behave.result,
    };
  };
  return { exec, calls };
};

const collect = (commandId: string, exec: Exec, importPath: string | null = null) =>
  collectTestSource({
    spec: spec(commandId),
    workspaceRoot: workspace,
    workDir: 'tmp/quality-lab/work/run-a',
    exec,
    timeoutMs: 60000,
    importPath,
    runnerVersion: '4.0.17',
  });

const NX_LINE = '> nx run @berrypjh/demo-web:test -- --reporter=json';

describe('collectTestSource', () => {
  it('registry argv 뒤에 reporter 인자만 붙여 실행하고 report 에서 센다', async () => {
    const report = vitestReport('apps/demo-web/src/app/app.spec.tsx', [
      { fullName: 'ok', status: 'passed' },
      { fullName: 'bad', status: 'failed' },
    ]);
    const { exec, calls } = runnerExec({ report, result: { exitCode: 1, stdout: NX_LINE } });
    const { summary, raw } = await collect('test.demo-web', exec);

    const registry = commandById('test.demo-web').argv;
    expect(calls[0].slice(0, registry.length)).toEqual(registry);
    expect(calls[0].slice(registry.length, registry.length + 2)).toEqual(['--', '--reporter=json']);

    expect(testSummarySchema.parse(summary)).toEqual(summary);
    expect(summary).toMatchObject({
      sourceId: 'vitest:@berrypjh/demo-web',
      cache: 'fresh',
      execution: { status: 'failed', exitCode: 1 },
      report: { status: 'parsed', path: 'raw/tests/test.demo-web.json', sha256: sha256(report) },
      outcome: 'fail',
      counts: { sourceFiles: { value: 3, provenance: 'source-scan' }, cases: { value: 2 } },
    });
    expect(raw).toEqual({
      path: 'tests/test.demo-web.json',
      value: { format: 'vitest-json', sha256: sha256(report), text: report },
    });
  });

  it('Nx cache 복원이면 report 가 없으므로 측정하지 않는다', async () => {
    const { exec } = runnerExec({ result: { stdout: `${NX_LINE}  [local cache]` } });
    const { summary, raw } = await collect('test.demo-web', exec);
    expect(summary).toMatchObject({
      cache: 'restored',
      report: { status: 'missing' },
      outcome: null,
      counts: { cases: { value: null } },
    });
    expect(raw).toBeNull();
  });

  it('깨진 report 는 corrupt 이고 count 를 만들지 않는다', async () => {
    const { summary } = await collect(
      'test.demo-web',
      runnerExec({ report: '{"testResults": [', result: { stdout: NX_LINE } }).exec,
    );
    expect(summary).toMatchObject({ report: { status: 'corrupt' }, outcome: null, cases: [] });
  });

  it('timeout 이면 report 없이 실행 상태만 남는다', async () => {
    const { summary } = await collect(
      'test.demo-web',
      runnerExec({ result: { exitCode: null, timedOut: true } }).exec,
    );
    expect(summary).toMatchObject({
      execution: { status: 'timeout' },
      report: { status: 'missing' },
      outcome: null,
    });
    expect(summary.report.reason).toContain('제한 시간');
  });

  it('실행 자체를 못 하면 unavailable 이다', async () => {
    const { summary } = await collect(
      'test.demo-web',
      runnerExec(new Error('spawn pnpm ENOENT')).exec,
    );
    expect(summary).toMatchObject({
      execution: { status: 'unavailable', exitCode: null },
      outcome: null,
    });
    expect(summary.execution.reason).toContain('ENOENT');
  });

  it('jest source 는 --json 과 --outputFile 을 Nx 뒤로 넘긴다', async () => {
    const { exec, calls } = runnerExec({
      result: { stdout: '> nx run @berrypjh/react-native-ui:test' },
    });
    await collect('test.react-native-ui', exec);
    const registry = commandById('test.react-native-ui').argv;
    expect(calls[0].slice(registry.length, registry.length + 2)).toEqual(['--', '--json']);
    expect(outputFileOf(calls[0])).toBeTruthy();
  });

  describe('import', () => {
    it('import 한 report 는 실행하지 않고 imported 로 기록한다', async () => {
      const report = vitestReport('apps/demo-web/src/app/app.spec.tsx', [
        { fullName: 'ok', status: 'passed' },
      ]);
      await write('tmp/quality-lab/imports/demo-web.json', report);
      const { exec, calls } = runnerExec({});
      const { summary } = await collect(
        'test.demo-web',
        exec,
        'tmp/quality-lab/imports/demo-web.json',
      );
      expect(calls).toEqual([]);
      expect(summary).toMatchObject({
        execution: { status: 'imported', exitCode: null },
        cache: 'unknown',
        report: { status: 'parsed' },
        outcome: 'pass',
        durations: { wallMs: { value: null } },
      });
    });

    it('imports 밖 경로는 거부한다', async () => {
      await expect(
        collect('test.demo-web', runnerExec({}).exec, 'apps/demo-web/src/app/nav.ts'),
      ).rejects.toBeInstanceOf(BoundaryError);
    });
  });
});
