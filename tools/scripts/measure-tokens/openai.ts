import { countOpenAITokens, openAIModelFromEnv } from '../../lib/token-count';

import { printTable, readFiles, type Row, scenarios } from './shared';

/**
 * OpenAI tiktoken (로컬 인코더)로 시나리오별 input 토큰 수를 측정한다.
 * 네트워크·인증 불필요.
 *
 * 사용:
 *   pnpm tokens:measure:openai
 *
 * 환경변수
 *   MEASURE_OPENAI_MODEL  (선택, 기본 'gpt-4o' — tiktoken 인코딩 매핑 대상)
 */

const MODEL = openAIModelFromEnv();

const main = async () => {
  const rows: Row[] = [];
  for (const [name, files] of Object.entries(scenarios)) {
    const { content, chars } = await readFiles(files);
    const tokens = countOpenAITokens(content, MODEL);
    rows.push({ name, files: files.length, chars, tokens });
  }
  printTable(`OpenAI ${MODEL} (tiktoken local)`, rows);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
