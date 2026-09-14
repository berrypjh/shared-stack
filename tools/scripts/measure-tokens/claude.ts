import { anthropicModelFromEnv, countAnthropicTokens } from '../../lib/token-count';

import { printTable, readFiles, type Row, scenarios } from './shared';

/**
 * Anthropic count_tokens REST API로 시나리오별 input 토큰 수를 측정한다.
 * SDK 미사용, fetch만.
 *
 * 사용:
 *   ANTHROPIC_API_KEY=sk-... pnpm tokens:measure:claude
 *
 * 환경변수
 *   ANTHROPIC_API_KEY        (필수)
 *   MEASURE_ANTHROPIC_MODEL  (선택, 기본 'claude-sonnet-4-6')
 */

const MODEL = anthropicModelFromEnv();

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('ANTHROPIC_API_KEY env var is required.');
  console.error('  export ANTHROPIC_API_KEY=sk-...');
  process.exit(1);
}

const main = async () => {
  const rows: Row[] = [];
  for (const [name, files] of Object.entries(scenarios)) {
    const { content, chars } = await readFiles(files);
    const tokens = await countAnthropicTokens(content, apiKey, MODEL);
    rows.push({ name, files: files.length, chars, tokens });
  }
  printTable(`Anthropic ${MODEL}`, rows);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
