import path from 'node:path';

import {
  type RunArtifact,
  runArtifactSchema,
  SCHEMA_VERSION,
} from '@berrypjh/observability-contracts';

import {
  EvalImportError,
  parseContextReport,
  parseEvalSummary,
  parseGradedTraces,
  parseRoutingReport,
} from '../adapters/eval';
import { normalizeVariantContexts } from '../normalizers/context';
import { type Imported, normalizeEvalRun } from '../normalizers/eval';
import { ArtifactError, BoundaryError, readText, sha256 } from '../safe-fs';
import { readSource, type StaticInput } from '../static';
import type { RawFile } from '../store';

/** consumer eval runner 의 출력 디렉터리. `tmp` 라 추적되지 않는다. */
export const EVALS_DIR = 'tmp/llm-evals';
/** `tmp/llm-evals/<run>` 한 단계만. traversal·중첩 경로는 받지 않는다. */
export const EVAL_DIR_PATTERN = /^tmp\/llm-evals\/(?!\.\.?$)[\w.-]{1,120}$/;

const TRACES_MAX_BYTES = 64 * 1024 * 1024;
const OFFLINE_REASON = 'executor 를 돌리지 않은 offline 산출물이다 (routing-only·context-only)';

export type EvalCollectInput = StaticInput & {
  from: string;
  tokenizerVersion: string;
  hasBaseline: (split: string) => Promise<boolean>;
};

type InputFile = { path: string; status: Imported<unknown>['status']; sha256: string | null };

/** 파일 하나를 읽고 parse 한다. 없으면 missing, 형태가 틀리면 invalid — 둘 다 성공이 아니다. */
const readInput = async <T>(
  root: string,
  dir: string,
  file: string,
  parse: (text: string, label: string) => T,
  maxBytes?: number,
): Promise<{ imported: Imported<T>; record: InputFile }> => {
  let text: string;
  try {
    text = await readText(root, `${dir}/${file}`, maxBytes);
  } catch (error) {
    if (!(error instanceof ArtifactError && error.kind === 'missing')) throw error;
    return {
      imported: { status: 'missing', reason: `${file} 이 없다` },
      record: { path: file, status: 'missing', sha256: null },
    };
  }
  const record = (status: InputFile['status']) => ({ path: file, status, sha256: sha256(text) });
  try {
    return { imported: { status: 'parsed', value: parse(text, file) }, record: record('parsed') };
  } catch (error) {
    if (!(error instanceof EvalImportError)) throw error;
    return { imported: { status: 'invalid', reason: error.message }, record: record('invalid') };
  }
};

/**
 * eval profile. 이미 만든 `summary.json`·`traces.jsonl`·offline JSON 을 읽기만 한다 —
 * harness·executor·verification 을 다시 실행하지 않는다.
 */
export const collectEval = async (
  input: EvalCollectInput,
): Promise<{ artifact: RunArtifact; raw: RawFile[] }> => {
  if (!EVAL_DIR_PATTERN.test(input.from)) {
    throw new BoundaryError(`${input.from} is not a directory directly under ${EVALS_DIR}`);
  }
  const startedAt = input.now().toISOString();
  const root = input.workspaceRoot;
  const summary = await readInput(root, input.from, 'summary.json', parseEvalSummary);
  const traces = await readInput(
    root,
    input.from,
    'traces.jsonl',
    parseGradedTraces,
    TRACES_MAX_BYTES,
  );
  const routing = await readInput(root, input.from, 'routing.json', parseRoutingReport);
  const context = await readInput(root, input.from, 'context.json', parseContextReport);
  const files = [summary, traces, routing, context];
  if (files.every((file) => file.imported.status === 'missing')) {
    throw new ArtifactError(
      'missing',
      `${input.from} has no eval artifacts (summary.json, traces.jsonl, routing.json, context.json)`,
    );
  }

  const offline = summary.imported.status === 'missing' && traces.imported.status === 'missing';
  const notRun = { status: 'not-run' as const, reason: OFFLINE_REASON };
  const evalRun = normalizeEvalRun({
    sourceId: `eval:${path.posix.basename(input.from)}`,
    summary: offline ? notRun : summary.imported,
    traces: offline ? notRun : traces.imported,
    routing: routing.imported,
    context: context.imported,
    baselineExists:
      summary.imported.status === 'parsed' &&
      (await input.hasBaseline(summary.imported.value.split)),
  });

  const source = await readSource(root, input.git, input.env);
  const incomplete =
    Object.values(evalRun.import).some((status) => status.status === 'invalid') ||
    evalRun.notices.some((notice) => notice.code === 'partial-import');

  const artifact = runArtifactSchema.parse({
    metadata: {
      schemaVersion: SCHEMA_VERSION,
      runId: input.runId,
      state: incomplete ? 'partial' : 'complete',
      profile: 'eval',
      scope: ['tools/evals/consumer'],
      source,
      collection: { sha: source.sha, startedAt, finishedAt: input.now().toISOString() },
      tools: input.toolVersions,
      cache: 'disabled',
    },
    inventory: null,
    observations: [],
    tests: [],
    bundles: [],
    contexts:
      context.imported.status === 'parsed'
        ? normalizeVariantContexts({
            contexts: context.imported.value,
            tokenizerVersion: input.tokenizerVersion,
          })
        : [],
    evals: [evalRun],
  });

  const inputs = { from: input.from, files: files.map((file) => file.record) };
  return { artifact, raw: [{ path: 'eval-inputs.json', value: inputs }] };
};
