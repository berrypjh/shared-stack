import type { Journey } from '../../domain/model';

/** Storybook 배포. react-ui 가 바뀌면 Storybook 을 빌드해 Chromatic 에 올린다. */
export const storybookPublish: Journey = {
  id: 'storybook-publish',
  kind: 'package',
  title: 'Storybook 배포',
  goal: 'react-ui 가 바뀐 PR 과 main push 마다 Storybook 을 빌드해 Chromatic 에 올림. 같은 브랜치의 이전 실행은 취소',
  steps: [
    {
      id: 'trigger',
      intent: 'react-ui 를 바꿔 PR 을 열거나 main 에 push 함',
      behavior: 'libs/react-ui 아래가 바뀐 경우에만 Chromatic workflow 가 돎',
      context: 'ci',
      owner: 'react-ui',
      status: 'implemented',
      source: [
        { path: '.github/workflows/chromatic.yml', symbol: 'libs/react-ui/**' },
        { path: '.github/workflows/chromatic.yml', symbol: 'cancel-in-progress: true' },
      ],
      tests: [],
      docs: [],
      next: ['build'],
    },
    {
      id: 'build',
      intent: 'Storybook 을 빌드함',
      behavior: '웹 라이브러리만 build 한 뒤 react-ui Storybook 을 정적 파일로 빌드',
      context: 'ci',
      owner: 'react-ui',
      status: 'implemented',
      commands: ['pnpm build:libs:web', 'pnpm build-storybook'],
      source: [
        { path: '.github/workflows/chromatic.yml', symbol: 'pnpm run build:libs:web' },
        { path: '.github/workflows/chromatic.yml', symbol: 'pnpm run build-storybook' },
      ],
      tests: [],
      docs: [],
      next: ['upload'],
    },
    {
      id: 'upload',
      intent: 'Chromatic 에 올림',
      behavior: 'chromaui/action 이 storybook-static 을 올림. 인증은 CHROMATIC_PROJECT_TOKEN',
      context: 'chromatic',
      owner: 'react-ui',
      status: 'implemented',
      source: [
        { path: '.github/workflows/chromatic.yml', symbol: 'chromaui/action' },
        { path: '.github/workflows/chromatic.yml', symbol: 'libs/react-ui/storybook-static' },
      ],
      tests: [],
      docs: [],
      next: [],
    },
  ],
};
