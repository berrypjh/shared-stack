import fs from 'node:fs/promises';

/** 빈 줄은 건너뛰고, 깨진 줄은 줄 번호와 함께 즉시 throw한다. */
export const parseJsonl = (text: string, label: string): { line: number; value: unknown }[] => {
  const out: { line: number; value: unknown }[] = [];
  text.split('\n').forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    try {
      out.push({ line: i + 1, value: JSON.parse(line) });
    } catch (e) {
      throw new Error(`${label}:${i + 1} invalid JSON — ${(e as Error).message}`);
    }
  });
  return out;
};

export const toJsonl = (rows: unknown[]): string =>
  rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : '');

export const readJsonlFile = async (file: string): Promise<{ line: number; value: unknown }[]> =>
  parseJsonl(await fs.readFile(file, 'utf8'), file);
