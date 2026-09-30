import type { Journey } from '../../domain/model';

import { collectStep } from './eval-collect';

/**
 * 소비자 평가의 종합. dev · test split 을 끝까지 돌려 네 축을 한 번에 재고 평가 화면으로 넘긴다.
 * 이 흐름은 평가를 돌리는 방법이다 — 평가 결과 값은 담지 않는다.
 */
export const evalRun: Journey = {
  id: 'eval-run',
  kind: 'eval',
  title: '소비자 평가 · 종합',
  goal: 'Correctness · Routing · Context Efficiency · Verification 네 축을 한 번에 재는 전체 실행. 컨텍스트 감소만으로는 성공이 아니고 Correctness >= Baseline 이 우선',
  steps: [
    {
      id: 'local',
      intent: 'dev · test split 을 돌림',
      behavior: 'eval:consumer:dev · test 가 수집한 trace 를 --replay 로 다시 채점',
      context: 'workspace',
      owner: 'consumer-eval',
      status: 'implemented',
      actor: '이 저장소의 개발자 · 에이전트',
      commands: [
        'pnpm eval:consumer:dev --replay=tmp/llm-evals/<run>/traces.jsonl --trials=3',
        'pnpm eval:consumer:test --replay=<traces.jsonl> --compare-baseline',
      ],
      options: [
        { flag: '--split', meaning: 'dev · test (기본 dev)' },
        { flag: '--variants', meaning: '쉼표로 구분한 variant id (기본 전체)' },
        { flag: '--tasks', meaning: '쉼표로 구분한 taskId 만 실행' },
        { flag: '--trials', meaning: 'task 당 시행 횟수 (기본 1)' },
        { flag: '--k', meaning: 'evidence recall@K 의 K (기본 5)' },
        { flag: '--replay', meaning: '수집한 traces.jsonl 을 다시 채점' },
        { flag: '--out · --run-id', meaning: '산출물 위치 (기본 tmp/llm-evals/<split>-<시각>)' },
        { flag: '--compare-baseline', meaning: 'baseline 스냅샷과 비교' },
        { flag: '--write-baseline', meaning: '이번 실행 결과를 baseline 으로 저장' },
      ],
      source: [
        { path: 'package.json', symbol: 'eval:consumer:dev' },
        { path: 'tools/evals/consumer/runner/run.ts', symbol: 'createReplayExecutor' },
      ],
      tests: ['tools-vitest'],
      docs: [],
      next: ['dataset'],
    },
    {
      id: 'held-out',
      intent: 'held-out split 을 수동으로 돌림',
      behavior: '수동 workflow 가 고른 split 을 돌려 baseline 과 비교',
      context: 'ci',
      owner: 'consumer-eval',
      status: 'implemented',
      source: [
        { path: '.github/workflows/consumer-eval-heldout.yml', symbol: 'workflow_dispatch' },
        { path: '.github/workflows/consumer-eval-heldout.yml', symbol: '--compare-baseline' },
      ],
      tests: [],
      docs: [],
      next: ['dataset'],
    },
    {
      id: 'dataset',
      intent: '평가 task 를 고름',
      behavior: 'dev · test split 에서 task 를 읽음. task 는 최소 consumer fixture 를 가리킴',
      context: 'workspace',
      owner: 'consumer-eval',
      status: 'implemented',
      source: [
        { path: 'tools/evals/consumer/runner/dataset.ts', symbol: 'loadDataset' },
        { path: 'tools/evals/consumer/datasets/dev.jsonl' },
        { path: 'tools/evals/consumer/datasets/test.jsonl' },
        { path: 'tools/evals/consumer/fixtures', directory: true },
        { path: 'tools/evals/consumer/runner/fixture-context.ts', symbol: 'loadFixtureContext' },
        { path: 'tools/scripts/generate-consumer-catalog/schema.ts', symbol: 'evidenceIdsOf' },
      ],
      tests: ['tools-vitest'],
      docs: [],
      next: ['variant'],
    },
    {
      id: 'variant',
      intent: '에이전트에게 읽힐 컨텍스트를 고름',
      behavior: 'A · B · C 에서 D1~D5 로 컨텍스트를 한 번에 하나씩 더함',
      context: 'workspace',
      owner: 'consumer-eval',
      status: 'implemented',
      source: [
        { path: 'tools/evals/consumer/variants/index.ts', symbol: 'routedContextPaths' },
        { path: 'tools/evals/consumer/ci/compare.ts', symbol: 'ABLATION_PAIRS' },
      ],
      tests: ['tools-vitest'],
      docs: [],
      next: ['execute'],
    },
    {
      id: 'execute',
      intent: 'task 를 실행해 trace 를 남김',
      behavior: 'live executor 가 없어 --replay 로 넘긴 trace 만 채점. 가짜 결과를 만들지 않음',
      context: 'workspace',
      owner: 'consumer-eval',
      status: 'partial',
      source: [
        { path: 'tools/evals/consumer/runner/executor.ts', symbol: 'unavailableExecutor' },
        { path: 'tools/evals/consumer/runner/executor.ts', symbol: 'createReplayExecutor' },
      ],
      tests: ['tools-vitest'],
      docs: [],
      next: ['verify'],
      gaps: [
        {
          kind: 'unsupported',
          note: 'live executor 가 없음. 새 provider SDK · agent framework 를 들이지 않아, 외부에서 수집한 trace 없이는 dev · test split 을 채점하지 못함',
          evidence: [
            { path: 'tools/evals/consumer/runner/executor.ts', symbol: 'unavailableExecutor' },
          ],
        },
      ],
    },
    {
      id: 'verify',
      intent: '변경 코드를 직접 검증함',
      behavior: 'fixture 복사본에서 public-import → typecheck → test → build → lint 를 직접 실행',
      context: 'workspace',
      owner: 'consumer-eval',
      status: 'partial',
      source: [
        { path: 'tools/evals/consumer/verification/workspace.ts', symbol: 'materializeWorkspace' },
        { path: 'tools/evals/consumer/verification/policy.ts', symbol: 'KIND_ORDER' },
        { path: 'tools/evals/consumer/verification/repair.ts', symbol: 'DEFAULT_REPAIR_LIMIT' },
      ],
      tests: ['tools-vitest'],
      docs: [],
      next: ['grade'],
      gaps: [
        {
          kind: 'unsupported',
          note: 'react-native test 는 unsupported. react-native 가 트랜스파일되지 않은 소스를 배포해 jsdom fixture 에서 파싱하지 못함',
          evidence: [
            {
              path: 'tools/evals/consumer/verification/policy.ts',
              symbol: 'react-native components cannot render in the jsdom fixture harness',
            },
          ],
        },
      ],
    },
    {
      id: 'grade',
      intent: '결정적으로 채점함',
      behavior: '코드로 된 grader 5종이 채점. LLM-as-a-Judge 없음',
      context: 'workspace',
      owner: 'consumer-eval',
      status: 'partial',
      source: [
        { path: 'tools/evals/consumer/graders/index.ts', symbol: 'gradeTask' },
        { path: 'tools/evals/consumer/graders/public-import.ts' },
        { path: 'tools/evals/consumer/graders/task-success.ts' },
      ],
      tests: ['tools-vitest'],
      docs: [],
      next: ['report'],
      gaps: [
        {
          kind: 'unsupported',
          note: 'requiredBehaviors · forbiddenBehaviors 는 schema 에만 있고 채점하지 않음. verification 의 test 가 간접 확인',
          evidence: [
            { path: 'tools/evals/consumer/runner/schema.ts', symbol: 'requiredBehaviors' },
          ],
        },
        {
          kind: 'unsupported',
          note: 'tool-error category 는 선언만 있고 배정 경로가 없음',
          evidence: [
            { path: 'tools/evals/consumer/graders/task-success.ts', symbol: "'tool-error'" },
          ],
        },
        {
          kind: 'unsupported',
          note: 'typecheck 는 없는 export 는 잡지만 polymorphic 컴포넌트의 없는 prop 은 통과시킴. 카탈로그로만 잡힘',
          evidence: [{ path: 'tools/evals/consumer/graders/public-import.ts' }],
        },
      ],
    },
    {
      id: 'report',
      intent: '결과를 남김',
      behavior: 'traces.jsonl · summary.json · report.md 를 쓰고 네 축을 합치지 않고 보임',
      context: 'workspace',
      owner: 'consumer-eval',
      status: 'implemented',
      source: [
        { path: 'tools/evals/consumer/reporters/markdown.ts', symbol: 'Overall Scorecard' },
        { path: 'tools/evals/consumer/reporters/aggregate.ts' },
        { path: 'tools/evals/consumer/verification/execute.ts', symbol: 'EXCERPT_LIMIT' },
      ],
      tests: ['tools-vitest'],
      docs: [],
      next: ['baseline', 'collect'],
    },
    {
      id: 'baseline',
      intent: 'baseline 과 비교함',
      behavior: '--compare-baseline 일 때만 같은 조건의 스냅샷과 비교. 결과는 report-only',
      context: 'workspace',
      owner: 'consumer-eval',
      status: 'partial',
      source: [
        { path: 'tools/evals/consumer/ci/baseline.ts', symbol: 'writeBaseline' },
        { path: 'tools/evals/consumer/ci/conditions.ts', symbol: 'CONDITION_FIELDS' },
        { path: 'tools/evals/consumer/ci/compare.ts', symbol: 'No baseline available' },
      ],
      tests: ['tools-vitest'],
      docs: [],
      next: [],
      gaps: [
        {
          kind: 'not-found',
          note: '스냅샷이 아직 없음. report 는 현재 실행만 보이고 회귀를 지어내지 않음. 손으로 쓰지 않고 --write-baseline 이 처음 쓸 때 폴더가 생김',
          evidence: [{ path: 'tools/evals/consumer/ci/baseline.ts', symbol: 'BASELINE_DIR' }],
        },
      ],
    },
    collectStep('summary.json · traces.jsonl', 'tmp/llm-evals/<run>'),
  ],
};
