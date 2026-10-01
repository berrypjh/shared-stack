/**
 * OpenAI Chat Completions API 호출. SDK 미사용, fetch 만. 같은 형식을 받는 서버도 `baseUrl` 만 바꿔
 * 부른다. 키는 호출부가 환경변수에서 받아 넘기고, 여기서는 저장하지 않는다.
 */

import type { Fetcher } from './anthropic-messages';

export const OPENAI_BASE_URL = 'https://api.openai.com';

export type ChatTool = {
  type: 'function';
  function: { name: string; description: string; parameters: Record<string, unknown> };
};

export type ChatToolCall = {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
};

export type ChatMessage =
  | { role: 'system' | 'user'; content: string }
  | { role: 'assistant'; content: string | null; tool_calls?: ChatToolCall[] }
  | { role: 'tool'; tool_call_id: string; content: string };

export type ChatRequest = {
  model: string;
  max_completion_tokens: number;
  messages: ChatMessage[];
  tools: ChatTool[];
};

/** API 가 보고한 사용량. `prompt_tokens` 는 캐시로 읽은 입력까지 포함한 입력 전체다. */
export type ChatUsage = { prompt_tokens: number; completion_tokens: number };

export type ChatResponse = {
  choices: { message: { content: string | null; tool_calls?: ChatToolCall[] } }[];
  usage: ChatUsage;
};

export const createChatCompletion = async (
  request: ChatRequest,
  {
    apiKey,
    baseUrl = OPENAI_BASE_URL,
    fetcher = fetch,
  }: { apiKey: string | null; baseUrl?: string; fetcher?: Fetcher },
): Promise<ChatResponse> => {
  const response = await fetcher(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
      'content-type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error(`openai chat completions ${response.status}: ${await response.text()}`);
  }
  return (await response.json()) as ChatResponse;
};
