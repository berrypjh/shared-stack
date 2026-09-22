import type { ConsumerJourney } from '../../domain/model';

/**
 * 컴포넌트를 공개 export 로 내보내기. 웹 · RN 이 각자 시작해 같은 검증에서 만난다 —
 * 두 패키지는 따로 구현되고 따로 빌드된다.
 */
export const componentExport: ConsumerJourney = {
  id: 'component-export',
  title: '컴포넌트 → 공개 export',
  goal: '새 컴포넌트가 배럴 · 빌드 · 소비자 카탈로그를 거쳐 공개 진입점에 실리고 표면 테스트가 그것을 고정한다',
  actor: 'maintainer',
  steps: [
    {
      id: 'web-register',
      intent: '웹 컴포넌트를 등록한다',
      behavior:
        'components/<name>/ 을 만들고 components/index.ts 배럴과 styles.scss 의 @layer components 에 등록한다',
      context: 'workspace',
      owner: 'react-ui',
      status: 'implemented',
      source: [
        { path: 'libs/react-ui/src/components/index.ts' },
        { path: 'libs/react-ui/src/styles.scss', symbol: 'meta.load-css' },
        { path: 'libs/react-ui/src/index.ts', symbol: "export * from './components'" },
      ],
      commands: [],
      tests: ['react-ui-vitest'],
      docs: ['react-ui-agents'],
      next: ['web-build'],
    },
    {
      id: 'web-build',
      intent: '웹 패키지를 빌드한다',
      behavior:
        'rollup 이 JS 를, dts-bundle-generator 가 단일 d.ts 를 만들고 선언에서 llm-catalog.json 을 생성한다',
      context: 'workspace',
      owner: 'react-ui',
      status: 'implemented',
      source: [
        { path: 'libs/react-ui/project.json', symbol: 'generate-catalog' },
        { path: 'tools/scripts/generate-consumer-catalog/index.ts' },
      ],
      commands: ['react-ui:build'],
      tests: [],
      docs: ['react-ui-agents'],
      next: ['verify'],
    },
    {
      id: 'rn-register',
      intent: 'RN 컴포넌트를 등록한다',
      behavior:
        'components/<name>/index.ts 배럴이 공개 컴포넌트 표시다. components/index.ts 에 더한다. 내부 원시에는 배럴을 두지 않는다',
      context: 'workspace',
      owner: 'react-native-ui',
      status: 'implemented',
      source: [
        { path: 'libs/react-native-ui/src/components/index.ts' },
        { path: 'libs/react-native-ui/src/index.ts', symbol: "export * from './components'" },
      ],
      commands: [],
      tests: ['react-native-ui-jest'],
      docs: ['react-native-ui-agents'],
      next: ['rn-build'],
    },
    {
      id: 'rn-build',
      intent: 'RN 패키지를 빌드한다',
      behavior:
        'rollup · dts-bundle-generator 로 번들과 선언을 만들고 마지막 단계에서 llm-catalog.json 을 생성한다',
      context: 'workspace',
      owner: 'react-native-ui',
      status: 'implemented',
      source: [
        { path: 'libs/react-native-ui/project.json', symbol: 'generate-consumer-catalog' },
        { path: 'tools/scripts/generate-consumer-catalog/index.ts' },
      ],
      commands: ['react-native-ui:build'],
      tests: [],
      docs: ['react-native-ui-agents'],
      next: ['verify'],
    },
    {
      id: 'verify',
      intent: '공개 표면이 맞는지 확인한다',
      behavior:
        'exports map 과 빌드 산출물, 배럴과 카탈로그가 맞는지 테스트가 확인한다. dist 가 없으면 통과가 아니라 실패다',
      context: 'workspace',
      owner: 'tools-lib',
      status: 'implemented',
      source: [
        { path: 'tools/lib/package-boundary.test.ts' },
        { path: 'tools/scripts/generate-consumer-catalog/catalog.test.ts' },
      ],
      commands: ['script:tools:check'],
      tests: ['published-package-boundary', 'tools-vitest'],
      docs: ['consumer-eval-readme'],
      next: [],
    },
  ],
};
