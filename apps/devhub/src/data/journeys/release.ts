import type { ConsumerJourney } from '../../domain/model';

/** 공개 패키지 릴리스. main 은 정식, pre-release 는 베타다. */
export const release: ConsumerJourney = {
  id: 'release',
  title: '패키지 릴리스',
  goal: 'main 에 push 하면 CI 가 fixed 그룹의 버전을 올리고 changelog 를 쓴 뒤 GitHub Packages 로 배포한다',
  actor: 'maintainer',
  steps: [
    {
      id: 'push',
      intent: 'main(또는 pre-release)에 push 한다',
      behavior: 'release workflow 가 main 이면 정식, pre-release 면 베타 배포를 고른다',
      context: 'ci',
      owner: 'release-scripts',
      status: 'implemented',
      source: [{ path: '.github/workflows/release.yml', symbol: 'pre-release' }],
      commands: [],
      tests: [],
      docs: [],
      next: ['version'],
    },
    {
      id: 'version',
      intent: '버전을 정한다',
      behavior:
        '직전 tag 이후 BREAKING CHANGE 면 major, 릴리스 scope 의 feat 면 minor, 아니면 nx 의 conventional commits 계산을 따른다. 그룹은 fixed 다',
      context: 'ci',
      owner: 'release-scripts',
      status: 'implemented',
      source: [
        { path: 'tools/scripts/release/release-npm.ts', symbol: 'hasBreakingChangeSinceLastTag' },
        { path: 'tools/scripts/release/release-bump.ts', symbol: 'hasReleaseFeature' },
        { path: 'nx.json', symbol: 'projectsRelationship' },
      ],
      commands: ['script:release:npm', 'script:release:npm:beta'],
      tests: ['tools-vitest'],
      docs: [],
      next: ['changelog'],
    },
    {
      id: 'changelog',
      intent: '변경 기록을 남긴다',
      behavior: 'releaseChangelog 가 workspace changelog 와 GitHub release 를 만든다',
      context: 'ci',
      owner: 'release-scripts',
      status: 'implemented',
      source: [
        { path: 'tools/scripts/release/release-npm.ts', symbol: 'releaseChangelog' },
        { path: 'nx.json', symbol: 'createRelease' },
      ],
      commands: ['script:release:npm'],
      tests: [],
      docs: ['changelog'],
      next: ['publish'],
    },
    {
      id: 'publish',
      intent: '패키지를 배포한다',
      behavior:
        'releasePublish 가 npm.pkg.github.com 으로 배포한다. CI 의 RELEASE_TOKEN 이 인증이다',
      context: 'registry',
      owner: 'release-scripts',
      status: 'implemented',
      source: [
        { path: 'tools/scripts/release/release-npm.ts', symbol: 'releasePublish' },
        { path: '.github/workflows/release.yml', symbol: 'NODE_AUTH_TOKEN' },
      ],
      commands: ['script:release:npm'],
      tests: [],
      docs: [],
      next: [],
      gaps: [
        {
          kind: 'not-found',
          note: 'design-tokens · ui-core 는 release 그룹에 있지만 private 이다. 배포 단계가 이 둘을 어떻게 다루는지 저장소 안 근거로 확인하지 못했다',
          evidence: [
            { path: 'nx.json', symbol: '@berrypjh/design-tokens' },
            { path: 'libs/design-tokens/package.json', symbol: '"private": true' },
          ],
        },
      ],
    },
  ],
};
