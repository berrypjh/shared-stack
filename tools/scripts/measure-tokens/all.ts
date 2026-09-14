import {
  anthropicModelFromEnv,
  countAnthropicTokens,
  countOpenAITokens,
  openAIModelFromEnv,
} from '../../lib/token-count';

import { delta, fmt, readFiles, scenarios } from './shared';

/**
 * Anthropic count_tokens API + OpenAI tiktoken을 같은 시나리오에 동시 적용해
 * 한 표에서 두 provider를 비교한다.
 *
 * OpenAI 측은 항상 측정. Anthropic 측은 `ANTHROPIC_API_KEY`가 있을 때만 측정 (없으면 — 표시).
 *
 * 사용:
 *   pnpm tokens:measure                # OpenAI만
 *   ANTHROPIC_API_KEY=sk-... pnpm tokens:measure   # 둘 다
 *
 * 환경변수
 *   ANTHROPIC_API_KEY        (선택 — 없으면 Anthropic 칸은 — 표시)
 *   MEASURE_ANTHROPIC_MODEL  (선택, 기본 'claude-sonnet-4-6')
 *   MEASURE_OPENAI_MODEL     (선택, 기본 'gpt-4o')
 */

const ANTHROPIC_MODEL = anthropicModelFromEnv();
const OPENAI_MODEL = openAIModelFromEnv();

const apiKey = process.env.ANTHROPIC_API_KEY;

type Row = {
  name: string;
  files: number;
  chars: number;
  anthropic: number | null;
  openai: number;
};

const main = async () => {
  console.log(`anthropic: ${apiKey ? ANTHROPIC_MODEL : '(skipped — set ANTHROPIC_API_KEY)'}`);
  console.log(`openai:    ${OPENAI_MODEL} (tiktoken local)\n`);

  const rows: Row[] = [];
  for (const [name, files] of Object.entries(scenarios)) {
    const { content, chars } = await readFiles(files);
    const openai = countOpenAITokens(content, OPENAI_MODEL);
    const anthropic = apiKey ? await countAnthropicTokens(content, apiKey, ANTHROPIC_MODEL) : null;
    rows.push({ name, files: files.length, chars, anthropic, openai });
  }

  const base = rows[0];
  const nameW = Math.max(8, ...rows.map((r) => r.name.length));
  const cols = [
    'scenario'.padEnd(nameW),
    'files'.padStart(5),
    'chars'.padStart(9),
    'anthropic'.padStart(10),
    'Δ ant'.padStart(7),
    'openai'.padStart(9),
    'Δ oai'.padStart(7),
  ];
  console.log(cols.join('  '));
  console.log('-'.repeat(cols.join('  ').length));
  for (const r of rows) {
    const isBase = r === base;
    console.log(
      [
        r.name.padEnd(nameW),
        String(r.files).padStart(5),
        fmt(r.chars).padStart(9),
        (r.anthropic == null ? '—' : fmt(r.anthropic)).padStart(10),
        (isBase || r.anthropic == null || base.anthropic == null
          ? '—'
          : delta(r.anthropic, base.anthropic)
        ).padStart(7),
        fmt(r.openai).padStart(9),
        (isBase ? '—' : delta(r.openai, base.openai)).padStart(7),
      ].join('  '),
    );
  }
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
