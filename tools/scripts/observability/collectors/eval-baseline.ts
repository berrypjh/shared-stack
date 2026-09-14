import fs from 'node:fs/promises';

import { isMissing } from '../safe-fs';

/**
 * evaluator baseline 파일(`tools/evals/consumer/baseline/<split>.json`)이 있는지만 확인한다.
 * evaluator 의 `readBaseline` 은 없는 파일과 깨진 파일을 모두 null 로 돌리므로 여기서 먼저 나눈다.
 * 값은 해석하지 않는다 — 비교는 evaluator 가 `--compare-baseline` 으로 한다.
 */

export type EvalBaselineFile =
  | { status: 'missing' }
  | { status: 'invalid'; reason: string }
  | { status: 'present' };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const readEvalBaselineFile = async (file: string): Promise<EvalBaselineFile> => {
  let text: string;
  try {
    text = await fs.readFile(file, 'utf8');
  } catch (error) {
    if (isMissing(error)) return { status: 'missing' };
    return {
      status: 'invalid',
      reason: `baseline 파일을 읽을 수 없다: ${(error as Error).message}`,
    };
  }
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { status: 'invalid', reason: 'baseline 파일이 JSON 이 아니다' };
  }
  if (
    !isRecord(value) ||
    !isRecord(value.conditions) ||
    !isRecord(value.metrics) ||
    typeof value.createdAt !== 'string'
  ) {
    return { status: 'invalid', reason: 'baseline 파일에 conditions·metrics·createdAt 이 없다' };
  }
  return { status: 'present' };
};
