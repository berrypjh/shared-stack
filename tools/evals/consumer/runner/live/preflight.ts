import { countAnthropicTokens, countOpenAITokens } from '../../../../lib/token-count';
import { type VariantId, VARIANTS } from '../../variants/index';
import type { ConsumerEvalTask } from '../schema';

import { firstMessage, LIVE_SYSTEM } from './executor';

export type SkippedVariant = { variant: string; reason: string };

/** 평가 산출물 폴더에 남기는, 실행하지 않은 variant 와 이유. 수집기가 읽는다. */
export const LIVE_SKIPPED_FILE = 'live-skipped.json';

/**
 * 실행 전에 variant 마다 첫 메시지를 세어(Claude 는 count_tokens 로 정확히, 그 밖은 tiktoken 추정),
 * 한도를 넘거나 자료가 없는 variant 를 뺀다. 빠진 variant 는 0 이나 잘라 낸 값이 아니라 이유로 남는다.
 */
export const preflight = async ({
  variantIds,
  tasks,
  limit,
  count,
  estimated = false,
}: {
  variantIds: string[];
  tasks: ConsumerEvalTask[];
  limit: number;
  /** 내용 하나의 입력 토큰 수. 기본은 Anthropic count_tokens 다. */
  count: (content: string) => Promise<number>;
  /** 센 값이 추정이면 이유 글에 그렇게 적는다. */
  estimated?: boolean;
}): Promise<{ runnable: string[]; skipped: SkippedVariant[] }> => {
  const runnable: string[] = [];
  const skipped: SkippedVariant[] = [];
  for (const id of variantIds) {
    const variant = VARIANTS[id as VariantId];
    let reason: string | null = null;
    for (const task of tasks) {
      const first = await firstMessage(variant, task);
      if (first.text === null) {
        reason = `없는 자료: ${first.missingPaths.join(', ')}`;
        break;
      }
      const tokens = await count(`${LIVE_SYSTEM}\n\n${first.text}`);
      if (tokens > limit) {
        reason = `컨텍스트 한도 초과 — 첫 메시지 ${estimated ? '약 ' : ''}${tokens.toLocaleString('en-US')} 토큰${estimated ? '(추정)' : ''} > 한도 ${limit.toLocaleString('en-US')} (${task.taskId})`;
        break;
      }
    }
    if (reason) skipped.push({ variant: id, reason });
    else runnable.push(id);
  }
  return { runnable, skipped };
};

export const anthropicCounter = (apiKey: string, model: string) => (content: string) =>
  countAnthropicTokens(content, apiKey, model);

/** 모델의 tokenizer 를 모를 때의 어림값. tiktoken 으로 센다. */
export const estimateCounter = async (content: string) => countOpenAITokens(content);
