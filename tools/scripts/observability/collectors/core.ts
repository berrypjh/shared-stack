import path from 'node:path';

import {
  type BundleMeasurement,
  type ContextMeasurement,
  type MetricObservation,
  metricObservationSchema,
  type Observation,
  type RunArtifact,
  runArtifactSchema,
  sanitizeExcerpt,
  SCHEMA_VERSION,
} from '@berrypjh/observability-contracts';

import { readSizeLimitCases } from '../adapters/size-limit';
import { loadLimitParser, normalizeSizeLimit, type ReportFailure } from '../normalizers/bundle';
import { COMMANDS, type CommandSpec } from '../registry';
import { type GitReader, readInventory, readSource } from '../static';
import type { RawFile } from '../store';

import { collectSizeLimit, collectTreeshake } from './bundle';
import type { Exec } from './exec';

export type CoreInput = {
  workspaceRoot: string;
  runId: string;
  git: GitReader;
  env: NodeJS.ProcessEnv;
  now: () => Date;
  toolVersions: Record<string, string>;
  exec: Exec;
  timeoutMs: number;
  /** command id → imports 디렉터리 안의 raw report. 있으면 그 명령을 실행하지 않는다. */
  imports: Record<string, string>;
  /** import 가 없는 명령을 실행하지 않고 not-run 으로 둔다. */
  onlyImports: boolean;
  collectContexts: () => Promise<ContextMeasurement[]>;
};

const ONLY_IMPORTS = '--only-imports: import 한 report 가 없어 실행하지 않았다';
const NOT_IN_PROFILE = 'core profile 은 이 명령을 실행하지 않는다';

const metric = (command: CommandSpec, fields: Record<string, unknown>): MetricObservation =>
  metricObservationSchema.parse({
    id: command.id,
    domain: command.domain,
    unit: command.unit,
    scope: command.scope,
    evidence: [],
    availability: 'not-run',
    value: null,
    denominator: null,
    outcome: null,
    reason: NOT_IN_PROFILE,
    ...fields,
  });

/** bundle·context 는 case 별 값이 따로 있어 한 숫자로 요약하지 않는다. 얼마나 측정됐는지만 말한다. */
const summaryObservation = (
  command: CommandSpec,
  measured: { availability: string }[],
  failure: ReportFailure | null,
  where: string,
  extra = '',
): MetricObservation => {
  const available = measured.filter((item) => item.availability === 'available').length;
  if (available > 0) {
    return metric(command, {
      availability: 'not-applicable',
      reason: `${where} 에 값이 있다 — ${available}/${measured.length} 측정${extra}`,
    });
  }
  const availability =
    failure?.status === 'not-run' || measured.some((item) => item.availability === 'not-run')
      ? 'not-run'
      : failure?.status === 'corrupt' || failure?.status === 'invalid'
        ? 'invalid'
        : 'unavailable';
  return metric(command, {
    availability,
    reason: sanitizeExcerpt(failure?.message ?? `${where} 에 측정값이 없다`, 480),
  });
};

type BundleResult = {
  measurements: BundleMeasurement[];
  failure: ReportFailure | null;
  raw: RawFile | null;
};

const sizeLimitOf = async (input: CoreInput): Promise<BundleResult> => {
  const importPath = input.imports['bundle.size-limit'] ?? null;
  const toolVersion = input.toolVersions['size-limit'] ?? 'unknown';
  const parseLimit = loadLimitParser();
  if (input.onlyImports && importPath === null) {
    const failure: ReportFailure = { status: 'not-run', message: ONLY_IMPORTS };
    const cases = readSizeLimitCases(path.join(input.workspaceRoot, '.size-limit.cjs'));
    return {
      ...normalizeSizeLimit({ cases, report: failure, toolVersion, parseLimit }),
      failure,
      raw: null,
    };
  }
  const collected = await collectSizeLimit({ ...input, importPath, toolVersion, parseLimit });
  return { measurements: collected.measurements, failure: null, raw: collected.raw };
};

const treeshakeOf = async (input: CoreInput): Promise<BundleResult> => {
  const importPath = input.imports['bundle.treeshake.react-ui'] ?? null;
  if (input.onlyImports && importPath === null) {
    return { measurements: [], failure: { status: 'not-run', message: ONLY_IMPORTS }, raw: null };
  }
  const collected = await collectTreeshake({
    ...input,
    importPath,
    toolVersion: input.toolVersions.esbuild ?? 'unknown',
  });
  return { measurements: collected.measurements, failure: collected.failure, raw: collected.raw };
};

/**
 * core profile. bundle 은 registry 명령을 실행하거나 import 한 report 를 읽고,
 * context 는 in-process 로 센다. 하나라도 값이 없으면 run 은 partial 이다.
 */
export const collectCore = async (
  input: CoreInput,
): Promise<{ artifact: RunArtifact; raw: RawFile[] }> => {
  const startedAt = input.now().toISOString();
  const source = await readSource(input.workspaceRoot, input.git, input.env);
  const inventory = await readInventory(input.workspaceRoot);
  const raws: RawFile[] = [
    {
      path: 'static-inputs.json',
      value: { workflows: inventory.workflows, lockfileHash: source.lockfileHash },
    },
  ];

  const sizeLimit = await sizeLimitOf(input);
  const treeshake = await treeshakeOf(input);
  for (const raw of [sizeLimit.raw, treeshake.raw]) if (raw) raws.push(raw);
  const contexts = await input.collectContexts();

  const observationOf = (command: CommandSpec): Observation => {
    if (command.id === 'bundle.size-limit') {
      const failing = sizeLimit.measurements.filter((m) => m.budget?.outcome === 'fail').length;
      return summaryObservation(
        command,
        sizeLimit.measurements,
        sizeLimit.failure,
        'bundles',
        `, 한도 초과 ${failing}`,
      );
    }
    if (command.id === 'bundle.treeshake.react-ui') {
      return summaryObservation(command, treeshake.measurements, treeshake.failure, 'bundles');
    }
    if (command.domain === 'context')
      return summaryObservation(command, contexts, null, 'contexts');
    return metric(command, {});
  };

  const incomplete =
    treeshake.failure !== null ||
    [...sizeLimit.measurements, ...treeshake.measurements, ...contexts].some(
      (item) => item.availability !== 'available',
    );

  const artifact = runArtifactSchema.parse({
    metadata: {
      schemaVersion: SCHEMA_VERSION,
      runId: input.runId,
      state: incomplete ? 'partial' : 'complete',
      profile: 'core',
      scope: ['workspace'],
      source,
      collection: { sha: source.sha, startedAt, finishedAt: input.now().toISOString() },
      tools: input.toolVersions,
      cache: 'disabled',
    },
    inventory,
    observations: COMMANDS.map(observationOf),
    bundles: [...sizeLimit.measurements, ...treeshake.measurements],
    contexts,
  });
  return { artifact, raw: raws };
};
