import fs from 'node:fs/promises';
import path from 'node:path';

import { loadCatalogs, loadTokenSource, resolvePlatform } from '../../../../consumer-retrieval';
import type { Fetcher } from '../../../../lib/anthropic-messages';
import { countOpenAITokens } from '../../../../lib/token-count';
import { readContextFiles } from '../../variants/context';
import { type Variant, type VariantId, VARIANTS } from '../../variants/index';
import type { EvalExecutor, ExecutorOutcome, ExecutorRequest } from '../executor';
import {
  FIXTURE_DIR,
  type FixtureContext,
  loadFixtureContext,
  toPlatformInput,
} from '../fixture-context';
import { fromRepoRoot } from '../paths';
import type { ChangedFile, ConsumerEvalTask, ToolCall } from '../schema';

import { startConversation, type ToolReply } from './conversation';
import { liveExecutorName, type ProviderId, PROVIDERS } from './providers';
import { type Finish, runTool, type ToolDeps, toolsFor } from './tools';

/**
 * 모델 API 로 도구를 쓰며 과제를 푸는 executor. 제공자(Claude · OpenAI · 로컬)는 `providers.ts` 가
 * 정하고, 대화 형식 차이는 `conversation.ts` 가 숨긴다. 첫 메시지는 variant 의 초기 컨텍스트(routing
 * variant 는 판정된 플랫폼의 자료)와 프로젝트 파일 · 과제이고, 이후 모델이 도구를 부른다.
 * `inputTokens` 는 매 턴 API 가 보고한 입력 토큰의 합이다 — 턴마다 대화 전체를 다시 보내므로 실제로
 * 모델에 들어간 양이다.
 */

export const DEFAULT_MAX_TURNS = 12;
/** 첫 턴 보고 입력이 tiktoken 추정의 이 비율보다 작으면 서버가 잘랐다고 본다 (tokenizer 차이를 감안). */
const TRUNCATION_RATIO = 0.7;
const MAX_OUTPUT_TOKENS = 8192;

const SYSTEM = [
  '너는 @berrypjh UI 패키지를 쓰는 앱 개발자다. 과제를 프로젝트 코드로 해결한다.',
  '처음 받은 자료로 부족하면 도구로 찾아본다. 코드는 write_file 로 프로젝트 파일에 쓴다.',
  '패키지는 공개 진입점으로만 import 한다. 끝나면 반드시 finish 로 고른 플랫폼 · 쓴 패키지 · 해냈는지를 보고한다.',
].join('\n');

/** routing variant 는 결정적 resolver 가 고른 플랫폼의 자료만, 고르지 못하면 합집합을 준다. */
const contextSpecs = (variant: Variant, prompt: string, fixture: FixtureContext): string[] => {
  if (!variant.routedContextPaths) return variant.contextPaths;
  const { canonical } = resolvePlatform(toPlatformInput(prompt, fixture));
  return canonical === 'web' || canonical === 'react-native'
    ? variant.routedContextPaths[canonical]
    : variant.contextPaths;
};

const projectSection = async (fixture: FixtureContext) => {
  const files = await Promise.all(
    fixture.projectFiles.map(async (file) => {
      const text = await fs.readFile(path.join(FIXTURE_DIR, fixture.fixture, file), 'utf8');
      return `=== ${file} ===\n${text}`;
    }),
  );
  return files.join('\n\n');
};

/**
 * 첫 메시지. 사전 점검(컨텍스트 한도)과 실행이 같은 내용을 쓴다. 선언된 자료가 없으면 null 과 없는
 * 경로다 — 부분 자료로 실행하지 않는다.
 */
export const firstMessage = async (
  variant: Variant,
  task: ConsumerEvalTask,
): Promise<{ text: string | null; missingPaths: string[] }> => {
  const fixture = await loadFixtureContext(task.fixture);
  const context = await readContextFiles(contextSpecs(variant, task.prompt, fixture));
  if (context.content === null) return { text: null, missingPaths: context.missingPaths };
  const text = [
    `## 받은 자료\n${context.content}`,
    `## 프로젝트 파일\n${await projectSection(fixture)}`,
    `## 과제\n${task.prompt}`,
  ].join('\n\n');
  return { text, missingPaths: [] };
};

export const LIVE_SYSTEM = SYSTEM;

export type LiveOptions = {
  provider: ProviderId;
  model: string;
  apiKey: string | null;
  baseUrl: string;
  maxTurns?: number;
  fetcher?: Fetcher;
  /** 테스트가 저장소 파일 · 카탈로그 대신 넣는다. */
  loadDeps?: () => Promise<Pick<ToolDeps, 'catalogs' | 'tokens' | 'readRepoFile'>>;
};

const repoDeps = async () => ({
  catalogs: await loadCatalogs(),
  tokens: await loadTokenSource(),
  readRepoFile: (file: string) => fs.readFile(fromRepoRoot(file), 'utf8').catch(() => null),
});

export const createLiveExecutor = ({
  provider,
  model,
  apiKey,
  baseUrl,
  maxTurns = DEFAULT_MAX_TURNS,
  fetcher,
  loadDeps = repoDeps,
}: LiveOptions): EvalExecutor => {
  let shared: Awaited<ReturnType<typeof loadDeps>> | null = null;
  const { protocol, silentTruncation } = PROVIDERS[provider];

  const run = async ({ task, variant: variantId }: ExecutorRequest): Promise<ExecutorOutcome> => {
    const variant = VARIANTS[variantId as VariantId];
    if (!variant) throw new Error(`unknown eval variant ${variantId}`);
    const first = await firstMessage(variant, task);
    if (first.text === null) {
      throw new Error(`${variantId}: 없는 자료 ${first.missingPaths.join(', ')}`);
    }
    shared ??= await loadDeps();
    const deps: ToolDeps = {
      ...shared,
      variant,
      prompt: task.prompt,
      fixture: await loadFixtureContext(task.fixture),
    };
    const conversation = startConversation(
      protocol,
      {
        model,
        system: SYSTEM,
        tools: toolsFor(variant),
        first: first.text,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
      },
      { apiKey, baseUrl, fetcher },
    );
    const started = Date.now();
    const retrieved: string[] = [];
    const toolCalls: ToolCall[] = [];
    const seen = new Set<string>();
    const writes = new Map<string, ChangedFile>();
    let inputTokens = 0;
    let outputTokens = 0;
    let finish: Finish | null = null;
    let replies: ToolReply[] = [];

    for (let turn = 0; turn < maxTurns && !finish; turn += 1) {
      const result = await conversation.next(replies);
      if (turn === 0 && silentTruncation) {
        const expected = countOpenAITokens(`${SYSTEM}\n\n${first.text}`);
        if (result.inputTokens < expected * TRUNCATION_RATIO) {
          throw new Error(
            `${variantId}/${task.taskId}: 서버가 입력을 자른 것으로 보임 — 보고 ${result.inputTokens} 토큰 < 추정 ${expected} 토큰. ` +
              '서버 컨텍스트 길이(예: OLLAMA_CONTEXT_LENGTH)를 --context-limit 이상으로 늘려야 한다',
          );
        }
      }
      inputTokens += result.inputTokens;
      outputTokens += result.outputTokens;
      if (result.uses.length === 0) break;

      replies = [];
      for (const use of result.uses) {
        const outcome = await runTool(use.name, use.input, deps);
        if (outcome.call) {
          const key = `${outcome.call.capability}:${outcome.call.target ?? ''}`;
          toolCalls.push({ ...outcome.call, duplicate: seen.has(key) });
          seen.add(key);
        }
        retrieved.push(...outcome.evidence);
        if (outcome.write) writes.set(outcome.write.path, outcome.write);
        finish ??= outcome.finish;
        replies.push({ id: use.id, content: outcome.text, isError: outcome.isError });
      }
    }

    return {
      selectedPlatform: finish?.platform ?? null,
      selectedPackages: finish?.packages ?? null,
      retrieved,
      toolCalls,
      changedFiles: [...writes.values()],
      inputTokens,
      outputTokens,
      retrievedTokens: null,
      retrievedFiles: null,
      retrievedChunks: null,
      latencyMs: Date.now() - started,
      claimedSuccess: finish?.claimedSuccess ?? 'unknown',
      verification: [],
      repairAttempts: 0,
      repairTokens: null,
      repairSucceeded: null,
      repeatedFailures: null,
    };
  };

  return { name: liveExecutorName(provider), model, run };
};
