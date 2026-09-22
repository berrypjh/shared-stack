import type { ConsumerJourney } from '../../domain/model';

/**
 * 소비자 평가. PR 마다 도는 결정적 smoke 와, executor 가 없어 trace replay 로만 채점하는 held-out.
 * 이 흐름은 평가를 돌리는 방법이다 — 평가 결과 값은 담지 않는다.
 */
export const consumerEval: ConsumerJourney = {
  id: 'eval-verification',
  title: '소비자 평가로 검증하기',
  goal: '같은 dataset · 같은 결정적 grader 로 소비자 작업을 채점해 공개 표면 · 카탈로그의 회귀를 PR 에서 잡는다',
  actor: 'maintainer',
  steps: [
    {
      id: 'pr',
      intent: 'PR 을 연다',
      behavior: 'pr-check 의 consumer-eval job 이 format · lint 뒤에 돈다',
      context: 'ci',
      owner: 'consumer-eval',
      status: 'implemented',
      source: [{ path: '.github/workflows/pr-check.yml', symbol: 'consumer-eval:' }],
      commands: [],
      tests: [],
      docs: ['consumer-eval-readme'],
      next: ['build'],
    },
    {
      id: 'build',
      intent: '라이브러리를 빌드한다',
      behavior:
        'build:libs 가 선언과 소비자 카탈로그를 만든다. dist 는 커밋되지 않아 CI 가 매번 만든다',
      context: 'ci',
      owner: 'consumer-eval',
      status: 'implemented',
      source: [
        {
          path: '.github/workflows/pr-check.yml',
          symbol: 'Build libs (declarations + generated catalog)',
        },
      ],
      commands: [],
      tests: [],
      docs: ['consumer-eval-readme'],
      next: ['check'],
    },
    {
      id: 'check',
      intent: 'harness 와 카탈로그 drift 를 검사한다',
      behavior:
        'tools:check 가 tools 의 타입과 테스트를 돌린다. 빌드가 쓴 카탈로그와 generator 재생성 결과가 같은지도 여기서 본다',
      context: 'ci',
      owner: 'consumer-eval',
      status: 'implemented',
      source: [{ path: '.github/workflows/pr-check.yml', symbol: 'pnpm run tools:check' }],
      commands: ['script:tools:check'],
      tests: ['tools-vitest'],
      docs: ['consumer-eval-readme'],
      next: ['smoke'],
    },
    {
      id: 'smoke',
      intent: '모델 호출 없이 평가 파이프라인을 돌린다',
      behavior: '내장 scripted agent 로 결정적 smoke 를 돌린다. 유료 호출이 없다',
      context: 'ci',
      owner: 'consumer-eval',
      status: 'implemented',
      source: [
        { path: 'tools/evals/consumer/runner/run.ts', symbol: 'SMOKE_TASK_IDS' },
        { path: 'tools/evals/consumer/ci/smoke-fixture.ts' },
      ],
      commands: ['script:eval:consumer:smoke'],
      tests: ['tools-vitest'],
      docs: ['consumer-eval-readme'],
      next: ['report'],
    },
    {
      id: 'report',
      intent: '리포트를 남긴다',
      behavior:
        'smoke 결과를 CI 아티팩트(consumer-eval-smoke)로 올린다. 파일이 없으면 job 이 실패한다',
      context: 'ci',
      owner: 'consumer-eval',
      status: 'implemented',
      source: [{ path: '.github/workflows/pr-check.yml', symbol: 'consumer-eval-smoke' }],
      commands: [],
      tests: [],
      docs: ['consumer-eval-readme'],
      next: [],
    },
    {
      id: 'held-out',
      intent: 'held-out split 을 채점한다',
      behavior:
        '수동 workflow 가 test split 을 돌린다. live executor 가 없어 수집된 trace 를 replay 할 때만 채점하고, 없으면 가짜 결과 대신 실패한다',
      context: 'ci',
      owner: 'consumer-eval',
      status: 'partial',
      source: [
        { path: '.github/workflows/consumer-eval-heldout.yml', symbol: 'workflow_dispatch' },
        { path: 'tools/evals/consumer/runner/run.ts', symbol: 'unavailableExecutor' },
      ],
      commands: ['script:eval:consumer:test'],
      tests: ['tools-vitest'],
      docs: ['consumer-eval-readme', 'consumer-eval-baseline-readme'],
      next: [],
      gaps: [
        {
          kind: 'unsupported',
          note: 'programmatic LLM executor 가 없다. replay 할 trace 가 없으면 채점하지 않는다',
          evidence: [{ path: 'tools/evals/consumer/README.md' }],
        },
      ],
    },
  ],
};
