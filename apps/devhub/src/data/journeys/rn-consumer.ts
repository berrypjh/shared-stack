import type { ConsumerJourney } from '../../domain/model';

/**
 * React Native 소비자. 웹과 같은 것은 토큰 경로 어휘뿐이다(ui-core parity 테스트) — 컴포넌트 구현이
 * 같다고 말하지 않는다. 렌더러는 따로 구현된다.
 */
export const rnConsumer: ConsumerJourney = {
  id: 'rn-consumer',
  title: 'React Native 앱에서 컴포넌트 쓰기',
  goal: 'React Native 앱이 @berrypjh/react-native-ui 의 공개 진입점만으로 테마 · 토큰 · 컴포넌트를 쓴다',
  actor: 'consumer',
  platform: 'react-native',
  steps: [
    {
      id: 'install',
      intent: '패키지를 설치한다',
      behavior:
        '.npmrc 에 GitHub Packages registry 와 토큰을 두고 @berrypjh/react-native-ui 를 설치한다. peer 는 react ^19 · react-native ~0.85.3',
      context: 'consumer-rn',
      owner: 'react-native-ui',
      status: 'documented-only',
      source: [],
      commands: [],
      tests: [],
      docs: ['root-readme', 'react-native-ui-readme'],
      next: ['theme'],
    },
    {
      id: 'theme',
      intent: '테마를 고른다',
      behavior:
        'ThemeProvider 의 mode 로 테마별 RN 토큰 객체를 고른다. CSS cascade 가 없어 런타임에 토큰 객체를 context 로 준다',
      context: 'consumer-rn',
      owner: 'react-native-ui',
      status: 'implemented',
      source: [
        {
          path: 'libs/react-native-ui/src/theme/ThemeProvider.tsx',
          symbol: 'DEFAULT_TOKENS_BY_MODE',
        },
        {
          path: 'tools/evals/consumer/fixtures/react-native-basic/src/App.tsx',
          symbol: 'ThemeProvider',
        },
        { path: 'apps/demo-mobile/src/app/App.tsx', symbol: 'ThemeProvider' },
      ],
      commands: [],
      tests: ['react-native-ui-jest'],
      docs: ['react-native-ui-consumer-agents'],
      next: ['render'],
    },
    {
      id: 'render',
      intent: '토큰 이름으로 컴포넌트를 그린다',
      behavior:
        'Box 같은 컴포넌트가 bg · p · radius 의 토큰 경로를 getColor 와 Native 토큰으로 풀어 스타일을 만든다',
      context: 'consumer-rn',
      owner: 'react-native-ui',
      status: 'implemented',
      source: [
        { path: 'libs/react-native-ui/src/components/box/Box.tsx', symbol: 'getColor' },
        { path: 'libs/react-native-ui/src/index.ts' },
        { path: 'tools/evals/consumer/fixtures/react-native-basic/src/App.tsx', symbol: 'Box' },
      ],
      commands: [],
      tests: ['react-native-ui-jest'],
      docs: ['react-native-ui-consumer-agents'],
      next: ['vocabulary'],
    },
    {
      id: 'vocabulary',
      intent: '웹과 같은 토큰 이름을 쓴다',
      behavior:
        'Web 과 Native 토큰 트리의 경로 어휘가 같은지를 ui-core 의 parity 테스트가 검사한다. 같은 것은 토큰 경로이지 컴포넌트 구현이 아니다',
      context: 'workspace',
      owner: 'ui-core',
      status: 'implemented',
      source: [{ path: 'libs/ui-core/src/tokens/parity.test.ts', symbol: 'Native' }],
      commands: ['ui-core:test'],
      tests: ['ui-core-vitest'],
      docs: ['ui-core-agents'],
      next: [],
    },
  ],
};
