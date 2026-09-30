import type { Plugin } from '../domain/model';

/**
 * marketplace(`.claude-plugin/marketplace.json`)로 배포하는 Claude Code 플러그인 전부.
 * 소비 저장소가 설치해 쓰는 표면을 파일에서 옮겨 적는다 — `catalog.spec.ts` 가 marketplace · plugin.json ·
 * SKILL.md · .mcp.json · 서버의 registerTool · hooks.json · standards/manifest.json 과 대조한다.
 */
export const plugins: Plugin[] = [
  {
    id: 'berry-commit',
    marketplace: 'berrypjh',
    root: 'plugins/berry-commit',
    version: '0.1.0',
    description:
      'staged 변경을 scope별로 분석해 한국어 Conventional Commits 메시지를 제안하고 승인 후 커밋한다. commit-mcp MCP 서버를 함께 제공한다.',
    category: 'workflow',
    kind: 'commit',
    keywords: ['commit', 'conventional-commits', 'mcp', 'korean'],
    manifest: { path: 'plugins/berry-commit/.claude-plugin/plugin.json' },
    skills: [
      {
        name: 'commit-scope',
        description:
          'staged 변경을 scope별로 분석하고 Conventional Commits 형식의 한국어 커밋 메시지를 제안한 뒤, 승인 후 scope별로 커밋한다.',
        whenToUse:
          'Use when the user wants to create commit messages for staged git changes, especially when multiple apps/libs scopes are staged together.',
        whenToUseKo:
          '사용자가 staged 된 git 변경의 커밋 메시지를 만들려 할 때, 특히 여러 apps · libs scope 가 함께 staged 되어 있을 때 씀.',
        argumentHint: '[scope] [major]',
        userOnly: true,
        source: { path: 'plugins/berry-commit/skills/commit-scope/SKILL.md' },
        resources: [
          { path: 'plugins/berry-commit/skills/commit-scope/examples/commit-message-rules.md' },
        ],
      },
    ],
    mcpServers: [
      {
        name: 'commit-mcp',
        command: 'node ${CLAUDE_PLUGIN_ROOT}/dist/index.js',
        config: { path: 'plugins/berry-commit/.mcp.json' },
        implementation: { path: 'plugins/berry-commit/src/index.ts' },
        tools: [
          { name: 'list_staged_scopes', title: 'List staged scopes' },
          { name: 'get_scope_details', title: 'Get scope details' },
          { name: 'commit_scope', title: 'Commit scope' },
        ],
      },
    ],
    hooks: [],
    rules: [],
    scripts: [],
    examples: [],
    docs: ['berry-commit-readme'],
  },
  {
    id: 'berry-dev',
    marketplace: 'berrypjh',
    root: 'plugins/berry-dev',
    version: '0.1.0',
    description:
      '여러 저장소가 같은 작업 규칙을 쓰도록 standards rule 원본과 sync · check CLI, 검증 · UI 검수 skill, secret guard hook을 제공한다.',
    category: 'workflow',
    kind: 'standards',
    keywords: ['standards', 'rules', 'harness', 'korean'],
    manifest: { path: 'plugins/berry-dev/.claude-plugin/plugin.json' },
    skills: [
      {
        name: 'frontend-quality',
        description:
          '화면 · UI 컴포넌트 변경을 역할(소비 앱 · UI 라이브러리)과 플랫폼에 맞게 검수한다. 재사용, 네 가지 상태, 접근성, 토큰, 문구와 긴 문자열을 확인하고 코드로만 본 것과 실제로 확인한 것을 나눠 보고한다.',
        whenToUse:
          'Use after adding or changing UI code (screens, components, styles) and before reporting it as done, or when deciding whether to reuse an existing component or add a new one.',
        whenToUseKo:
          '화면 · 컴포넌트 · 스타일 같은 UI 코드를 추가하거나 바꾼 뒤 완료를 보고하기 전에, 또는 기존 컴포넌트를 재사용할지 새로 만들지 정할 때 씀.',
        argumentHint: '[files|dir] (생략하면 git 변경분의 UI 파일)',
        userOnly: false,
        source: { path: 'plugins/berry-dev/skills/frontend-quality/SKILL.md' },
        resources: [
          { path: 'plugins/berry-dev/skills/frontend-quality/references/platform-checks.md' },
        ],
      },
      {
        name: 'repo-verify',
        description:
          '바뀐 파일에서 실제로 영향받는 프로젝트와 target 을 확인하고, 가장 싼 검사부터 필요한 만큼만 올려 검증한 뒤, 돌리지 못한 것까지 상태별로 보고한다.',
        whenToUse:
          'Use after changing code or config in a repository, before reporting the work as done, or when unsure which projects a change affects and how far to escalate lint, typecheck, test and build.',
        whenToUseKo:
          '저장소의 코드나 설정을 바꾼 뒤 완료를 보고하기 전에, 또는 변경이 어떤 프로젝트에 영향을 주는지 · lint · typecheck · test · build 중 어디까지 올려야 할지 확실하지 않을 때 씀.',
        argumentHint: '[files|project] (생략하면 git 변경분)',
        userOnly: false,
        source: { path: 'plugins/berry-dev/skills/repo-verify/SKILL.md' },
        resources: [],
      },
    ],
    mcpServers: [],
    hooks: [
      {
        event: 'PreToolUse',
        matcher: 'Bash',
        command: 'node ${CLAUDE_PLUGIN_ROOT}/scripts/guard-secrets.mjs',
        timeoutSeconds: 10,
        summary: 'secret 파일을 Bash 로 우회해서 읽는 명령을 막는다',
        config: { path: 'plugins/berry-dev/hooks/hooks.json' },
        policy: {
          source: {
            path: 'plugins/berry-dev/scripts/secret-policy.mjs',
            symbol: 'findSecretReason',
          },
          decision:
            'secret 경로와 우회 수단이 한 명령에 함께 있을 때만 deny 함. 둘 중 하나만 있으면 통과시킴',
          targets: ['.env', '.env.*', '*.key', '*.p8', '*.p12', '*.jks', '*.mobileprovision'],
          exceptions: ['*.example', '*.sample', '*.template'],
          bypasses: [
            { what: '셸 리다이렉트', examples: '> · >> (fd 숫자 뒤 · >& 는 제외)' },
            {
              what: '인터프리터 eval',
              examples: 'node · bun · deno -e/--eval, python · ruby · perl -c/-e',
            },
            {
              what: '원시 읽기 명령',
              examples: 'xxd · base64 · od · strings · dd · tee · cp · mv · grep · rg · awk',
            },
          ],
          limits:
            '명령 문자열을 단순 토큰으로 볼 뿐 셸 parser 도 OS sandbox 도 아니라 우회할 수 있음. 입력이 깨지거나 hook 이 실패하면 통과시킴 — 보조 장치이지 마지막 방어선이 아님',
          evidence: [
            { path: 'plugins/berry-dev/README.md', symbol: '## secret guard' },
            { path: 'tools/scripts/claude-harness/guard.test.ts' },
          ],
        },
      },
    ],
    rules: [
      { id: 'core', scope: 'core', source: { path: 'plugins/berry-dev/standards/rules/core.md' } },
      {
        id: 'berry-consumer',
        scope: 'optional',
        source: { path: 'plugins/berry-dev/standards/rules/berry-consumer.md' },
      },
      {
        id: 'cross-runtime-pure',
        scope: 'optional',
        source: { path: 'plugins/berry-dev/standards/rules/cross-runtime-pure.md' },
      },
      {
        id: 'docs-ko',
        scope: 'optional',
        source: { path: 'plugins/berry-dev/standards/rules/docs-ko.md' },
      },
      {
        id: 'ko-ui',
        scope: 'optional',
        source: { path: 'plugins/berry-dev/standards/rules/ko-ui.md' },
      },
    ],
    scripts: [
      { path: 'plugins/berry-dev/scripts/guard-secrets.mjs' },
      { path: 'plugins/berry-dev/scripts/secret-policy.mjs' },
      { path: 'plugins/berry-dev/scripts/standards-core.mjs' },
      { path: 'plugins/berry-dev/scripts/standards-fs.mjs' },
      { path: 'plugins/berry-dev/scripts/standards.mjs' },
    ],
    examples: [
      { path: 'plugins/berry-dev/examples/harness-source.example.json' },
      { path: 'plugins/berry-dev/examples/harness.profile.md' },
      { path: 'plugins/berry-dev/examples/permissions.review.json' },
      { path: 'plugins/berry-dev/examples/standards.consumer.json' },
    ],
    docs: ['berry-dev-readme'],
  },
];
