import type { DocumentRef } from '../domain/model';

/** 저장소 문서. `title` 은 첫 `#` 제목 그대로다(검증된다). */
export const documents: DocumentRef[] = [
  { id: 'root-agents', path: 'AGENTS.md', title: 'shared-stack — 크로스 플랫폼 UI 시스템' },
  { id: 'root-readme', path: 'README.md', title: '@berrypjh/shared-stack' },
  { id: 'harness-profile', path: '.claude/harness.profile.md', title: 'Harness profile' },

  { id: 'demo-web-agents', path: '.claude/rules/demo-web.md', title: 'demo-web (`apps/demo-web`)' },
  {
    id: 'demo-mobile-agents',
    path: '.claude/rules/demo-mobile.md',
    title: 'demo-mobile (`apps/demo-mobile`)',
  },
  { id: 'observability-usage', path: 'docs/observability/usage.md', title: '품질 관측 사용법' },
  { id: 'devhub-agents', path: '.claude/rules/devhub.md', title: 'devhub (`apps/devhub`)' },
  {
    id: 'devhub-e2e-agents',
    path: '.claude/rules/devhub-e2e.md',
    title: 'devhub-e2e (`apps/devhub-e2e`)',
  },

  {
    id: 'design-tokens-agents',
    path: '.claude/rules/design-tokens.md',
    title: 'design-tokens (`libs/design-tokens`)',
  },
  {
    id: 'design-tokens-readme',
    path: 'libs/design-tokens/README.md',
    title: '@berrypjh/design-tokens',
  },
  { id: 'ui-core-agents', path: '.claude/rules/ui-core.md', title: 'ui-core (`libs/ui-core`)' },
  {
    id: 'devhub-ui-agents',
    path: '.claude/rules/devhub-ui.md',
    title: 'devhub-ui (`libs/devhub-ui`)',
  },
  { id: 'devhub-ui-readme', path: 'libs/devhub-ui/README.md', title: '@berrypjh/devhub-ui' },
  { id: 'ui-core-readme', path: 'libs/ui-core/README.md', title: '@berrypjh/ui-core' },
  { id: 'react-ui-agents', path: '.claude/rules/react-ui.md', title: 'react-ui (`libs/react-ui`)' },
  { id: 'react-ui-readme', path: 'libs/react-ui/README.md', title: '@berrypjh/react-ui' },
  {
    id: 'react-ui-consumer-agents',
    path: 'libs/react-ui/AGENTS.consumer.md',
    title: '@berrypjh/react-ui',
  },
  {
    id: 'react-native-ui-agents',
    path: '.claude/rules/react-native-ui.md',
    title: 'react-native-ui (`libs/react-native-ui`)',
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
  { id: 'records-agents', path: '.claude/rules/records.md', title: '개발 기록 (`docs/records`)' },
  {
    id: 'observability-contracts-agents',
    path: '.claude/rules/observability-contracts.md',
    title: 'observability-contracts (`libs/observability-contracts`)',
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
    id: 'observability-architecture',
    path: 'docs/observability/architecture.md',
    title: '품질 관측 아키텍처',
  },
  {
    id: 'observability-metrics',
    path: 'docs/observability/metrics.md',
    title: '품질 관측 metric 카탈로그',
  },
  { id: 'tools-readme', path: 'tools/README.md', title: 'tools' },
  { id: 'berry-commit-readme', path: 'plugins/berry-commit/README.md', title: 'berry-commit' },
  { id: 'berry-dev-readme', path: 'plugins/berry-dev/README.md', title: 'berry-dev' },

  {
    id: 'standards-core',
    path: 'plugins/berry-dev/standards/rules/core.md',
    title: '작업 기본 원칙',
  },
  {
    id: 'standards-berry-consumer',
    path: 'plugins/berry-dev/standards/rules/berry-consumer.md',
    title: '`@berrypjh` UI 패키지 소비',
  },
  {
    id: 'standards-cross-runtime-pure',
    path: 'plugins/berry-dev/standards/rules/cross-runtime-pure.md',
    title: '플랫폼 중립 계약 · 로직',
  },
  {
    id: 'standards-docs-ko',
    path: 'plugins/berry-dev/standards/rules/docs-ko.md',
    title: '한국어 문서 문체',
  },
  {
    id: 'standards-ko-ui',
    path: 'plugins/berry-dev/standards/rules/ko-ui.md',
    title: '한국어 사용자 화면 문구',
  },
];
