import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';

import { SCHEMA_VERSION } from '../../../scripts/generate-consumer-catalog/schema';
import { datasetFile } from '../runner/dataset';
import type { Split } from '../runner/schema';
import { HARNESS_VERSION } from '../runner/version';

/**
 * 두 run을 비교해도 되는지 판단하기 위한 조건 metadata.
 * 조건이 다르면 숫자를 나란히 놓지 않고 경고를 낸다.
 */

export type RunConditions = {
  gitSha: string | null;
  ref: string | null;
  split: Split;
  /** dev+test dataset 내용 해시. 데이터가 바뀌면 비교 불가. */
  datasetHash: string;
  datasetTaskCount: number;
  variants: string[];
  trials: number;
  executor: string;
  model: string | null;
  /** 모델 설정을 모르면 null — 임의 값으로 채우지 않는다. */
  modelSettings: Record<string, unknown> | null;
  timeoutMs: number | null;
  /** variant별 allowedCapabilities 집합의 해시. tool 권한이 바뀌면 비교 불가. */
  capabilityHash: string;
  catalogSchemaVersion: number;
  harnessVersion: string;
};

const sha256 = (value: string): string =>
  createHash('sha256').update(value).digest('hex').slice(0, 16);

export const hashDatasets = async (): Promise<{ hash: string; taskCount: number }> => {
  const parts: string[] = [];
  let taskCount = 0;
  for (const split of ['dev', 'test'] as const) {
    const text = await fs.readFile(datasetFile(split), 'utf8');
    parts.push(text);
    taskCount += text.split('\n').filter((line) => line.trim()).length;
  }
  return { hash: sha256(parts.join('\n')), taskCount };
};

export const hashCapabilities = (
  variants: { id: string; allowedCapabilities: string[] }[],
): string =>
  sha256(
    variants
      .map((v) => `${v.id}:${[...v.allowedCapabilities].sort().join(',')}`)
      .sort()
      .join('|'),
  );

export const CONDITION_FIELDS = [
  'datasetHash',
  'variants',
  'trials',
  'executor',
  'model',
  'capabilityHash',
  'catalogSchemaVersion',
  'harnessVersion',
  'split',
] as const;

export type ConditionWarning = { field: string; baseline: string; current: string };

/** 비교 전제가 어긋난 항목을 나열한다. 빈 배열이면 같은 조건이다. */
export const compareConditions = (
  baseline: RunConditions,
  current: RunConditions,
): ConditionWarning[] => {
  const warnings: ConditionWarning[] = [];
  for (const field of CONDITION_FIELDS) {
    const a = JSON.stringify(baseline[field] ?? null);
    const b = JSON.stringify(current[field] ?? null);
    if (a !== b) warnings.push({ field, baseline: a, current: b });
  }
  return warnings;
};

export type BuildConditionsInput = {
  gitSha: string | null;
  ref: string | null;
  split: Split;
  variants: { id: string; allowedCapabilities: string[] }[];
  trials: number;
  executor: string;
  model: string | null;
  timeoutMs?: number | null;
};

export const buildConditions = async (input: BuildConditionsInput): Promise<RunConditions> => {
  const { hash, taskCount } = await hashDatasets();
  return {
    gitSha: input.gitSha,
    ref: input.ref,
    split: input.split,
    datasetHash: hash,
    datasetTaskCount: taskCount,
    variants: input.variants.map((v) => v.id),
    trials: input.trials,
    executor: input.executor,
    model: input.model,
    // executor가 모델 설정을 보고하지 않으면 null로 남긴다.
    modelSettings: null,
    timeoutMs: input.timeoutMs ?? null,
    capabilityHash: hashCapabilities(input.variants),
    catalogSchemaVersion: SCHEMA_VERSION,
    harnessVersion: HARNESS_VERSION,
  };
};
