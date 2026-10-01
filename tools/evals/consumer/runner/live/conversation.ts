import {
  type AnthropicTool,
  createMessage,
  type Fetcher,
  inputTokensOf,
  type MessageParam,
} from '../../../../lib/anthropic-messages';
import { type ChatMessage, createChatCompletion } from '../../../../lib/openai-chat';

/**
 * 도구 루프 한 판의 대화. API 형식(Anthropic Messages · OpenAI Chat Completions)이 달라도 executor 는
 * "도구 결과를 보내고, 다음 도구 호출과 그 턴의 사용량을 받는다" 만 안다. 대화 기록은 여기서 쌓는다.
 */

export type ToolUse = { id: string; name: string; input: Record<string, unknown> };
export type ToolReply = { id: string; content: string; isError: boolean };
/** 한 턴. 사용량은 API 가 보고한 그 요청의 입력 · 출력 토큰이다. */
export type Turn = { uses: ToolUse[]; inputTokens: number; outputTokens: number };
export type Conversation = { next: (replies: ToolReply[]) => Promise<Turn> };

export type ConversationInput = {
  model: string;
  system: string;
  tools: AnthropicTool[];
  first: string;
  maxOutputTokens: number;
};

export type Endpoint = { apiKey: string | null; baseUrl: string; fetcher?: Fetcher };

export type Protocol = 'anthropic-messages' | 'openai-chat';

const anthropicConversation = (
  { model, system, tools, first, maxOutputTokens }: ConversationInput,
  endpoint: Endpoint,
): Conversation => {
  const messages: MessageParam[] = [{ role: 'user', content: first }];
  return {
    next: async (replies) => {
      if (replies.length > 0) {
        messages.push({
          role: 'user',
          content: replies.map((reply) => ({
            type: 'tool_result',
            tool_use_id: reply.id,
            content: reply.content,
            ...(reply.isError ? { is_error: true } : {}),
          })),
        });
      }
      const response = await createMessage(
        { model, max_tokens: maxOutputTokens, system, tools, messages },
        endpoint,
      );
      messages.push({ role: 'assistant', content: response.content });
      return {
        uses: response.content.flatMap((block) =>
          block.type === 'tool_use' ? [{ id: block.id, name: block.name, input: block.input }] : [],
        ),
        inputTokens: inputTokensOf(response.usage),
        outputTokens: response.usage.output_tokens,
      };
    },
  };
};

/** 도구 인자는 JSON 글이다. 깨졌으면 빈 인자로 넘겨 도구가 거부하게 한다. */
const parseArguments = (text: string): Record<string, unknown> => {
  try {
    const value: unknown = JSON.parse(text);
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  } catch {
    return {};
  }
};

const openaiConversation = (
  { model, system, tools, first, maxOutputTokens }: ConversationInput,
  endpoint: Endpoint,
): Conversation => {
  const messages: ChatMessage[] = [
    { role: 'system', content: system },
    { role: 'user', content: first },
  ];
  const functions = tools.map((tool) => ({
    type: 'function' as const,
    function: { name: tool.name, description: tool.description, parameters: tool.input_schema },
  }));
  return {
    next: async (replies) => {
      for (const reply of replies) {
        messages.push({ role: 'tool', tool_call_id: reply.id, content: reply.content });
      }
      const response = await createChatCompletion(
        { model, max_completion_tokens: maxOutputTokens, messages, tools: functions },
        endpoint,
      );
      const message = response.choices[0]?.message ?? { content: null };
      messages.push({ role: 'assistant', ...message });
      return {
        uses: (message.tool_calls ?? []).map((call) => ({
          id: call.id,
          name: call.function.name,
          input: parseArguments(call.function.arguments),
        })),
        inputTokens: response.usage.prompt_tokens,
        outputTokens: response.usage.completion_tokens,
      };
    },
  };
};

export const startConversation = (
  protocol: Protocol,
  input: ConversationInput,
  endpoint: Endpoint,
): Conversation =>
  protocol === 'anthropic-messages'
    ? anthropicConversation(input, endpoint)
    : openaiConversation(input, endpoint);
