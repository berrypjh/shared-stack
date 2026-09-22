import type { ConsumerJourney } from '../../domain/model';

const NO_TEST = {
  kind: 'no-test' as const,
  note: '플러그인에 테스트 파일이 없다',
  evidence: [{ path: 'plugins/berry-commit/project.json' }],
};

/**
 * Claude Code 플러그인 배포와 사용. 이 저장소도 자기 `.claude/settings.json` 에서 같은 방식으로 켠다 —
 * 소비 저장소 단계의 근거가 그 파일이다.
 */
export const pluginDistribution: ConsumerJourney = {
  id: 'plugin-distribution',
  title: 'Claude 플러그인 배포 · 사용',
  goal: '마켓플레이스로 노출한 berry-commit 을 소비 저장소가 켜면 skill 과 MCP 서버로 scope 별 커밋을 한다',
  actor: 'consumer',
  steps: [
    {
      id: 'build',
      intent: 'MCP 서버를 빌드해 커밋한다',
      behavior:
        'tsc 로 검사하고 esbuild 로 dist/index.js 한 파일을 만든다. 설치에 빌드 단계가 없어 dist 를 커밋한다',
      context: 'workspace',
      owner: 'berry-commit',
      status: 'implemented',
      source: [
        { path: 'plugins/berry-commit/project.json', symbol: 'esbuild' },
        { path: 'plugins/berry-commit/dist/index.js' },
      ],
      commands: ['script:build:mcp:commit', 'berry-commit:build'],
      tests: [],
      docs: ['berry-commit-readme'],
      next: ['marketplace'],
      gaps: [NO_TEST],
    },
    {
      id: 'marketplace',
      intent: '마켓플레이스에 올린다',
      behavior:
        '.claude-plugin/marketplace.json 이 이 저장소를 berrypjh 마켓플레이스로 노출하고 ./plugins/berry-commit 을 가리킨다',
      context: 'workspace',
      owner: 'berry-commit',
      status: 'implemented',
      source: [
        { path: '.claude-plugin/marketplace.json', symbol: './plugins/berry-commit' },
        { path: 'plugins/berry-commit/.claude-plugin/plugin.json' },
      ],
      commands: [],
      tests: [],
      docs: ['berry-commit-readme', 'root-readme'],
      next: ['enable'],
    },
    {
      id: 'enable',
      intent: '소비 저장소에서 켠다',
      behavior:
        '.claude/settings.json 의 extraKnownMarketplaces 와 enabledPlugins 에 넣는다. 이 저장소도 같은 설정을 쓴다',
      context: 'consumer-repo',
      owner: 'berry-commit',
      status: 'implemented',
      source: [{ path: '.claude/settings.json', symbol: 'berry-commit@berrypjh' }],
      commands: [],
      tests: [],
      docs: ['berry-commit-readme'],
      next: ['start'],
    },
    {
      id: 'start',
      intent: 'MCP 서버가 뜬다',
      behavior:
        'Claude Code 가 .mcp.json 대로 커밋된 dist/index.js 를 node 로 띄우고 도구를 등록한다',
      context: 'claude-code',
      owner: 'berry-commit',
      status: 'implemented',
      source: [
        { path: 'plugins/berry-commit/.mcp.json', symbol: 'dist/index.js' },
        { path: 'plugins/berry-commit/src/index.ts', symbol: 'registerTool' },
      ],
      commands: [],
      tests: [],
      docs: ['berry-commit-readme'],
      next: ['commit'],
      gaps: [NO_TEST],
    },
    {
      id: 'commit',
      intent: 'scope 별로 커밋한다',
      behavior:
        '/berry-commit:commit-scope 가 staged scope 를 나누고 메시지를 제안한 뒤, 승인한 scope 만 commit_scope 로 커밋한다',
      context: 'claude-code',
      owner: 'berry-commit',
      status: 'implemented',
      source: [
        { path: 'plugins/berry-commit/skills/commit-scope/SKILL.md' },
        { path: 'plugins/berry-commit/src/index.ts', symbol: 'commit_scope' },
      ],
      commands: [],
      tests: [],
      docs: ['berry-commit-readme'],
      next: [],
      gaps: [NO_TEST],
    },
  ],
};
