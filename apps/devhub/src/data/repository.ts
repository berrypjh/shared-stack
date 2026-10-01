import type { Repository } from '../domain/model';

/**
 * 원격 주소는 플러그인 매니페스트, 기본 브랜치는 Nx 설정, 패키지 매니저는 워크스페이스 파일과 lockfile 이 근거다.
 */
export const repository: Repository = {
  id: 'shared-stack',
  owner: 'berrypjh',
  name: 'shared-stack',
  webUrl: 'https://github.com/berrypjh/shared-stack',
  defaultBranch: 'main',
  purpose: {
    text: '디자인 토큰 하나로 웹(React)과 모바일(React Native)에서 같은 UI를 만드는 컴포넌트 라이브러리.',
    source: { path: 'README.md' },
  },
  packageManager: 'pnpm',
  evidence: [
    { path: 'plugins/berry-commit/.claude-plugin/plugin.json' },
    { path: 'nx.json' },
    { path: 'pnpm-workspace.yaml' },
    { path: 'pnpm-lock.yaml' },
  ],
};
