import type { Journey } from '../../domain/model';

import { collectStep } from './eval-collect';

/** 소비자 평가 중 executor 없이 도는 컨텍스트 실측. */
export const evalContext: Journey = {
  id: 'eval-context',
  kind: 'eval',
  title: '소비자 평가 · 컨텍스트',
  goal: 'variant 별로 에이전트가 처음 읽는 컨텍스트 토큰을 executor 없이 실측함',
  steps: [
    {
      id: 'run',
      intent: '컨텍스트 측정을 돌림',
      behavior: 'eval:consumer:context 가 task 를 실행하지 않고 variant 컨텍스트만 잼',
      context: 'workspace',
      owner: 'consumer-eval',
      status: 'implemented',
      actor: '이 저장소의 개발자 · 에이전트',
      commands: ['pnpm eval:consumer:context --json=tmp/llm-evals/offline/context.json'],
      options: [
        { flag: '--context-only', meaning: 'executor 없이 컨텍스트만 측정' },
        { flag: '--variants', meaning: '쉼표로 구분한 variant id (기본 전체)' },
        { flag: '--json', meaning: '결과를 JSON 으로 저장' },
      ],
      source: [
        { path: 'package.json', symbol: 'eval:consumer:context' },
        { path: 'tools/evals/consumer/runner/run.ts', symbol: '--context-only' },
      ],
      tests: ['tools-vitest'],
      docs: [],
      next: ['measure'],
    },
    {
      id: 'measure',
      intent: 'variant 컨텍스트를 잼',
      behavior: 'variant 가 읽히는 파일의 토큰을 세고, D2 이후는 플랫폼별로 따로 잼',
      context: 'workspace',
      owner: 'consumer-eval',
      status: 'implemented',
      source: [
        { path: 'tools/evals/consumer/runner/offline.ts', symbol: 'measureContexts' },
        { path: 'tools/evals/consumer/variants/context.ts', symbol: 'measureVariantContext' },
        { path: 'tools/evals/consumer/variants/index.ts', symbol: 'routedContextPaths' },
        { path: 'tools/lib/token-count.ts', symbol: 'countOpenAITokens' },
      ],
      tests: ['tools-vitest'],
      docs: [],
      next: ['collect'],
    },
    collectStep('context.json', 'tmp/llm-evals/offline'),
  ],
};
