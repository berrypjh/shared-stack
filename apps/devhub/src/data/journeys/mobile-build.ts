import type { Journey } from '../../domain/model';

/** 모바일 데모 빌드. 로컬 expo export 로 번들을 확인하고, 기기용 빌드는 EAS 에서 한다. */
export const mobileBuild: Journey = {
  id: 'mobile-build',
  kind: 'dev',
  title: '모바일 데모 빌드',
  goal: 'demo-mobile 을 로컬에서 expo export 로 번들까지 확인하고, 기기 · 시뮬레이터용 빌드는 EAS 에서 프로필별로 만듦',
  steps: [
    {
      id: 'export',
      intent: '로컬에서 번들을 확인함',
      behavior:
        'build 가 expo export 로 JS 번들을 만듦. 로컬 검증으로 쓸 수 있고, PR build 대상에서는 빠짐',
      context: 'workspace',
      owner: 'demo-mobile',
      status: 'implemented',
      actor: '이 저장소의 개발자 · 에이전트',
      commands: ['pnpm nx build @berrypjh/demo-mobile'],
      source: [
        { path: 'apps/demo-mobile/project.json', symbol: 'expo export' },
        { path: '.github/workflows/pr-check.yml', symbol: '--exclude=@berrypjh/demo-mobile' },
      ],
      tests: [],
      docs: ['demo-mobile-agents'],
      next: ['eas'],
    },
    {
      id: 'eas',
      intent: 'EAS 로 빌드함',
      behavior:
        'eas.json 의 development · preview · production 프로필로 빌드. 설치 뒤 post-install 이 워크스페이스 node_modules 를 이어 Nx 가 돌게 함',
      context: 'eas',
      owner: 'eas-build-post-install',
      status: 'implemented',
      actor: '이 저장소의 개발자',
      commands: ['eas build --profile preview --platform android'],
      source: [
        { path: 'apps/demo-mobile/eas.json', symbol: '"preview"' },
        { path: 'apps/demo-mobile/package.json', symbol: 'eas-build-post-install' },
        { path: 'tools/scripts/eas-build-post-install.mjs', symbol: 'symlink' },
      ],
      tests: [],
      docs: [],
      next: [],
    },
  ],
};
