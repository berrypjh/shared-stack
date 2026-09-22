import type { ExecutionContext } from '../../domain/model';

/** 흐름 단계가 도는 곳. 순서가 그림의 레인 순서다 — 소비자 쪽이 위, 저장소 · CI · registry 가 아래. */
export const contexts: ExecutionContext[] = [
  {
    id: 'consumer-web',
    name: '소비자 웹 앱',
    summary: '저장소 밖, @berrypjh/react-ui 를 설치한 React 앱',
  },
  {
    id: 'consumer-rn',
    name: '소비자 RN 앱',
    summary: '저장소 밖, @berrypjh/react-native-ui 를 설치한 React Native 앱',
  },
  {
    id: 'consumer-repo',
    name: '소비 저장소',
    summary: '패키지나 플러그인을 쓰는 다른 저장소의 터미널 · 설정',
  },
  {
    id: 'claude-code',
    name: 'Claude Code',
    summary: '플러그인의 skill 과 MCP 서버가 도는 곳',
  },
  { id: 'browser', name: '브라우저', summary: 'Vite 로 띄운 앱이 도는 곳' },
  {
    id: 'workspace',
    name: '이 저장소',
    summary: '이 저장소의 로컬 작업 공간 (Node · pnpm · Nx)',
  },
  { id: 'ci', name: 'GitHub Actions', summary: '.github/workflows 의 job' },
  { id: 'registry', name: 'GitHub Packages', summary: 'npm.pkg.github.com registry' },
];
