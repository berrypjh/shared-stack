import type { Dirent } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

import { sanitizeExcerpt, type TestSummary, UNKNOWN } from '@berrypjh/observability-contracts';

import { parseJestReport } from '../adapters/jest';
import { ReportParseError, type RunnerReport } from '../adapters/report';
import { parseVitestReport } from '../adapters/vitest';
import {
  type ExecutionRecord,
  normalizeTestRun,
  type ReportInput,
  type TestSource,
} from '../normalizers/tests';
import { commandById } from '../registry';
import { isMissing, missingAs, readText, resolveInside, sha256 } from '../safe-fs';
import type { RawFile } from '../store';

import { cacheOriginOf, type Exec, executionOf } from './exec';
import { readImport } from './imports';

type ReportFormat = 'vitest-json' | 'jest-json';

export type TestSourceSpec = Pick<
  TestSource,
  'commandId' | 'sourceId' | 'area' | 'project' | 'runner' | 'include' | 'fileBase'
> & {
  projectRoot: string;
  /** include 해시에 넣는 runner config. 없으면 해시는 unknown. */
  configFile: string | null;
  format: ReportFormat;
  /** registry argv 뒤에 붙이는 고정 reporter 인자. 사용자 입력이 아니다. */
  reporterArgs: (reportPath: string) => string[];
};

const vitestJson = (reportPath: string) => ['--reporter=json', `--outputFile=${reportPath}`];
const jestJson = (reportPath: string) => ['--json', `--outputFile=${reportPath}`];
/** Nx run-commands target 은 `--` 뒤 인자를 runner 에 그대로 넘긴다. */
const afterNx = (args: string[]) => ['--', ...args];

const PARSERS: Record<ReportFormat, (text: string) => RunnerReport> = {
  'vitest-json': parseVitestReport,
  'jest-json': parseJestReport,
};

const VITEST_INCLUDE = '{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}';

/** core profile 이 모으는 test source. RN Jest 와 eval 의 RN fixture 는 서로 다른 source 다. */
export const TEST_SOURCES: TestSourceSpec[] = [
  {
    commandId: 'test.observability-contracts',
    sourceId: 'vitest:@berrypjh/observability-contracts',
    area: 'nx-project',
    project: '@berrypjh/observability-contracts',
    runner: 'vitest',
    projectRoot: 'libs/observability-contracts',
    configFile: 'libs/observability-contracts/vitest.config.mts',
    include: ['tests/**/*.test.ts'],
    format: 'vitest-json',
    reporterArgs: (reportPath) => afterNx(vitestJson(reportPath)),
  },
  {
    commandId: 'test.quality-lab',
    sourceId: 'vitest:@berrypjh/quality-lab',
    area: 'nx-project',
    project: '@berrypjh/quality-lab',
    runner: 'vitest',
    projectRoot: 'apps/quality-lab',
    configFile: 'apps/quality-lab/vite.config.mts',
    include: ['src/**/*.spec.{ts,tsx}'],
    format: 'vitest-json',
    reporterArgs: (reportPath) => afterNx(vitestJson(reportPath)),
  },
  {
    commandId: 'test.react-ui',
    sourceId: 'vitest:@berrypjh/react-ui',
    area: 'nx-project',
    project: '@berrypjh/react-ui',
    runner: 'vitest',
    projectRoot: 'libs/react-ui',
    configFile: 'libs/react-ui/vitest.config.mts',
    include: ['{src,test}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    format: 'vitest-json',
    reporterArgs: vitestJson,
  },
  {
    commandId: 'test.react-native-ui',
    sourceId: 'jest:@berrypjh/react-native-ui',
    area: 'nx-project',
    project: '@berrypjh/react-native-ui',
    runner: 'jest',
    projectRoot: 'libs/react-native-ui',
    configFile: 'libs/react-native-ui/jest.config.cjs',
    include: ['src/**/*.test.tsx', 'src/**/*.test.ts'],
    format: 'jest-json',
    reporterArgs: (reportPath) => afterNx(jestJson(reportPath)),
  },
  {
    commandId: 'test.demo-web',
    sourceId: 'vitest:@berrypjh/demo-web',
    area: 'nx-project',
    project: '@berrypjh/demo-web',
    runner: 'vitest',
    projectRoot: 'apps/demo-web',
    configFile: 'apps/demo-web/vite.config.mts',
    include: [VITEST_INCLUDE],
    format: 'vitest-json',
    reporterArgs: (reportPath) => afterNx(vitestJson(reportPath)),
  },
  {
    commandId: 'test.tools',
    sourceId: 'vitest:tools',
    area: 'tools',
    project: 'tools',
    runner: 'vitest',
    projectRoot: 'tools',
    configFile: 'tools/vitest.tools.config.mts',
    include: ['**/*.test.ts'],
    format: 'vitest-json',
    reporterArgs: vitestJson,
  },
];

const TEST_FILE = /\.(?:test|spec)\.[cm]?[jt]sx?$/;
const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'out-tsc',
  'test-output',
  'storybook-static',
  'coverage',
  '.generated',
]);

/** project 아래 test 파일 목록 (parse-only). symlink 는 따라가지 않는다. */
const scanTestFiles = async (workspaceRoot: string, projectRoot: string): Promise<string[]> => {
  const files: string[] = [];
  const walk = async (relative: string) => {
    const entries: Dirent[] = await fs.readdir(await resolveInside(workspaceRoot, relative), {
      withFileTypes: true,
    });
    for (const entry of entries) {
      if (entry.isDirectory() && !SKIP_DIRS.has(entry.name))
        await walk(`${relative}/${entry.name}`);
      else if (entry.isFile() && TEST_FILE.test(entry.name))
        files.push(`${relative}/${entry.name}`);
    }
  };
  await walk(projectRoot);
  return files.sort();
};

const conformanceFilesOf = async (workspaceRoot: string, files: string[]): Promise<Set<string>> => {
  const matches = new Set<string>();
  for (const file of files) {
    if ((await readText(workspaceRoot, file)).includes('describeConformance')) matches.add(file);
  }
  return matches;
};

const includeHashOf = async (workspaceRoot: string, spec: TestSourceSpec): Promise<string> => {
  if (spec.configFile === null) return UNKNOWN;
  const config = await readText(workspaceRoot, spec.configFile).catch(missingAs(null));
  return config === null ? UNKNOWN : sha256(JSON.stringify({ include: spec.include, config }));
};

type CollectInput = {
  spec: TestSourceSpec;
  workspaceRoot: string;
  /** 이번 run 전용 작업 디렉터리 (workspace 상대). report 를 매번 새 경로에 쓴다. */
  workDir: string;
  exec: Exec;
  timeoutMs: number;
  importPath: string | null;
  runnerVersion: string;
};

type Obtained = { execution: ExecutionRecord; text: string | null; missingReason: string };

const importReport = async (input: CollectInput, importPath: string): Promise<Obtained> => ({
  execution: {
    status: 'imported',
    exitCode: null,
    timeoutMs: null,
    wallMs: null,
    excerpt: null,
    reason: `${importPath} 에서 가져왔다 — 수집기가 실행하지 않았다`,
    cache: 'unknown',
  },
  text: await readImport(input.workspaceRoot, importPath),
  missingReason: 'import 한 report 가 비어 있다',
});

/**
 * registry argv + 고정 reporter 인자로 실행한다. report 경로는 실행 전에 지워 두므로 이전 run 의
 * report 를 읽을 수 없다. Nx 가 대상 task 를 cache 에서 복원했으면 report 가 없는 것으로 본다.
 */
const runReport = async (input: CollectInput): Promise<Obtained> => {
  const { spec, workspaceRoot, timeoutMs } = input;
  const reportRelative = `${input.workDir}/${spec.commandId}.json`;
  const reportAbsolute = await resolveInside(workspaceRoot, reportRelative);
  await fs.mkdir(path.dirname(reportAbsolute), { recursive: true });
  await fs.rm(reportAbsolute, { force: true });
  const argv = [...commandById(spec.commandId).argv, ...spec.reporterArgs(reportAbsolute)];

  let result;
  try {
    result = await input.exec(argv, { cwd: workspaceRoot, timeoutMs });
  } catch (error) {
    const reason = sanitizeExcerpt(`실행하지 못했다: ${(error as Error).message}`, 400);
    return {
      execution: {
        status: 'unavailable',
        exitCode: null,
        timeoutMs,
        wallMs: null,
        excerpt: null,
        reason,
        cache: cacheOriginOf(argv, ''),
      },
      text: null,
      missingReason: '실행하지 못해 report 가 없다',
    };
  }

  const execution = {
    ...executionOf(result, timeoutMs),
    cache: cacheOriginOf(argv, `${result.stdout}\n${result.stderr}`),
  };
  if (execution.cache === 'restored') {
    return {
      execution,
      text: null,
      missingReason: 'Nx 가 cache 에서 복원해 runner 가 report 를 쓰지 않았다',
    };
  }
  const text = await readText(workspaceRoot, reportRelative).catch(missingAs(null));
  return {
    execution,
    text,
    missingReason:
      execution.reason ?? `runner 가 report 를 쓰지 않았다 (exit ${execution.exitCode})`,
  };
};

const reportInputOf = (
  spec: TestSourceSpec,
  text: string | null,
  missingReason: string,
  rawPath: string,
): ReportInput => {
  const reportPath = `raw/${rawPath}`;
  if (text === null || text.trim() === '') {
    return {
      status: 'missing',
      format: spec.format,
      path: null,
      sha256: null,
      reason: missingReason,
    };
  }
  try {
    return {
      status: 'parsed',
      path: reportPath,
      sha256: sha256(text),
      report: PARSERS[spec.format](text),
    };
  } catch (error) {
    if (!(error instanceof ReportParseError)) throw error;
    return {
      status: error.kind,
      format: spec.format,
      path: reportPath,
      sha256: sha256(text),
      reason: sanitizeExcerpt(error.message.split('\n')[0] ?? error.message, 400),
    };
  }
};

/** test source 하나를 실행(또는 import)해 TestSummary 와 raw report 를 만든다. */
export const collectTestSource = async (
  input: CollectInput,
): Promise<{ summary: TestSummary; raw: RawFile | null }> => {
  const { spec, workspaceRoot } = input;
  const testFiles = await scanTestFiles(workspaceRoot, spec.projectRoot).catch((error: unknown) => {
    if (isMissing(error)) return null;
    throw error;
  });
  const obtained =
    input.importPath === null
      ? await runReport(input)
      : await importReport(input, input.importPath);
  const rawPath = `tests/${spec.commandId}.json`;

  const summary = normalizeTestRun({
    source: {
      commandId: spec.commandId,
      sourceId: spec.sourceId,
      area: spec.area,
      project: spec.project,
      runner: spec.runner,
      runnerVersion: input.runnerVersion,
      include: spec.include,
      includeHash: await includeHashOf(workspaceRoot, spec),
      selectedProjects: [spec.project],
      fileBase: spec.fileBase,
    },
    execution: obtained.execution,
    report: reportInputOf(spec, obtained.text, obtained.missingReason, rawPath),
    workspaceRoot,
    sourceFiles:
      testFiles === null
        ? { value: null, reason: `${spec.projectRoot} 가 없다` }
        : { value: testFiles.length, reason: null },
    conformanceFiles:
      testFiles === null ? new Set() : await conformanceFilesOf(workspaceRoot, testFiles),
  });

  const raw =
    obtained.text === null
      ? null
      : {
          path: rawPath,
          value: { format: spec.format, sha256: sha256(obtained.text), text: obtained.text },
        };
  return { summary, raw };
};
