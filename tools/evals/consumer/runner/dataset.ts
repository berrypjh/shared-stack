import path from 'node:path';

import { readJsonlFile } from './jsonl';
import { fromRepoRoot } from './paths';
import { type ConsumerEvalTask, consumerEvalTaskSchema, type Split } from './schema';

export const DATASET_DIR = fromRepoRoot('tools/evals/consumer/datasets');

export const datasetFile = (split: Split): string => path.join(DATASET_DIR, `${split}.jsonl`);

/** 줄 하나라도 schema를 어기면 parse 단계에서 실패한다. */
export const parseTasks = (
  rows: { line: number; value: unknown }[],
  label: string,
): ConsumerEvalTask[] => {
  const tasks = rows.map(({ line, value }) => {
    const parsed = consumerEvalTaskSchema.safeParse(value);
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; ');
      throw new Error(`${label}:${line} invalid task — ${issues}`);
    }
    return parsed.data;
  });

  const seen = new Set<string>();
  for (const t of tasks) {
    if (seen.has(t.taskId)) throw new Error(`${label} duplicate taskId "${t.taskId}"`);
    seen.add(t.taskId);
  }
  return tasks;
};

export const loadDataset = async (split: Split): Promise<ConsumerEvalTask[]> => {
  const file = datasetFile(split);
  return parseTasks(await readJsonlFile(file), file);
};
