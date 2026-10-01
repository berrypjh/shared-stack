import type { ExecutionContext } from '../../domain/model';

/** 흐름 단계가 도는 곳. 순서가 그림의 레인 순서다. */
export const contexts: ExecutionContext[] = [
  {
    id: 'consumer-repo',
    name: '소비 저장소',
    summary: '저장소 밖, @berrypjh UI 패키지를 설치한 저장소의 터미널 · 에이전트',
  },
  {
    id: 'claude-code',
    name: 'Claude Code',
    summary: '플러그인의 skill 과 MCP 서버가 도는 세션',
  },
  {
    id: 'workspace',
    name: '이 저장소',
    summary: '이 저장소의 로컬 작업 공간 (Node · pnpm · Nx)',
  },
  { id: 'ci', name: 'GitHub Actions', summary: '.github/workflows 의 job' },
  { id: 'registry', name: 'GitHub Packages', summary: 'npm.pkg.github.com registry' },
  { id: 'eas', name: 'EAS', summary: '저장소 밖, Expo 가 앱을 빌드하는 서비스' },
  { id: 'chromatic', name: 'Chromatic', summary: '저장소 밖, Storybook 을 올려 보는 서비스' },
];
