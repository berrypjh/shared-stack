import type { ConsumerJourney } from '../../domain/model';

/** 토큰 JSON 한 벌이 웹 CSS 와 RN 토큰 객체로 나가는 빌드. 웹과 RN 이 같은 단계에서 갈라진다. */
export const tokenPipeline: ConsumerJourney = {
  id: 'token-pipeline',
  title: '토큰 소스 → 웹 · RN 산출물',
  goal: 'DTCG 토큰 JSON 을 바꾸면 빌드가 CSS 변수 · Web/RN 토큰 · Tailwind preset · tokens.json 을 다시 만들고 두 UI 패키지가 싣는다',
  actor: 'maintainer',
  steps: [
    {
      id: 'edit',
      intent: '토큰 값을 바꾼다',
      behavior:
        'tokens/<theme>/<category>.json 을 고친다. light 가 풀세트이고 다른 테마는 덮어쓸 값만 둔다',
      context: 'workspace',
      owner: 'design-tokens',
      status: 'implemented',
      source: [
        { path: 'libs/design-tokens/tokens', directory: true },
        { path: 'libs/design-tokens/src/themes.ts' },
      ],
      commands: [],
      tests: [],
      docs: ['design-tokens-agents'],
      next: ['generate'],
    },
    {
      id: 'generate',
      intent: '토큰 산출물을 만든다',
      behavior:
        'Style Dictionary 파이프라인이 CSS 변수 · Web/RN TS 토큰 · Tailwind preset · tokens.json 을 만들고 대비 · 구조 테스트가 검사한다',
      context: 'workspace',
      owner: 'design-tokens',
      status: 'implemented',
      source: [
        { path: 'libs/design-tokens/src/build.ts' },
        { path: 'libs/design-tokens/src/lib/pipeline.ts', symbol: 'buildTokenOutputs' },
        { path: 'libs/design-tokens/src/lib/genCss.ts' },
        { path: 'libs/design-tokens/src/lib/genTsTokens.ts' },
        { path: 'libs/design-tokens/src/lib/genTailwind.ts' },
        { path: 'libs/design-tokens/src/lib/genCatalog.ts' },
      ],
      commands: ['design-tokens:build', 'design-tokens:test'],
      tests: ['design-tokens-vitest'],
      docs: ['design-tokens-agents'],
      next: ['facade'],
    },
    {
      id: 'facade',
      intent: '두 렌더러가 쓸 토큰을 한 곳에서 넘긴다',
      behavior:
        'ui-core 빌드가 CSS · tokens.json 을 복사하고 Web · Native 토큰 트리를 그대로 통과시킨다. 다시 만들지 않는다',
      context: 'workspace',
      owner: 'ui-core',
      status: 'implemented',
      source: [
        { path: 'libs/ui-core/project.json', symbol: 'variables.css' },
        { path: 'libs/ui-core/src/tokens/index.ts', symbol: 'Native, Web' },
      ],
      commands: ['ui-core:build'],
      tests: ['ui-core-vitest'],
      docs: ['ui-core-agents'],
      next: ['web', 'rn'],
    },
    {
      id: 'web',
      intent: '웹 패키지에 싣는다',
      behavior:
        'react-ui 빌드가 토큰 CSS 를 @layer theme 로 감싸 dist/index.css 앞에 붙이고 Tailwind preset · tokens.json 을 복사한다',
      context: 'workspace',
      owner: 'react-ui',
      status: 'implemented',
      source: [{ path: 'libs/react-ui/project.json', symbol: '@layer theme' }],
      commands: ['react-ui:build'],
      tests: ['published-package-boundary'],
      docs: ['react-ui-agents'],
      next: [],
    },
    {
      id: 'rn',
      intent: 'RN 패키지에 싣는다',
      behavior:
        'react-native-ui 빌드가 tokens.json 을 복사하고, Native 토큰 트리는 ui-core 를 거쳐 번들에 들어간다',
      context: 'workspace',
      owner: 'react-native-ui',
      status: 'implemented',
      source: [
        { path: 'libs/react-native-ui/project.json', symbol: 'libs/ui-core/dist/tokens.json' },
        { path: 'libs/react-native-ui/src/index.ts', symbol: 'Native' },
      ],
      commands: ['react-native-ui:build'],
      tests: ['published-package-boundary'],
      docs: ['react-native-ui-agents'],
      next: [],
    },
  ],
};
