import type { Journey } from '../../domain/model';

import { collectStep } from './eval-collect';

/** 소비자 평가 중 executor 없이 도는 플랫폼 routing 측정. */
export const evalRouting: Journey = {
  id: 'eval-routing',
  kind: 'eval',
  title: '소비자 평가 · 라우팅',
  goal: 'task 마다 플랫폼 판정이 gold 와 맞는지 confusion matrix 로 봄. executor 없이 결정적',
  steps: [
    {
      id: 'run',
      intent: '라우팅 측정을 돌림',
      behavior: 'eval:consumer:routing 이 task 를 실행하지 않고 플랫폼 판정만 채점',
      context: 'workspace',
      owner: 'consumer-eval',
      status: 'implemented',
      actor: '이 저장소의 개발자 · 에이전트',
      commands: [
        'pnpm eval:consumer:routing --split=test --json=tmp/llm-evals/offline/routing.json',
      ],
      options: [
        { flag: '--routing-only', meaning: 'executor 없이 routing confusion matrix 만 계산' },
        { flag: '--split', meaning: 'dev · test (기본 dev)' },
        { flag: '--json', meaning: '결과를 JSON 으로 저장' },
      ],
      source: [
        { path: 'package.json', symbol: 'eval:consumer:routing' },
        { path: 'tools/evals/consumer/runner/run.ts', symbol: "args['routing-only']" },
      ],
      tests: ['tools-vitest'],
      docs: [],
      next: ['decide'],
    },
    {
      id: 'decide',
      intent: 'task 마다 플랫폼을 판정함',
      behavior: 'gold 가 아니라 fixture 의 dependencies · 파일 목록만 보고 판정',
      context: 'workspace',
      owner: 'consumer-eval',
      status: 'implemented',
      source: [
        { path: 'tools/evals/consumer/runner/offline.ts', symbol: 'decideRouting' },
        { path: 'tools/evals/consumer/runner/fixture-context.ts', symbol: 'loadFixtureContext' },
        { path: 'tools/consumer-retrieval/platform.ts', symbol: 'resolvePlatform' },
      ],
      tests: ['tools-vitest'],
      docs: [],
      next: ['matrix'],
    },
    {
      id: 'matrix',
      intent: 'confusion matrix 를 만듦',
      behavior: 'gold 와 판정을 짝지어 web · react-native · none · both · unreported 로 셈',
      context: 'workspace',
      owner: 'consumer-eval',
      status: 'implemented',
      source: [{ path: 'tools/evals/consumer/reporters/confusion.ts', symbol: 'buildConfusion' }],
      tests: ['tools-vitest'],
      docs: [],
      next: ['collect'],
    },
    collectStep('routing.json', 'tmp/llm-evals/offline'),
  ],
};
