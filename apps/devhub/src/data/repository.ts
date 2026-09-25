import type { Repository } from '../domain/model';

/**
 * 원격 주소는 플러그인 매니페스트, 기본 브랜치는 Nx 설정, 패키지 매니저는 워크스페이스 파일과 lockfile 이 근거다.
 * pnpm 버전은 커밋된 파일 어디에도 없다 — 로컬 설치 기록(node_modules)은 저장소 사실이 아니다.
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
  gaps: [
    {
      kind: 'not-found',
      note: '루트 package.json 에 packageManager 가 없어 pnpm 버전이 고정되지 않는다. CI 는 저장소 밖 변수 vars.PNPM_VERSION 을 쓴다',
      evidence: [
        { path: 'package.json' },
        { path: '.github/workflows/pr-check.yml', symbol: 'vars.PNPM_VERSION' },
      ],
    },
  ],
};
