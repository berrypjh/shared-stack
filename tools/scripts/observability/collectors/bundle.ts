import path from 'node:path';

import type { BundleMeasurement } from '@berrypjh/observability-contracts';

import { ReportParseError } from '../adapters/report';
import { parseSizeLimitReport, readSizeLimitCases } from '../adapters/size-limit';
import { parseTreeshakeReport } from '../adapters/treeshake';
import { normalizeSizeLimit, normalizeTreeshake, type ReportFailure } from '../normalizers/bundle';
import type { ExecutionRecord } from '../normalizers/tests';
import { commandById } from '../registry';
import { sha256 } from '../safe-fs';
import type { RawFile } from '../store';

import { type Exec, executionOf } from './exec';
import { readImport } from './imports';

type Execution = Omit<ExecutionRecord, 'cache'>;

type Captured = { text: string | null; execution: Execution | null; failure: ReportFailure | null };

type CaptureInput = {
  workspaceRoot: string;
  exec: Exec;
  timeoutMs: number;
  importPath: string | null;
  commandId: string;
};

/**
 * stdout 으로 report 를 쓰는 명령을 실행하거나, import 한 report 를 읽는다.
 * 한도 초과처럼 비zero exit 여도 출력이 있으면 그 report 를 먼저 본다.
 */
const capture = async ({
  workspaceRoot,
  exec,
  timeoutMs,
  importPath,
  commandId,
}: CaptureInput): Promise<Captured> => {
  if (importPath !== null)
    return { text: await readImport(workspaceRoot, importPath), execution: null, failure: null };
  let result;
  try {
    result = await exec(commandById(commandId).argv, { cwd: workspaceRoot, timeoutMs });
  } catch (error) {
    return {
      text: null,
      execution: null,
      failure: { status: 'missing', message: `실행하지 못했다: ${(error as Error).message}` },
    };
  }
  const execution = executionOf(result, timeoutMs);
  if (result.stdout.trim()) return { text: result.stdout, execution, failure: null };
  return {
    text: null,
    execution,
    failure: {
      status: result.timedOut ? 'missing' : 'corrupt',
      message:
        execution.reason ??
        `출력이 없다 (exit ${execution.exitCode}) ${execution.excerpt ?? ''}`.trim(),
    },
  };
};

const parseOrFailure = <T>(text: string, parse: (text: string) => T): T | ReportFailure => {
  try {
    return parse(text);
  } catch (error) {
    if (error instanceof ReportParseError) return { status: error.kind, message: error.message };
    throw error;
  }
};

/** 원문 report 를 해시와 함께 raw 로 남긴다. 공개 export 에는 실리지 않는다. */
const rawOf = (rawPath: string, text: string | null): RawFile | null =>
  text === null ? null : { path: rawPath, value: { sha256: sha256(text), text } };

type SizeLimitInput = Omit<CaptureInput, 'commandId'> & {
  toolVersion: string;
  parseLimit: (limit: string) => number | null;
};

/** `.size-limit.cjs` case 와 `size-limit --json` 결과를 모은다. case·한도는 config 에서, 값은 report 에서만 온다. */
export const collectSizeLimit = async (input: SizeLimitInput) => {
  const cases = readSizeLimitCases(path.join(input.workspaceRoot, '.size-limit.cjs'));
  const captured = await capture({ ...input, commandId: 'bundle.size-limit' });
  const report = captured.failure ?? parseOrFailure(captured.text as string, parseSizeLimitReport);
  const { measurements, unmatchedEntries } = normalizeSizeLimit({
    cases,
    report,
    toolVersion: input.toolVersion,
    parseLimit: input.parseLimit,
  });
  return {
    measurements,
    unmatchedEntries,
    execution: captured.execution,
    raw: rawOf('bundle/size-limit.json', captured.text),
  };
};

type TreeshakeInput = Omit<CaptureInput, 'commandId'> & { toolVersion: string };

/** 등록된 treeshake `--json` 실행. 출력 자체를 읽지 못하면 측정값 없이 실패 이유만 돌려준다. */
export const collectTreeshake = async (
  input: TreeshakeInput,
): Promise<{
  measurements: BundleMeasurement[];
  failure: ReportFailure | null;
  execution: Execution | null;
  raw: RawFile | null;
}> => {
  const captured = await capture({ ...input, commandId: 'bundle.treeshake.react-ui' });
  const raw = rawOf('bundle/treeshake-react-ui.json', captured.text);
  const report = captured.failure ?? parseOrFailure(captured.text as string, parseTreeshakeReport);
  if ('status' in report)
    return { measurements: [], failure: report, execution: captured.execution, raw };
  return {
    measurements: normalizeTreeshake({ report, toolVersion: input.toolVersion }),
    failure: null,
    execution: captured.execution,
    raw,
  };
};
