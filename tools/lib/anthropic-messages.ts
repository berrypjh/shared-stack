/**
 * Anthropic Messages API 호출. SDK 미사용, fetch 만 — `token-count.ts` 의 count_tokens 와 같은 방식이다.
 * 같은 형식을 받는 로컬 서버(Ollama 의 `/v1/messages`)도 `baseUrl` 만 바꿔 부른다.
 * 키는 호출부가 환경변수에서 받아 넘기고, 여기서는 저장하지 않는다.
 */

export const ANTHROPIC_BASE_URL = 'https://api.anthropic.com';
const ANTHROPIC_VERSION = '2023-06-01';

export type AnthropicTool = {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
};

export type TextBlock = { type: 'text'; text: string };
export type ToolUseBlock = {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
};
export type ToolResultBlock = {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
};

export type MessageParam =
  | { role: 'user'; content: string | ToolResultBlock[] }
  | { role: 'assistant'; content: (TextBlock | ToolUseBlock)[] };

export type MessagesRequest = {
  model: string;
  max_tokens: number;
  system: string;
  tools: AnthropicTool[];
  messages: MessageParam[];
};

/** API 가 보고한 사용량. 캐시 칸은 캐시를 쓰지 않으면 없거나 0 이다. */
export type Usage = {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
};

export type MessagesResponse = {
  content: (TextBlock | ToolUseBlock)[];
  stop_reason: string | null;
  usage: Usage;
};

/** 테스트가 바꿔 끼우는 경계. 기본은 전역 fetch 다. */
export type Fetcher = (url: string, init: RequestInit) => Promise<Response>;

/** 한 번의 요청이 모델에 보낸 입력 토큰 — 캐시로 읽고 쓴 입력도 입력이다. */
export const inputTokensOf = (usage: Usage) =>
  usage.input_tokens +
  (usage.cache_creation_input_tokens ?? 0) +
  (usage.cache_read_input_tokens ?? 0);

export const createMessage = async (
  request: MessagesRequest,
  {
    apiKey,
    baseUrl = ANTHROPIC_BASE_URL,
    fetcher = fetch,
  }: { apiKey: string | null; baseUrl?: string; fetcher?: Fetcher },
): Promise<MessagesResponse> => {
  const response = await fetcher(`${baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      ...(apiKey ? { 'x-api-key': apiKey } : {}),
      'anthropic-version': ANTHROPIC_VERSION,
      'content-type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error(`anthropic messages ${response.status}: ${await response.text()}`);
  }
  return (await response.json()) as MessagesResponse;
};
