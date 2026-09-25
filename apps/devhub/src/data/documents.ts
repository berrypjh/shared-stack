import type { DocumentRef } from '../domain/model';

/** 저장소 문서. `title` 은 첫 `#` 제목 그대로다(검증된다). */
export const documents: DocumentRef[] = [
  { id: 'root-agents', path: 'AGENTS.md', title: 'shared-stack — 크로스 플랫폼 UI 시스템' },
  { id: 'root-readme', path: 'README.md', title: '@berrypjh/shared-stack' },
  { id: 'changelog', path: 'CHANGELOG.md', title: 'CHANGELOG.md' },

  { id: 'demo-web-agents', path: 'apps/demo-web/AGENTS.md', title: 'demo-web' },
  { id: 'demo-web-readme', path: 'apps/demo-web/README.md', title: '@berrypjh/demo-web' },
  { id: 'demo-mobile-agents', path: 'apps/demo-mobile/AGENTS.md', title: 'demo-mobile' },
  { id: 'demo-mobile-readme', path: 'apps/demo-mobile/README.md', title: '@berrypjh/demo-mobile' },
  { id: 'quality-lab-agents', path: 'apps/quality-lab/AGENTS.md', title: 'quality-lab' },
  { id: 'quality-lab-readme', path: 'apps/quality-lab/README.md', title: '@berrypjh/quality-lab' },
  {
    id: 'quality-lab-e2e-agents',
    path: 'apps/quality-lab-e2e/AGENTS.md',
    title: 'quality-lab-e2e',
  },
  { id: 'devhub-agents', path: 'apps/devhub/AGENTS.md', title: 'devhub' },
  { id: 'devhub-e2e-agents', path: 'apps/devhub-e2e/AGENTS.md', title: 'devhub-e2e' },

  { id: 'design-tokens-agents', path: 'libs/design-tokens/AGENTS.md', title: 'design-tokens' },
  {
    id: 'design-tokens-readme',
    path: 'libs/design-tokens/README.md',
    title: '@berrypjh/design-tokens',
  },
  { id: 'ui-core-agents', path: 'libs/ui-core/AGENTS.md', title: 'ui-core' },
  { id: 'devhub-ui-agents', path: 'libs/devhub-ui/AGENTS.md', title: 'devhub-ui' },
  { id: 'devhub-ui-readme', path: 'libs/devhub-ui/README.md', title: '@berrypjh/devhub-ui' },
  { id: 'ui-core-readme', path: 'libs/ui-core/README.md', title: '@berrypjh/ui-core' },
  { id: 'react-ui-agents', path: 'libs/react-ui/AGENTS.md', title: 'react-ui' },
  { id: 'react-ui-readme', path: 'libs/react-ui/README.md', title: '@berrypjh/react-ui' },
  {
    id: 'react-ui-consumer-agents',
    path: 'libs/react-ui/AGENTS.consumer.md',
    title: '@berrypjh/react-ui',
  },
  {
    id: 'react-native-ui-agents',
    path: 'libs/react-native-ui/AGENTS.md',
    title: 'react-native-ui',
  },
  {
    id: 'react-native-ui-readme',
    path: 'libs/react-native-ui/README.md',
    title: '@berrypjh/react-native-ui',
  },
  {
    id: 'react-native-ui-consumer-agents',
    path: 'libs/react-native-ui/AGENTS.consumer.md',
    title: '@berrypjh/react-native-ui',
  },
  {
    id: 'observability-contracts-agents',
    path: 'libs/observability-contracts/AGENTS.md',
    title: 'observability-contracts',
  },
  {
    id: 'eslint-config-readme',
    path: 'libs/eslint-config/README.md',
    title: '@berrypjh/eslint-config',
  },
  {
    id: 'prettier-config-readme',
    path: 'libs/prettier-config/README.md',
    title: '@berrypjh/prettier-config',
  },
  { id: 'tsconfig-readme', path: 'libs/tsconfig/README.md', title: '@berrypjh/tsconfig' },
  {
    id: 'commitlint-config-readme',
    path: 'libs/commitlint-config/README.md',
    title: '@berrypjh/commitlint-config',
  },

  {
    id: 'quality-lab-architecture',
    path: 'docs/quality-lab/architecture.md',
    title: 'Quality Lab 아키텍처',
  },
  {
    id: 'quality-lab-collectors',
    path: 'docs/quality-lab/collectors.md',
    title: 'quality-lab 수집기',
  },
  {
    id: 'quality-lab-limitations',
    path: 'docs/quality-lab/limitations.md',
    title: 'quality-lab 알려진 제약',
  },
  {
    id: 'quality-lab-metrics',
    path: 'docs/quality-lab/metrics.md',
    title: 'quality-lab metric 카탈로그',
  },
  {
    id: 'quality-lab-verification',
    path: 'docs/quality-lab/verification.md',
    title: 'quality-lab 검증',
  },
  {
    id: 'claude-harness-architecture',
    path: 'docs/claude-harness/architecture.md',
    title: 'Claude Harness 아키텍처',
  },
  {
    id: 'claude-harness-contracts',
    path: 'docs/claude-harness/contracts.md',
    title: 'Claude Harness 계약',
  },
  {
    id: 'claude-harness-standards-sources',
    path: 'docs/claude-harness/standards-sources.md',
    title: 'Claude Harness standards 추출 근거',
  },
  {
    id: 'claude-harness-setup',
    path: 'docs/claude-harness/setup.md',
    title: 'Claude Harness 도입',
  },
  {
    id: 'claude-harness-verification',
    path: 'docs/claude-harness/verification.md',
    title: 'Claude Harness 검증',
  },

  {
    id: 'consumer-retrieval-readme',
    path: 'tools/consumer-retrieval/README.md',
    title: 'consumer-retrieval',
  },
  { id: 'consumer-eval-readme', path: 'tools/evals/consumer/README.md', title: 'consumer eval' },
  {
    id: 'consumer-eval-baseline-readme',
    path: 'tools/evals/consumer/baseline/README.md',
    title: 'baseline',
  },
  {
    id: 'consumer-eval-fixtures-readme',
    path: 'tools/evals/consumer/fixtures/README.md',
    title: 'fixtures',
  },
  {
    id: 'measure-tokens-readme',
    path: 'tools/scripts/measure-tokens/README.md',
    title: 'measure-tokens',
  },
  {
    id: 'treeshake-readme',
    path: 'tools/scripts/treeshake/README.md',
    title: 'treeshake',
    brokenLinks: [
      {
        href: '../../../docs/verification-guide.md',
        note: 'docs/verification-guide.md 는 저장소 기록 어디에도 없다 — 처음부터 대상 없이 쓰인 링크다',
      },
    ],
  },
  { id: 'berry-commit-readme', path: 'plugins/berry-commit/README.md', title: 'berry-commit' },
  { id: 'berry-dev-readme', path: 'plugins/berry-dev/README.md', title: 'berry-dev' },
];
