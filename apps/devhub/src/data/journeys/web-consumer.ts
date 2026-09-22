import type { ConsumerJourney } from '../../domain/model';

/**
 * 웹 소비자. 설치는 저장소 밖이라 문서만 말한다. 나머지는 저장소 안 소비자(eval fixture · demo-web)가
 * 같은 공개 진입점으로 실제로 한다.
 */
export const webConsumer: ConsumerJourney = {
  id: 'web-consumer',
  title: '웹 앱에서 컴포넌트 쓰기',
  goal: 'React 웹 앱이 @berrypjh/react-ui 의 공개 진입점만으로 스타일 · 테마 · 컴포넌트를 쓴다',
  actor: 'consumer',
  platform: 'web',
  steps: [
    {
      id: 'install',
      intent: '패키지를 설치한다',
      behavior:
        '.npmrc 에 GitHub Packages registry 와 토큰을 두고 @berrypjh/react-ui 를 설치한다. peer 는 react · react-dom ^19',
      context: 'consumer-web',
      owner: 'react-ui',
      status: 'documented-only',
      source: [],
      commands: [],
      tests: [],
      docs: ['root-readme', 'react-ui-readme'],
      next: ['styles'],
    },
    {
      id: 'styles',
      intent: '전역 CSS 를 한 번 불러온다',
      behavior:
        '@berrypjh/react-ui/styles.css 를 앱 진입점에서 import 한다. 토큰 CSS 변수가 @layer theme 로 함께 온다',
      context: 'consumer-web',
      owner: 'react-ui',
      status: 'implemented',
      source: [
        { path: 'libs/react-ui/package.json', symbol: './styles.css' },
        {
          path: 'tools/evals/consumer/fixtures/web-basic/src/App.tsx',
          symbol: '@berrypjh/react-ui/styles.css',
        },
        { path: 'apps/demo-web/src/app/app.tsx', symbol: '@berrypjh/react-ui/styles.css' },
      ],
      commands: [],
      tests: ['published-package-boundary'],
      docs: ['react-ui-consumer-agents'],
      next: ['render'],
    },
    {
      id: 'render',
      intent: '테마 안에서 컴포넌트를 그린다',
      behavior:
        'ThemeProvider 로 data-theme 범위를 열고 @berrypjh/react-ui 에서 가져온 컴포넌트를 그린다',
      context: 'consumer-web',
      owner: 'react-ui',
      status: 'implemented',
      source: [
        { path: 'libs/react-ui/src/theme/ThemeProvider.tsx' },
        { path: 'libs/react-ui/src/index.ts' },
        { path: 'tools/evals/consumer/fixtures/web-basic/src/App.tsx', symbol: 'ThemeProvider' },
        { path: 'apps/demo-web/src/app/shell/AppShell.tsx', symbol: 'ThemeProvider' },
      ],
      commands: [],
      tests: ['react-ui-vitest'],
      docs: ['react-ui-consumer-agents'],
      next: ['tailwind'],
    },
    {
      id: 'tailwind',
      intent: '(선택) Tailwind 에서 같은 토큰을 쓴다',
      behavior:
        '@berrypjh/react-ui/tailwind preset 을 tailwind 설정의 presets 에 넣어 토큰 클래스를 쓴다',
      context: 'consumer-web',
      owner: 'react-ui',
      status: 'implemented',
      source: [
        { path: 'libs/react-ui/package.json', symbol: './tailwind' },
        { path: 'apps/demo-web/tailwind.config.js', symbol: '@berrypjh/react-ui/tailwind' },
      ],
      commands: [],
      tests: ['published-package-boundary'],
      docs: ['react-ui-consumer-agents'],
      next: [],
    },
  ],
};
