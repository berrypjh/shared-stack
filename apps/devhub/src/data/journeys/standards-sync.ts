import type { Journey } from '../../domain/model';

/** 규칙 동기화. berry-dev standards 원본에서 이 저장소의 생성 rule 을 만들고 어긋남을 막는다. */
export const standardsSync: Journey = {
  id: 'standards-sync',
  kind: 'dev',
  title: '규칙 동기화',
  goal: 'berry-dev 의 공용 rule 원본 중 이 저장소가 고른 것을 .claude/rules/_generated 로 만들고, 커밋된 결과가 원본과 어긋나지 않게 함',
  steps: [
    {
      id: 'choose',
      intent: '적용할 rule 을 고름',
      behavior: 'standards.json 에서 core 밖 rule 과 적용 경로만 고름. 본문을 바꾸는 필드는 없음',
      context: 'workspace',
      owner: 'berry-dev',
      status: 'implemented',
      actor: '이 저장소의 개발자 · 에이전트',
      source: [
        { path: '.claude/standards.json' },
        { path: 'plugins/berry-dev/scripts/standards-core.mjs', symbol: 'validateConfig' },
        { path: 'plugins/berry-dev/standards/manifest.json' },
      ],
      tests: ['tools-vitest'],
      docs: ['berry-dev-readme'],
      next: ['sync'],
    },
    {
      id: 'sync',
      intent: '생성 rule 을 만듦',
      behavior:
        'harness:sync 가 _generated 에만 씀. 손으로 고친 파일 · 모르는 파일 · symlink 를 만나면 덮지 않고 멈춤',
      context: 'workspace',
      owner: 'berry-dev',
      status: 'implemented',
      commands: ['pnpm harness:sync'],
      source: [
        { path: 'package.json', symbol: 'harness:sync' },
        { path: 'plugins/berry-dev/scripts/standards-core.mjs', symbol: 'buildExpectedFiles' },
        { path: 'plugins/berry-dev/scripts/standards-fs.mjs', symbol: 'writeGenerated' },
      ],
      tests: ['tools-vitest'],
      docs: ['berry-dev-readme'],
      next: ['check'],
    },
    {
      id: 'check',
      intent: '원본과 같은지 확인함',
      behavior:
        'harness:check 가 다시 계산해 디스크와 비교하고 아무것도 쓰지 않음. 0 최신 · 1 drift · 2 오류',
      context: 'workspace',
      owner: 'berry-dev',
      status: 'implemented',
      commands: ['pnpm harness:check'],
      source: [
        { path: 'package.json', symbol: 'harness:check' },
        { path: 'plugins/berry-dev/scripts/standards.mjs', symbol: 'Exit codes: 0 ok, 1 drift' },
      ],
      tests: ['tools-vitest'],
      docs: ['berry-dev-readme'],
      next: ['ci'],
    },
    {
      id: 'ci',
      intent: 'PR 에서 어긋남을 막음',
      behavior: 'tools:check 의 테스트가 커밋된 생성 rule 을 원본 · 설정으로 다시 만든 결과와 대조',
      context: 'ci',
      owner: 'claude-harness',
      status: 'implemented',
      source: [
        { path: '.github/workflows/pr-check.yml', symbol: 'pnpm run tools:check' },
        {
          path: 'tools/scripts/claude-harness/committed-generated.test.ts',
          symbol: 'source · config 로 다시 만든 결과와 같다',
        },
      ],
      tests: ['tools-vitest'],
      docs: [],
      next: [],
    },
  ],
};
