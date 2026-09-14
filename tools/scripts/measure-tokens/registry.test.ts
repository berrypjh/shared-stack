import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { findMissingFiles, MEASURE_TARGETS, readScenarioFiles } from './registry';

/**
 * shared.ts 에서 옮긴 등록부와 내용 구성의 characterization. CLI 와 quality-lab 수집기가 같은
 * 파일 목록·같은 이어 붙이기로 token 을 세야 두 숫자가 같은 측정이다.
 */
describe('MEASURE_TARGETS', () => {
  it('네 target 과 package 디렉터리를 유지한다', () => {
    expect(
      Object.fromEntries(
        Object.entries(MEASURE_TARGETS).map(([name, target]) => [name, target.dir]),
      ),
    ).toEqual({
      'design-tokens': 'libs/design-tokens',
      'ui-core': 'libs/ui-core',
      'react-ui': 'libs/react-ui',
      'react-native-ui': 'libs/react-native-ui',
    });
  });

  it('시나리오 파일 목록을 바꾸지 않는다', () => {
    expect(MEASURE_TARGETS['react-ui'].scenarios).toEqual({
      baseline: ['package.json', 'README.md', 'dist/types/index.d.ts'],
      'with-agents': ['package.json', 'dist/AGENTS.md'],
      'agents-only': ['dist/AGENTS.md'],
      'agents+tokens': ['dist/AGENTS.md', 'dist/tokens.json'],
      'tokens-only': ['dist/tokens.json'],
      'agents+api-catalog': ['dist/AGENTS.md', 'dist/llm-catalog.json'],
      'api-catalog-only': ['dist/llm-catalog.json'],
    });
    expect(MEASURE_TARGETS['design-tokens'].scenarios['agents+catalog']).toEqual([
      'dist/AGENTS.md',
      'dist/tokens.json',
    ]);
  });
});

describe('readScenarioFiles', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'measure-tokens-'));
    await fs.mkdir(path.join(dir, 'dist'));
    await fs.writeFile(path.join(dir, 'package.json'), '{"name":"x"}');
    await fs.writeFile(path.join(dir, 'dist/tokens.json'), '[]');
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('`=== rel ===` 머리와 빈 줄로 이어 붙인다', async () => {
    const content = '=== package.json ===\n{"name":"x"}\n\n=== dist/tokens.json ===\n[]';
    expect(await readScenarioFiles(dir, ['package.json', 'dist/tokens.json'])).toEqual({
      content,
      chars: content.length,
    });
  });

  it('없는 파일은 기존과 같은 메시지로 실패한다', async () => {
    await expect(readScenarioFiles(dir, ['dist/AGENTS.md'])).rejects.toThrow(
      'missing file dist/AGENTS.md — build the target package first.',
    );
  });

  it('없는 파일 목록은 내용을 읽지 않고 알려준다', async () => {
    expect(
      await findMissingFiles(dir, ['package.json', 'dist/AGENTS.md', 'dist/tokens.json']),
    ).toEqual(['dist/AGENTS.md']);
  });
});
