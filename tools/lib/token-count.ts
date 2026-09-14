import { encoding_for_model, type TiktokenModel } from 'tiktoken';

/**
 * 토큰 카운팅 단일 구현.
 * `tools/scripts/measure-tokens/*`와 `tools/evals/consumer`가 공유한다.
 */

export const DEFAULT_OPENAI_MODEL = 'gpt-4o';
export const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-4-6';

const ANTHROPIC_COUNT_TOKENS_URL = 'https://api.anthropic.com/v1/messages/count_tokens';

/** `MEASURE_OPENAI_MODEL` env override를 적용한 tiktoken 인코딩 대상 모델. */
export const openAIModelFromEnv = (): TiktokenModel =>
  (process.env.MEASURE_OPENAI_MODEL ?? DEFAULT_OPENAI_MODEL) as TiktokenModel;

/** `MEASURE_ANTHROPIC_MODEL` env override를 적용한 Anthropic 모델 ID. */
export const anthropicModelFromEnv = (): string =>
  process.env.MEASURE_ANTHROPIC_MODEL ?? DEFAULT_ANTHROPIC_MODEL;

/** tiktoken 로컬 인코더로 input 토큰 수를 센다. 네트워크·인증 불필요. */
export const countOpenAITokens = (
  content: string,
  model: TiktokenModel = openAIModelFromEnv(),
): number => {
  const enc = encoding_for_model(model);
  try {
    return enc.encode(content).length;
  } finally {
    enc.free();
  }
};

/**
 * Anthropic count_tokens REST API. SDK 미사용, fetch만.
 * 키가 없는 경우는 호출부에서 skip한다 — 여기서 0을 반환하지 않는다.
 */
export const countAnthropicTokens = async (
  content: string,
  apiKey: string,
  model: string = anthropicModelFromEnv(),
): Promise<number> => {
  const r = await fetch(ANTHROPIC_COUNT_TOKENS_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ model, messages: [{ role: 'user', content }] }),
  });
  if (!r.ok) throw new Error(`anthropic count_tokens ${r.status}: ${await r.text()}`);
  const data = (await r.json()) as { input_tokens: number };
  return data.input_tokens;
};
