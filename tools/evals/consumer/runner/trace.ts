import fs from 'node:fs/promises';
import path from 'node:path';

import type { TaskGrade } from '../graders';

import { parseJsonl, toJsonl } from './jsonl';
import { type Trace, traceSchema } from './schema';

/** 채점 결과가 붙은 trace. `traces.jsonl`에 이 형태로 저장한다. */
export type GradedTrace = Trace & { grade: TaskGrade };

/** unknown key(= grade)는 zod가 strip하므로 graded trace도 그대로 다시 읽힌다. */
export const parseTraces = (text: string, label: string): Trace[] =>
  parseJsonl(text, label).map(({ line, value }) => {
    const parsed = traceSchema.safeParse(value);
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; ');
      throw new Error(`${label}:${line} invalid trace — ${issues}`);
    }
    return parsed.data;
  });

export const readTraces = async (file: string): Promise<Trace[]> =>
  parseTraces(await fs.readFile(file, 'utf8'), file);

export const writeTraces = async (file: string, traces: GradedTrace[]): Promise<void> => {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, toJsonl(traces), 'utf8');
};
