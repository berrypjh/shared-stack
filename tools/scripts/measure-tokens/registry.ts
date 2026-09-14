import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * 패키지별 시나리오 등록부와 내용 구성. measure-tokens CLI(`shared.ts`)와 quality-lab 수집기가
 * 같은 파일 목록·같은 이어 붙이기로 token 을 세도록 여기 한 벌만 둔다.
 *
 * 새 패키지 추가는 여기 항목 추가만 하면 됨.
 */
export type MeasureTarget = { dir: string; scenarios: Record<string, string[]> };

export const MEASURE_TARGETS = {
  'design-tokens': {
    dir: 'libs/design-tokens',
    scenarios: {
      baseline: [
        'package.json',
        'README.md',
        'dist/index.d.ts',
        'dist/web.d.ts',
        'dist/.generated/web/index.d.ts',
        'dist/.generated/web/themes/light/tokens.d.ts',
        'dist/.generated/web/themes/dark/tokens.d.ts',
        'dist/.generated/web/themes/sepia/tokens.d.ts',
      ],
      'with-catalog': ['package.json', 'dist/tokens.json'],
      'catalog-only': ['dist/tokens.json'],
      'agents+catalog': ['dist/AGENTS.md', 'dist/tokens.json'],

      // TSV 변형은 미채택 — 재평가 시 design-tokens lib에 `writeTokensTsv` 부활 후 주석 해제.
      // 'with-tsv': ['package.json', 'dist/tokens.tsv'],
      // 'tsv-only': ['dist/tokens.tsv'],
    } as Record<string, string[]>,
  },
  'ui-core': {
    dir: 'libs/ui-core',
    scenarios: {
      baseline: ['package.json', 'README.md', 'dist/index.d.ts'],
      'with-agents': ['package.json', 'dist/AGENTS.md'],
      'agents-only': ['dist/AGENTS.md'],
      'agents+tokens': ['dist/AGENTS.md', 'dist/tokens.json'],
      'tokens-only': ['dist/tokens.json'],
    } as Record<string, string[]>,
  },
  'react-ui': {
    dir: 'libs/react-ui',
    scenarios: {
      baseline: ['package.json', 'README.md', 'dist/types/index.d.ts'],
      'with-agents': ['package.json', 'dist/AGENTS.md'],
      'agents-only': ['dist/AGENTS.md'],
      'agents+tokens': ['dist/AGENTS.md', 'dist/tokens.json'],
      'tokens-only': ['dist/tokens.json'],
      // Command 02 — 생성 API 카탈로그. 기존 시나리오 의미는 그대로 둔다.
      'agents+api-catalog': ['dist/AGENTS.md', 'dist/llm-catalog.json'],
      'api-catalog-only': ['dist/llm-catalog.json'],
    } as Record<string, string[]>,
  },
  'react-native-ui': {
    dir: 'libs/react-native-ui',
    scenarios: {
      baseline: ['package.json', 'README.md', 'dist/index.d.ts'],
      'with-agents': ['package.json', 'dist/AGENTS.md'],
      'agents-only': ['dist/AGENTS.md'],
      'agents+tokens': ['dist/AGENTS.md', 'dist/tokens.json'],
      'tokens-only': ['dist/tokens.json'],
      // Command 02 — 생성 API 카탈로그. 기존 시나리오 의미는 그대로 둔다.
      'agents+api-catalog': ['dist/AGENTS.md', 'dist/llm-catalog.json'],
      'api-catalog-only': ['dist/llm-catalog.json'],
    } as Record<string, string[]>,
  },
} as const satisfies Record<string, MeasureTarget>;

export type MeasureTargetName = keyof typeof MEASURE_TARGETS;

/** 시나리오 파일을 `=== rel ===` 머리와 빈 줄로 이어 붙인다. token 수는 이 구성에 달려 있다. */
export const readScenarioFiles = async (
  packageDir: string,
  rels: string[],
): Promise<{ content: string; chars: number }> => {
  const parts: string[] = [];
  for (const rel of rels) {
    const abs = path.join(packageDir, rel);
    try {
      const text = await fs.readFile(abs, 'utf8');
      parts.push(`=== ${rel} ===\n${text}`);
    } catch (e) {
      throw new Error(
        `missing file ${rel} — build the target package first. (${(e as Error).message})`,
      );
    }
  }
  const content = parts.join('\n\n');
  return { content, chars: content.length };
};

/** 내용을 읽지 않고 없는 파일만 찾는다. 수집기가 부분 합계 대신 missing-input 을 기록할 때 쓴다. */
export const findMissingFiles = async (packageDir: string, rels: string[]): Promise<string[]> => {
  const missing: string[] = [];
  for (const rel of rels) {
    try {
      await fs.access(path.join(packageDir, rel));
    } catch {
      missing.push(rel);
    }
  }
  return missing;
};
