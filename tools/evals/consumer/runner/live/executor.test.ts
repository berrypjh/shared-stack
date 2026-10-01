import { describe, expect, it } from 'vitest';

import type { Fetcher, MessagesResponse } from '../../../../lib/anthropic-messages';
import { loadDataset } from '../dataset';

import { createLiveExecutor, type LiveOptions } from './executor';

/** 응답을 차례로 돌려주는 가짜 API. 받은 주소 · 요청 본문을 남긴다. */
const fakeApi = (responses: unknown[]) => {
  const bodies: { tools: { name?: string; function?: { name: string } }[]; messages: unknown[] }[] =
    [];
  const urls: string[] = [];
  const fetcher: Fetcher = async (url, init) => {
    urls.push(url);
    bodies.push(JSON.parse(init.body as string));
    const next = responses.shift();
    if (!next) throw new Error('no more fake responses');
    return new Response(JSON.stringify(next), { status: 200 });
  };
  return { fetcher, bodies, urls };
};

const live = (fetcher: Fetcher, rest: Partial<LiveOptions> = {}) =>
  createLiveExecutor({
    provider: 'claude',
    model: 'test-model',
    apiKey: 'test-secret',
    baseUrl: 'https://api.example',
    fetcher,
    ...rest,
  });

const turn = (
  content: MessagesResponse['content'],
  input_tokens: number,
  output_tokens = 10,
): MessagesResponse => ({
  content,
  stop_reason: 'tool_use',
  usage: { input_tokens, output_tokens },
});

const use = (id: string, name: string, input: Record<string, unknown>) =>
  ({ type: 'tool_use', id, name, input }) as const;

const task = async () => {
  const tasks = await loadDataset('dev');
  const found = tasks.find((item) => item.taskId === 'web-button-loading');
  if (!found) throw new Error('fixture task missing');
  return found;
};

describe('live executor', () => {
  it('턴마다 API 가 보고한 입력 토큰을 더하고, 도구 결과로만 근거를 만든다', async () => {
    const { fetcher, bodies } = fakeApi([
      turn([use('a', 'get_symbol', { package: '@berrypjh/react-ui', symbol: 'Button' })], 1200),
      turn(
        [
          use('b', 'write_file', {
            path: 'src/App.tsx',
            content: 'export const App = () => null;',
          }),
          use('c', 'get_symbol', { package: '@berrypjh/react-ui', symbol: 'Button' }),
          use('d', 'finish', {
            platform: 'web',
            packages: ['@berrypjh/react-ui'],
            claimed_success: true,
          }),
        ],
        1500,
      ),
    ]);
    const executor = live(fetcher);
    const outcome = await executor.run({
      runId: 'r',
      split: 'dev',
      task: await task(),
      variant: 'progressive-retrieval',
      trial: 1,
    });

    expect(executor.name).toBe('live-claude');
    expect(bodies).toHaveLength(2);
    expect(outcome.inputTokens).toBe(2700);
    expect(outcome.outputTokens).toBe(20);
    expect(outcome.retrieved.slice(0, 2)).toEqual([
      'component:@berrypjh/react-ui#Button',
      'prop:@berrypjh/react-ui#Button.' + outcome.retrieved[1].split('.').pop(),
    ]);
    expect(outcome.toolCalls).toEqual([
      { capability: 'lookup-symbol', target: '@berrypjh/react-ui#Button', duplicate: false },
      { capability: 'lookup-symbol', target: '@berrypjh/react-ui#Button', duplicate: true },
    ]);
    expect(outcome.changedFiles).toEqual([
      { path: 'src/App.tsx', content: 'export const App = () => null;' },
    ]);
    expect(outcome).toMatchObject({
      selectedPlatform: 'web',
      selectedPackages: ['@berrypjh/react-ui'],
      claimedSuccess: true,
      verification: [],
    });
  });

  it('variant 가 허용하지 않은 도구는 주지 않고, 불러도 실행 · 기록하지 않는다', async () => {
    const { fetcher, bodies } = fakeApi([
      turn([use('a', 'get_symbol', { package: '@berrypjh/react-ui', symbol: 'Button' })], 900),
      turn([{ type: 'text', text: '끝' }], 950),
    ]);
    const outcome = await live(fetcher).run({
      runId: 'r',
      split: 'dev',
      task: await task(),
      variant: 'consumer-docs',
      trial: 1,
    });

    expect(bodies[0].tools.map((tool) => tool.name)).not.toContain('get_symbol');
    expect(outcome.toolCalls).toEqual([]);
    expect(outcome.retrieved).toEqual([]);
    expect(outcome).toMatchObject({ inputTokens: 1850, claimedSuccess: 'unknown' });
  });

  it('턴 상한에서 멈추고 끝내기를 보고하지 않았으면 성공 주장을 모른다고 둔다', async () => {
    const reads = Array.from({ length: 3 }, (_, index) =>
      turn([use(`r${index}`, 'read_file', { path: 'libs/react-ui/package.json' })], 100),
    );
    const { fetcher, bodies } = fakeApi(reads);
    const outcome = await live(fetcher, { maxTurns: 3 }).run({
      runId: 'r',
      split: 'dev',
      task: await task(),
      variant: 'consumer-docs',
      trial: 1,
    });

    expect(bodies).toHaveLength(3);
    expect(outcome.retrieved).toEqual(Array(3).fill('package:@berrypjh/react-ui'));
    expect(outcome.toolCalls.map((call) => call.duplicate)).toEqual([false, true, true]);
    expect(outcome).toMatchObject({ inputTokens: 300, claimedSuccess: 'unknown' });
  });
});

describe('live executor — 제공자', () => {
  it('OpenAI 형식은 function 도구 · tool 메시지 · prompt_tokens 로 같은 결과를 만든다', async () => {
    const { fetcher, bodies, urls } = fakeApi([
      {
        choices: [
          {
            message: {
              content: null,
              tool_calls: [
                {
                  id: 'a',
                  type: 'function',
                  function: {
                    name: 'get_symbol',
                    arguments: JSON.stringify({ package: '@berrypjh/react-ui', symbol: 'Button' }),
                  },
                },
              ],
            },
          },
        ],
        usage: { prompt_tokens: 2000, completion_tokens: 30 },
      },
      {
        choices: [
          {
            message: {
              content: null,
              tool_calls: [
                {
                  id: 'b',
                  type: 'function',
                  function: {
                    name: 'finish',
                    arguments: JSON.stringify({
                      platform: 'web',
                      packages: ['@berrypjh/react-ui'],
                      claimed_success: false,
                    }),
                  },
                },
              ],
            },
          },
        ],
        usage: { prompt_tokens: 2600, completion_tokens: 20 },
      },
    ]);
    const executor = live(fetcher, { provider: 'openai', baseUrl: 'https://openai.example' });
    const outcome = await executor.run({
      runId: 'r',
      split: 'dev',
      task: await task(),
      variant: 'progressive-retrieval',
      trial: 1,
    });

    expect(executor.name).toBe('live-openai');
    expect(urls).toEqual(Array(2).fill('https://openai.example/v1/chat/completions'));
    expect(bodies[0].tools.map((tool) => tool.function?.name)).toContain('get_symbol');
    expect(bodies[1].messages.at(-1)).toMatchObject({ role: 'tool', tool_call_id: 'a' });
    expect(outcome).toMatchObject({
      inputTokens: 4600,
      outputTokens: 50,
      selectedPlatform: 'web',
      claimedSuccess: false,
    });
    expect(outcome.retrieved[0]).toBe('component:@berrypjh/react-ui#Button');
  });

  it('로컬 서버가 입력을 잘랐으면(보고 입력이 추정보다 크게 작음) 결과를 만들지 않고 멈춘다', async () => {
    const { fetcher, urls } = fakeApi([turn([{ type: 'text', text: '끝' }], 2048)]);
    const executor = live(fetcher, { provider: 'local', baseUrl: 'http://localhost:11434' });
    await expect(
      executor.run({
        runId: 'r',
        split: 'dev',
        task: await task(),
        variant: 'progressive-retrieval',
        trial: 1,
      }),
    ).rejects.toThrow(/서버가 입력을 자른 것으로 보임/);
    expect(urls).toEqual(['http://localhost:11434/v1/messages']);
  });
});
