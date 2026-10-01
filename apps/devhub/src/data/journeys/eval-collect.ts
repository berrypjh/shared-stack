import type { JourneyStep } from '../../domain/model';

/** 평가 산출물을 평가 화면으로 가져오는 마지막 단계. 소비자 평가 흐름들이 같이 쓴다. */
export const collectStep = (files: string, from: string): JourneyStep => ({
  id: 'collect',
  intent: '평가 화면으로 가져옴',
  behavior: `quality:collect 가 ${files} 을 검증해 저장하고 quality:export 가 DevHub 로 내보냄`,
  context: 'workspace',
  owner: 'observability-collectors',
  status: 'implemented',
  commands: [
    `pnpm quality:collect --profile=eval --from=${from} --run-id=<id>`,
    'pnpm quality:export --run-id=<id>',
  ],
  source: [
    { path: 'package.json', symbol: 'quality:collect' },
    { path: 'tools/scripts/observability/collectors/eval.ts', symbol: 'EVALS_DIR' },
    { path: 'tools/scripts/observability/export.ts', symbol: 'PUBLIC_ROOT' },
  ],
  tests: ['tools-vitest'],
  docs: ['observability-usage'],
  next: [],
  evaluation: 'eval-scorecard',
});
