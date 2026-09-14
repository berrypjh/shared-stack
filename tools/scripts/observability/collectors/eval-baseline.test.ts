import fs from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { tempDir } from '../__fixtures__/fixtures';

import { readEvalBaselineFile } from './eval-baseline';

/**
 * evaluator 의 `readBaseline` 은 모든 오류를 null(없음)로 돌린다. 대시보드 importer 는 그 전에
 * 없는 파일과 깨진 파일을 나눠 읽는다.
 */
describe('readEvalBaselineFile', () => {
  const fileIn = async (text: string | null) => {
    const dir = await tempDir('eval-baseline');
    const file = path.join(dir, 'dev.json');
    if (text !== null) await fs.writeFile(file, text);
    return file;
  };

  it('파일이 없으면 missing 이다', async () => {
    expect(await readEvalBaselineFile(await fileIn(null))).toEqual({ status: 'missing' });
  });

  it('JSON 이 아니면 invalid 이고 이유가 있다', async () => {
    const result = await readEvalBaselineFile(await fileIn('{oops'));
    expect(result).toMatchObject({ status: 'invalid' });
    expect(result.status === 'invalid' && result.reason).toMatch(/JSON/);
  });

  it('baseline 모양(conditions·metrics·createdAt)이 아니면 invalid 이다', async () => {
    const result = await readEvalBaselineFile(await fileIn('{"metrics": 1}'));
    expect(result).toMatchObject({ status: 'invalid' });
  });

  it('모양이 맞으면 present 다 — 값은 해석하지 않는다', async () => {
    const text = JSON.stringify({
      conditions: { split: 'dev' },
      createdAt: '2026-09-13T00:00:00.000Z',
      metrics: {},
    });
    expect(await readEvalBaselineFile(await fileIn(text))).toEqual({ status: 'present' });
  });
});
