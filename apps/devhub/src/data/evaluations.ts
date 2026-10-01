import type { Evaluation } from '../domain/model';

/** 평가 섹션의 항목. 묶음 순서는 `EVALUATION_KIND`, 묶음 안 순서는 이 배열이다. */
export const evaluations: Evaluation[] = [
  {
    id: 'bundle-budget',
    kind: 'bundle',
    title: '번들 budget',
    summary: 'import 패턴마다 size-limit 으로 잰 brotli 크기와 한도',
    collectProfile: 'core',
    sources: [{ path: '.size-limit.cjs' }],
  },
  {
    id: 'treeshake',
    kind: 'bundle',
    title: '트리셰이킹 진단',
    summary: '심볼 하나만 import 한 번들의 raw · gzip 크기. CI 게이트가 아닌 진단',
    collectProfile: 'core',
    sources: [{ path: 'tools/scripts/treeshake/check.ts' }],
  },
  {
    id: 'context-tokens',
    kind: 'context',
    title: '컨텍스트 토큰',
    summary: '에이전트가 읽는 context 를 측정 범위마다 tiktoken 으로 센 token 수',
    collectProfile: 'core',
    sources: [{ path: 'tools/scripts/measure-tokens/registry.ts' }],
  },
  {
    id: 'eval-scorecard',
    kind: 'eval',
    title: '성적표',
    summary: '에이전트가 과제를 해냈는지, variant 마다 성공률 · 거짓 성공 · 실패 원인',
    collectProfile: 'eval',
    sources: [{ path: 'tools/evals/consumer/graders/task-success.ts' }],
  },
  {
    id: 'eval-routing',
    kind: 'eval',
    title: '라우팅',
    summary: '에이전트가 맞는 플랫폼(웹 · React Native)과 패키지를 골랐는지',
    collectProfile: 'eval',
    sources: [{ path: 'tools/evals/consumer/graders/routing.ts' }],
  },
  {
    id: 'eval-retrieval',
    kind: 'eval',
    title: '검색',
    summary: '에이전트가 과제에 필요한 근거(컴포넌트 · prop · 문서)를 찾아 읽었는지',
    collectProfile: 'eval',
    sources: [{ path: 'tools/evals/consumer/graders/retrieval.ts' }],
  },
  {
    id: 'eval-verification',
    kind: 'eval',
    title: '검증',
    summary: '에이전트가 만든 코드가 타입 검사 · 테스트를 통과하는지',
    collectProfile: 'eval',
    sources: [{ path: 'tools/evals/consumer/graders/verification.ts' }],
  },
];
