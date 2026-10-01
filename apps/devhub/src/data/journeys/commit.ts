import type { Journey } from '../../domain/model';

/** 커밋. berry-commit 이 scope 별로 나눠 제안하고, 커밋 순간에 git hook 이 브랜치 · 파일 · 메시지를 검사한다. */
export const commit: Journey = {
  id: 'commit',
  kind: 'dev',
  title: '커밋',
  goal: 'staged 변경을 scope 별로 나눠 한국어 Conventional Commits 로 제안하고, 승인한 scope 만 커밋함. 커밋 순간에 브랜치 이름 · staged 파일 · 메시지를 검사',
  steps: [
    {
      id: 'scopes',
      intent: '커밋할 scope 를 나눔',
      behavior:
        'list_staged_scopes 가 staged 변경을 apps · libs · tools · plugins 의 이름과 root 로 묶음',
      context: 'claude-code',
      owner: 'berry-commit',
      status: 'implemented',
      actor: '이 저장소의 개발자 · 에이전트',
      commands: [
        '/berry-commit:commit-scope',
        '/berry-commit:commit-scope devhub',
        '/berry-commit:commit-scope react-ui major',
      ],
      source: [
        { path: 'plugins/berry-commit/skills/commit-scope/SKILL.md', symbol: 'list_staged_scopes' },
        { path: 'plugins/berry-commit/src/index.ts', symbol: "'list_staged_scopes'" },
      ],
      tests: [],
      docs: ['berry-commit-readme'],
      next: ['propose'],
    },
    {
      id: 'propose',
      intent: 'scope 마다 메시지를 제안함',
      behavior:
        'get_scope_details 로 diff 를 읽고 scope 별 한국어 Conventional Commits 메시지를 제안',
      context: 'claude-code',
      owner: 'berry-commit',
      status: 'implemented',
      source: [
        { path: 'plugins/berry-commit/src/index.ts', symbol: "'get_scope_details'" },
        {
          path: 'plugins/berry-commit/skills/commit-scope/examples/commit-message-rules.md',
        },
      ],
      tests: [],
      docs: ['berry-commit-readme'],
      next: ['commit'],
    },
    {
      id: 'commit',
      intent: '승인한 scope 만 커밋함',
      behavior:
        '사용자가 승인하면 commit_scope 가 그 scope 의 파일만 커밋. 여러 scope 는 하나씩 차례로',
      context: 'claude-code',
      owner: 'berry-commit',
      status: 'implemented',
      source: [
        { path: 'plugins/berry-commit/src/index.ts', symbol: "'commit_scope'" },
        {
          path: 'plugins/berry-commit/skills/commit-scope/SKILL.md',
          symbol: '반드시 사용자 승인 후에만',
        },
      ],
      tests: [],
      docs: ['berry-commit-readme'],
      next: ['pre-commit'],
    },
    {
      id: 'pre-commit',
      intent: '커밋 전에 검사함',
      behavior:
        'pre-commit 이 보호 브랜치 · 한글 · 대문자 브랜치 이름을 막고, lint-staged 가 staged 파일에 eslint --fix · prettier 를 적용',
      context: 'workspace',
      owner: 'shared-stack',
      status: 'implemented',
      source: [
        { path: '.husky/pre-commit', symbol: 'PROTECTED_REGEX' },
        { path: '.husky/pre-commit', symbol: 'lint-staged' },
        { path: 'package.json', symbol: '"lint-staged"' },
      ],
      tests: [],
      docs: [],
      next: ['commit-msg'],
    },
    {
      id: 'commit-msg',
      intent: '커밋 메시지를 검사함',
      behavior:
        'commitlint 가 type 목록과 feat!: 금지(major 는 BREAKING CHANGE footer) 규칙으로 검사',
      context: 'workspace',
      owner: 'commitlint-config',
      status: 'implemented',
      source: [
        { path: '.husky/commit-msg', symbol: 'commitlint' },
        { path: 'libs/commitlint-config/index.js', symbol: 'no-header-bang' },
        { path: 'libs/commitlint-config/index.js', symbol: 'type-enum' },
      ],
      tests: [],
      docs: ['commitlint-config-readme'],
      next: [],
    },
  ],
};
