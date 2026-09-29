import type { RecordRef } from '../domain/model';

/**
 * 개발 기록. 항목마다 `docs/records/` 아래 markdown 파일 하나다.
 * 기록은 무엇을 언제 왜 결정하거나 고쳤는지 말하고, 지금 무엇이 참인지는 설계 문서가 말한다.
 */
export const records: RecordRef[] = [
  {
    id: 'devhub-editorial-theme-pair',
    path: 'docs/records/2026-09-29-devhub-editorial-theme-pair.md',
    title: 'editorial 테마 짝(ivory · charcoal)과 DevHub 의 ThemePair 추가',
    kind: 'decision',
    date: '2026-09-29',
    summary:
      'ivory · charcoal 을 정식 ThemeName 으로 추가하고 devhub-ui 의 논리 모드와 토큰 테마를 선택 설정 ThemePair 로 분리. 기본 짝 · shared-stack DevHub 는 light · dark, 저장값은 모드',
    sources: [
      { path: 'libs/design-tokens/src/themes.ts', symbol: 'themes' },
      { path: 'libs/devhub-ui/src/theme/theme.ts', symbol: 'createThemeScript' },
      { path: 'apps/devhub/index.html' },
    ],
    docs: [
      'design-tokens-agents',
      'design-tokens-readme',
      'devhub-ui-agents',
      'devhub-ui-readme',
      'devhub-agents',
    ],
    tests: [
      'design-tokens-vitest',
      'ui-core-vitest',
      'react-native-ui-jest',
      'demo-web-vitest',
      'devhub-ui-vitest',
      'devhub-vitest',
      'devhub-e2e-playwright',
    ],
  },
  {
    id: 'project-docs-to-rules',
    path: 'docs/records/2026-09-26-project-docs-to-rules.md',
    title: '하위 프로젝트 지침을 path rule 로, 앱 설명을 docs 로 이동',
    kind: 'decision',
    date: '2026-09-26',
    summary:
      '한 사실이 여러 문서에 있어 어긋나던 구조를 정리. 지침은 .claude/rules, 앱 설명은 docs, 배포되는 문서는 원본 옆',
    sources: [
      { path: 'apps/devhub/src/lib/markdown/sources.ts', symbol: 'loadRaw' },
      { path: 'apps/devhub/src/data/documents.ts' },
    ],
    docs: ['root-agents', 'devhub-agents', 'observability-usage', 'observability-architecture'],
    tests: ['devhub-vitest'],
    brokenLinks: [
      {
        href: '../demo/web.md',
        note: '2026-09-30 삭제 — 데모 실행 방법은 루트 README.md 로 옮겼음',
      },
      {
        href: '../demo/mobile.md',
        note: '2026-09-30 삭제 — 데모 실행 방법은 루트 README.md 로 옮겼음',
      },
    ],
  },
  {
    id: 'devhub-ui-package',
    path: 'docs/records/2026-09-22-devhub-ui-package.md',
    title: 'DevHub 공용 화면을 @berrypjh/devhub-ui 패키지로 분리',
    kind: 'decision',
    date: '2026-09-22',
    summary:
      '두 저장소의 DevHub 가 같은 셸 · 그림 · markdown · 검색을 쓰도록 공개 패키지로. 카탈로그는 앱에, 라우터는 DevHubProvider 로',
    sources: [
      { path: 'libs/devhub-ui/src/index.ts' },
      { path: 'libs/devhub-ui/src/provider/devhub-provider.tsx', symbol: 'DevHubProvider' },
      { path: 'apps/devhub/src/components/shell/router-adapter.tsx', symbol: 'RouterAdapter' },
      { path: 'apps/devhub/src/components/shell/devhub-shell.tsx' },
    ],
    docs: ['devhub-ui-agents', 'devhub-ui-readme', 'devhub-agents'],
    tests: ['devhub-ui-vitest', 'devhub-vitest', 'published-package-boundary'],
  },
  {
    id: 'devhub-build-node-env',
    path: 'docs/records/2026-09-22-devhub-build-node-env.md',
    title: 'devhub 의 vite build 가 같은 Nx 호출 안에서 dev 번들로 나오던 문제',
    kind: 'fix',
    date: '2026-09-22',
    summary:
      'ui-core 와 한 Nx 호출에서 빌드하면 dev 번들이 나옴. build target env 로 production 고정 — 설정 파일에서 바꾸면 Nx 안 테스트가 깨짐',
    sources: [
      { path: 'apps/devhub/project.json', symbol: 'NODE_ENV' },
      { path: 'libs/ui-core/project.json', symbol: '@nx/vite:build' },
    ],
    docs: ['devhub-agents'],
    tests: [],
  },
  {
    id: 'release-feat-minor-bump',
    path: 'docs/records/2026-09-14-release-feat-minor-bump.md',
    title: '릴리스가 feat 커밋을 patch 로 올리던 문제',
    kind: 'fix',
    date: '2026-09-14',
    summary:
      '커밋 scope 와 nx release 프로젝트 이름이 달라 feat 를 못 알아봄. 릴리스 스크립트가 직접 판정',
    sources: [
      { path: 'tools/scripts/release/release-bump.ts', symbol: 'hasReleaseFeature' },
      { path: 'tools/scripts/release/release-npm.ts', symbol: 'getLogSinceLastTag' },
      { path: 'CHANGELOG.md' },
    ],
    docs: [],
    tests: ['tools-vitest'],
  },
  {
    id: 'treeshake-node-path',
    path: 'docs/records/2026-09-14-treeshake-node-path.md',
    title: 'treeshake 측정 entry 가 design-tokens 를 찾지 못하던 문제',
    kind: 'fix',
    date: '2026-09-14',
    summary:
      '저장소 밖 entry 는 pnpm shim 경로로만 패키지를 찾음. 번들 실행 환경에 NODE_PATH 를 넘김',
    sources: [{ path: 'tools/scripts/treeshake/measure.ts', symbol: 'NODE_PATH' }],
    docs: ['treeshake-readme'],
    tests: [],
  },
  {
    id: 'react-ui-forced-colors-and-state-priority',
    path: 'docs/records/2026-09-10-react-ui-forced-colors-and-state-priority.md',
    title: 'react-ui 입력 상태 우선순위를 선언 순서에서 떼고 forced-colors 포커스를 복구',
    kind: 'fix',
    date: '2026-09-10',
    summary:
      ':not() 배타 규칙으로 disabled > error > focused 를 고정하고, 고대비 모드에서 사라지던 box-shadow 링에 outline 을 더함',
    sources: [
      { path: 'libs/react-ui/src/components/forcedColors.test.ts' },
      { path: 'libs/react-ui/src/components/inputVariantStates.test.ts' },
      { path: 'libs/react-ui/test/componentStyles.ts' },
    ],
    docs: ['react-ui-agents'],
    tests: ['react-ui-vitest'],
  },
  {
    id: 'rn-disabled-focus-revival',
    path: 'docs/records/2026-09-10-rn-disabled-focus-revival.md',
    title: 'RN 입력이 disabled 를 지나면 예전 focus 표시가 되살아나던 문제',
    kind: 'fix',
    date: '2026-09-10',
    summary: '파생값으로 가리기만 하던 focus 를 disabled 가 되면 상태째 비우도록 수정',
    sources: [
      {
        path: 'libs/react-native-ui/src/components/form-control/FormControl.test.tsx',
        symbol: '내부 focus 상태가 남지 않는다',
      },
      {
        path: 'libs/react-native-ui/src/components/input-base/InputBase.tsx',
        symbol: 'focusedState',
      },
    ],
    docs: ['react-native-ui-agents'],
    tests: ['react-native-ui-jest'],
  },
  {
    id: 'treeshake-diagnostic-only',
    path: 'docs/records/2026-09-10-treeshake-diagnostic-only.md',
    title: 'treeshake 검사는 진단 전용 — react-ui 단일 심볼 크기가 모두 같던 원인은 displayName',
    kind: 'decision',
    date: '2026-09-10',
    summary:
      'displayName 최상위 할당 21개가 모든 컴포넌트를 붙잡음. 고치면 breaking 이라 미루고 회귀는 size-limit 이 막음',
    sources: [
      { path: 'tools/scripts/treeshake/check.ts', symbol: '진단 전용이다' },
      { path: '.size-limit.cjs' },
    ],
    docs: ['treeshake-readme'],
    tests: [],
  },
  {
    id: 'pressed-offset-token',
    path: 'docs/records/2026-09-10-pressed-offset-token.md',
    title: '눌림 상태는 색이 아니라 위치 — component.pressedOffset 토큰으로 승격',
    kind: 'decision',
    date: '2026-09-10',
    summary:
      'web 에 박혀 있던 1px 눌림을 base 토큰으로. pressed 색 토큰은 만들지 않고 테스트로 고정',
    sources: [
      { path: 'libs/design-tokens/tokens/light/component.json', symbol: 'pressedOffset' },
      {
        path: 'libs/react-ui/src/components/button-base/button-base.scss',
        symbol: '--ds-component-pressed-offset',
      },
      { path: 'libs/design-tokens/src/lib/contrast.test.ts', symbol: 'pressed 상태 어휘' },
    ],
    docs: ['design-tokens-agents'],
    tests: ['design-tokens-vitest'],
  },
  {
    id: 'demo-mobile-single-react-native',
    path: 'docs/records/2026-09-08-demo-mobile-single-react-native.md',
    title: 'demo-mobile 번들에 react-native 가 두 벌 실려 ActivityIndicator 가 터지던 문제',
    kind: 'fix',
    date: '2026-09-08',
    summary: 'pnpm 이 깐 react-native 사본 둘이 모두 번들됨. metro 해석을 앱의 사본 하나로 고정',
    sources: [{ path: 'apps/demo-mobile/metro.config.js', symbol: 'resolveFromApp' }],
    docs: ['demo-mobile-agents'],
    tests: [],
  },
  {
    id: 'rn-theme-provider-all-themes',
    path: 'docs/records/2026-09-07-rn-theme-provider-all-themes.md',
    title: 'RN ThemeProvider 가 새로 등록된 테마 넷을 몰라 렌더에서 터지던 문제',
    kind: 'fix',
    date: '2026-09-07',
    summary:
      '모드 → 토큰 표에 넷이 빠져 있었음. satisfies 로 테마가 늘면 typecheck 가 먼저 깨지게 함',
    sources: [
      {
        path: 'libs/react-native-ui/src/theme/ThemeProvider.tsx',
        symbol: 'DEFAULT_TOKENS_BY_MODE',
      },
    ],
    docs: ['react-native-ui-agents'],
    tests: ['react-native-ui-jest'],
  },
  {
    id: 'ui-core-contract-ownership',
    path: 'docs/records/2026-09-07-ui-core-contract-ownership.md',
    title: 'ui-core 에는 두 렌더러가 실제로 구현하는 계약만 두도록 소유권 축소',
    kind: 'decision',
    date: '2026-09-07',
    summary:
      'web 전용 계약 · 유틸을 react-ui 로 옮기고 RN 구현이 생기기 전에는 ui-core 로 올리지 않음. 경계를 테스트로 고정',
    sources: [
      { path: 'libs/ui-core/src/boundary.test.ts' },
      { path: 'libs/ui-core/src/packageSurface.test.ts' },
      { path: 'libs/react-ui/src/deprecated.ts' },
    ],
    docs: ['react-ui-agents', 'ui-core-agents'],
    tests: ['ui-core-vitest'],
  },
  {
    id: 'react-ui-css-build-script',
    path: 'docs/records/2026-09-16-react-ui-css-build-script.md',
    title: 'react-ui 의 dist/index.css 를 rollup postcss 대신 별도 sass 스크립트로 생성',
    kind: 'fix',
    date: '2026-09-16',
    summary:
      '@nx/rollup 23 은 side-effect SCSS import 의 CSS 를 추출하지 않음. CSS 생성을 build-js 의 별도 단계로 분리',
    sources: [
      { path: 'tools/scripts/build-react-ui-css.mjs' },
      { path: 'libs/react-ui/project.json', symbol: 'build-react-ui-css.mjs' },
      { path: 'libs/react-ui/package.json', symbol: 'autoprefixer' },
      { path: 'libs/react-ui/src/styles.ts' },
    ],
    docs: ['react-ui-agents'],
    tests: ['published-package-boundary'],
  },
  {
    id: 'react-ui-cascade-layers',
    path: 'docs/records/2026-09-15-react-ui-cascade-layers.md',
    title: 'react-ui 컴포넌트 스타일을 @layer components 에 두어 소비자 className 이 이기게 함',
    kind: 'decision',
    date: '2026-09-15',
    summary:
      '레이어 밖 선언은 특정도와 무관하게 레이어 안 선언을 이겨 소비자 Tailwind 유틸이 조용히 무시됐음. Tailwind v4 레이어 순서를 styles.scss 가 선언',
    sources: [
      {
        path: 'libs/react-ui/src/styles.scss',
        symbol: '@layer theme, base, components, utilities',
      },
      { path: 'libs/react-ui/src/styles.ts' },
      { path: 'libs/react-ui/project.json', symbol: '@layer theme' },
    ],
    docs: ['react-ui-consumer-agents', 'react-ui-agents'],
    tests: [],
  },
  {
    id: 'use-client-directive-in-dist',
    path: 'docs/records/2026-09-15-use-client-directive-in-dist.md',
    title: "RSC 서버에서 client 모듈이 평가되지 않도록 dist 에 'use client' 를 보존",
    kind: 'fix',
    date: '2026-09-15',
    summary:
      'rollup 이 지우는 모듈 디렉티브를 preserveModules 와 banner 로 청크 1행에 되돌림. 서버에서 쓰는 모듈은 디렉티브 없이 둠',
    sources: [
      { path: 'libs/react-ui/rollup.config.cjs', symbol: 'clientDirective' },
      { path: 'libs/react-ui/src/components/form-control/FormControlContext.ts' },
      { path: 'libs/react-ui/src/components/popover/PopoverContext.ts' },
      { path: '.size-limit.cjs', symbol: 'preserveModules' },
    ],
    docs: ['react-ui-consumer-agents', 'react-ui-agents'],
    tests: [],
  },
  {
    id: 'bash-guard-hook',
    path: 'docs/records/2026-09-15-bash-guard-hook.md',
    title: 'AI 세션의 Bash 를 PreToolUse hook 으로 가드',
    kind: 'decision',
    date: '2026-09-15',
    summary:
      '샌드박스에서 못 도는 포트 바인딩 명령과 secret 파일을 우회해 읽는 명령만 막음. 애매하면 막지 않음',
    sources: [
      { path: '.claude/hooks/guard-bash.mjs', symbol: 'findReason' },
      { path: '.claude/settings.json', symbol: 'PreToolUse' },
    ],
    docs: [],
    tests: [],
  },
  {
    id: 'quality-lab-into-devhub',
    path: 'docs/records/2026-09-27-quality-lab-into-devhub.md',
    title: 'quality-lab 화면을 DevHub 평가로 옮기고 앱을 삭제',
    kind: 'decision',
    date: '2026-09-27',
    summary:
      '품질 결과 화면 10개를 DevHub 평가 하위 화면으로 옮김. 수집기 · 계약은 그대로, export 와 audit 대상만 DevHub 로',
    sources: [
      { path: 'apps/devhub/src/lib/evaluation/screens.ts', symbol: 'EVALUATION_SCREENS' },
      { path: 'apps/devhub/src/lib/evaluation/client.ts', symbol: 'createClient' },
      { path: 'apps/devhub/src/components/shell/devhub-shell.tsx', symbol: 'useEvaluationSection' },
      { path: 'tools/scripts/observability/export.ts', symbol: 'PUBLIC_ROOT' },
    ],
    docs: ['devhub-agents', 'observability-architecture', 'observability-contracts-agents'],
    tests: [
      'devhub-vitest',
      'devhub-e2e-playwright',
      'tools-vitest',
      'observability-contracts-vitest',
    ],
  },
  {
    id: 'evaluation-custom-only',
    path: 'docs/records/2026-09-27-evaluation-custom-only.md',
    title: '평가에서 CI 가 주는 test · 검증 결과와 브라우저 세션을 제거',
    kind: 'decision',
    date: '2026-09-27',
    summary:
      '평가는 이 저장소가 따로 재는 번들 · AI 평가 · 접근성 · 디자인 시스템 · 패키지 표면과 실행 비교만. test · 검증 데이터는 수집기 · 계약까지 삭제',
    sources: [
      { path: 'apps/devhub/src/lib/evaluation/screens.ts', symbol: 'EVALUATION_SCREENS' },
      { path: 'libs/observability-contracts/src/observation.ts', symbol: 'DOMAINS' },
      { path: 'tools/scripts/observability/registry.ts', symbol: 'COMMANDS' },
    ],
    docs: ['devhub-agents', 'observability-architecture'],
    tests: ['devhub-vitest', 'tools-vitest', 'observability-contracts-vitest'],
  },
  {
    id: 'no-ui-mcp',
    path: 'docs/records/2026-09-04-no-ui-mcp.md',
    title: 'UI 조회를 MCP 도구가 아니라 CLI로 제공',
    kind: 'decision',
    date: '2026-09-04',
    summary:
      '효과를 잴 수 없고 이득은 초기 컨텍스트에서 나오므로 MCP · UI plugin 없이 패키지 동봉 CLI로. 에이전트가 full 카탈로그를 반복해 읽는 것이 관측되면 다시 검토',
    sources: [
      { path: 'tools/consumer-retrieval/package-cli.ts' },
      { path: 'tools/consumer-retrieval/cli.ts' },
    ],
    docs: ['consumer-retrieval-readme'],
    tests: ['tools-vitest'],
  },
  {
    id: 'evaluation-bundle-ai-only',
    path: 'docs/records/2026-09-30-evaluation-bundle-ai-only.md',
    title: '평가에서 접근성 · 디자인 시스템을 제거하고 번들 · AI 평가만 남김',
    kind: 'decision',
    date: '2026-09-30',
    summary:
      '접근성은 Storybook test-runner · devhub-e2e 가, 대비는 design-tokens 테스트가 이미 강제하므로 평가는 번들 · AI 평가만. 수집기 · 계약까지 삭제',
    sources: [
      { path: 'apps/devhub/src/lib/evaluation/screens.ts', symbol: 'EVALUATION_SCREENS' },
      { path: 'libs/observability-contracts/src/run.ts', symbol: 'PROFILES' },
      { path: 'tools/scripts/observability/registry.ts', symbol: 'COMMANDS' },
      { path: 'apps/devhub-e2e/src/a11y.spec.ts' },
    ],
    docs: ['devhub-agents', 'observability-architecture'],
    tests: ['devhub-vitest', 'tools-vitest', 'observability-contracts-vitest'],
  },
  {
    id: 'devhub-ko-ui',
    path: 'docs/records/2026-09-30-devhub-ko-ui.md',
    title: 'DevHub 화면 문구에 ko-ui 채택, 어미는 명사형',
    kind: 'decision',
    date: '2026-09-30',
    summary:
      'docs-ko 는 markdown 전용이라 DevHub 문구에는 ko-ui 를 켜고 profile 어미를 명사형으로. devhub-ui 제외, 기존 문구도 명사형으로 전환',
    sources: [
      { path: '.claude/standards.json', symbol: 'ko-ui' },
      { path: '.claude/harness.profile.md', symbol: 'locale 과 제품 정책' },
    ],
    docs: ['harness-profile', 'standards-ko-ui', 'claude-harness-standards-sources'],
    tests: ['tools-vitest', 'devhub-vitest'],
  },
];
