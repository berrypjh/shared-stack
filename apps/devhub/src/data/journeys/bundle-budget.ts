import type { Journey } from '../../domain/model';

/** 번들 budget. import 패턴별 크기를 한도와 비교해 PR 에서 회귀를 막는다. */
export const bundleBudget: Journey = {
  id: 'bundle-budget',
  kind: 'measure',
  title: '번들 budget',
  goal: 'UI 패키지를 import 패턴별로 번들해 크기를 한도와 비교함. 한도를 넘으면 PR 이 실패하는 회귀 게이트',
  steps: [
    {
      id: 'build',
      intent: '라이브러리를 빌드함',
      behavior: 'build:libs 가 size-limit 이 읽을 dist/index.esm.js 를 만듦',
      context: 'workspace',
      owner: 'react-ui',
      status: 'implemented',
      commands: ['pnpm build:libs'],
      source: [{ path: 'package.json', symbol: 'build:libs' }],
      tests: [],
      docs: [],
      next: ['measure'],
    },
    {
      id: 'measure',
      intent: 'budget 을 잼',
      behavior:
        'size-limit 이 import 패턴마다 esbuild minify + brotli 크기를 재 한도와 비교. 한도는 현재값 위 약 5%',
      context: 'workspace',
      owner: 'react-ui',
      status: 'implemented',
      actor: '이 저장소의 개발자 · 에이전트',
      commands: ['pnpm size', 'pnpm size:why'],
      source: [
        { path: '.size-limit.cjs', symbol: 'reactUi(' },
        { path: '.size-limit.cjs', symbol: 'reactNativeUi(' },
        { path: 'package.json', symbol: '"size": "size-limit"' },
      ],
      tests: [],
      docs: [],
      next: ['collect'],
    },
    {
      id: 'pr',
      intent: 'PR 에서 한도를 지킴',
      behavior:
        'Bundle Size job 이 build:libs 뒤 size 를 돌려 한도를 넘으면 실패. 한도를 올린 이유는 커밋 메시지에',
      context: 'ci',
      owner: 'react-ui',
      status: 'implemented',
      source: [
        { path: '.github/workflows/pr-check.yml', symbol: 'Bundle Size (size-limit)' },
        { path: '.size-limit.cjs', symbol: '한도를 올린 이유는 커밋 메시지에 남긴다' },
      ],
      tests: [],
      docs: [],
      next: [],
    },
    {
      id: 'collect',
      intent: '평가 화면으로 가져옴',
      behavior: 'quality:core 가 size --json 을 돌려 budget 행을 저장하고 DevHub 로 내보냄',
      context: 'workspace',
      owner: 'observability-collectors',
      status: 'implemented',
      commands: ['pnpm quality:core'],
      source: [{ path: 'tools/scripts/observability/registry.ts', symbol: 'bundle.size-limit' }],
      tests: ['tools-vitest'],
      docs: ['observability-usage'],
      next: [],
      evaluation: 'bundle-budget',
    },
  ],
};
