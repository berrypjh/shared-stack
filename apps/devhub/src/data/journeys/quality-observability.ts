import type { ConsumerJourney } from '../../domain/model';

/** 품질 수집 → export → quality-lab 표시. 흐름만 담는다 — 수집된 값은 quality-lab 이 보여 준다. */
export const qualityObservability: ConsumerJourney = {
  id: 'quality-observability',
  title: '품질 수집 결과 → quality-lab',
  goal: 'Node 수집기가 만든 산출물을 계약으로 검증한 뒤에만 quality-lab 이 보여 준다. 브라우저는 명령을 실행하지 않는다',
  actor: 'maintainer',
  steps: [
    {
      id: 'collect',
      intent: '품질 결과를 수집한다',
      behavior:
        'quality:collect 가 계약 lib 을 먼저 빌드하고 profile 별 수집 결과를 tmp/quality-lab 에 쓴다',
      context: 'workspace',
      owner: 'observability-collectors',
      status: 'implemented',
      source: [
        { path: 'package.json', symbol: 'quality:collect' },
        { path: 'tools/scripts/observability/cli.ts' },
        { path: 'tools/scripts/observability/store.ts', symbol: 'tmp/quality-lab' },
      ],
      commands: ['script:quality:collect'],
      tests: ['tools-vitest'],
      docs: ['quality-lab-collectors'],
      next: ['export'],
    },
    {
      id: 'export',
      intent: '앱이 읽을 JSON 으로 내보낸다',
      behavior: 'quality:export 가 run 과 요약을 quality-lab 의 public/observability 에 쓴다',
      context: 'workspace',
      owner: 'observability-collectors',
      status: 'implemented',
      source: [{ path: 'tools/scripts/observability/export.ts', symbol: 'PUBLIC_ROOT' }],
      commands: ['script:quality:export'],
      tests: ['tools-vitest'],
      docs: ['quality-lab-architecture'],
      next: ['load'],
    },
    {
      id: 'load',
      intent: '앱이 결과를 불러온다',
      behavior:
        '필요한 파일만 받아 observability-contracts 의 schema 로 검증한 뒤에만 쓴다. 검증에 실패하면 보여 주지 않는다',
      context: 'browser',
      owner: 'quality-lab',
      status: 'implemented',
      source: [{ path: 'apps/quality-lab/src/app/data/client.ts', symbol: 'safeParse' }],
      commands: ['script:quality:lab'],
      tests: ['quality-lab-vitest'],
      docs: ['quality-lab-architecture', 'quality-lab-agents'],
      next: ['show'],
    },
    {
      id: 'show',
      intent: '결과와 상태를 본다',
      behavior:
        '값이 없으면 숫자를 만들지 않고 상태 이름과 이유를 보여 준다. 실제 브라우저 흐름은 e2e 가 확인한다',
      context: 'browser',
      owner: 'quality-lab',
      status: 'implemented',
      source: [{ path: 'apps/quality-lab/src/app/data/status.ts' }],
      commands: ['quality-lab-e2e:e2e'],
      tests: ['quality-lab-vitest', 'quality-lab-e2e-playwright'],
      docs: ['quality-lab-agents'],
      next: [],
    },
  ],
};
