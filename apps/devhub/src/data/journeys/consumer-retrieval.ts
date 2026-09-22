import type { ConsumerJourney } from '../../domain/model';

/** 소비자 · 에이전트의 조회. 배포된 패키지 안의 CLI 와 저장소의 `pnpm ui:lookup` 은 같은 resolver 를 쓴다. */
export const consumerRetrieval: ConsumerJourney = {
  id: 'retrieval-lookup',
  title: '패키지에서 API · 토큰 찾기',
  goal: '설치된 패키지만으로, 네트워크 없이 플랫폼 → 패키지 → 심볼 → 토큰 순으로 좁혀 찾는다',
  actor: 'consumer',
  steps: [
    {
      id: 'bundle',
      intent: '조회 도구를 패키지에 싣는다',
      behavior:
        '빌드가 package-cli.ts 를 dist/cli.mjs 로 번들하고 llm-catalog.json · tokens.json 과 같은 dist 에 둔다. bin 으로 노출한다',
      context: 'workspace',
      owner: 'consumer-retrieval',
      status: 'implemented',
      source: [
        { path: 'libs/react-ui/project.json', symbol: 'build-cli' },
        { path: 'libs/react-ui/package.json', symbol: 'berry-react-ui' },
        { path: 'libs/react-native-ui/package.json', symbol: 'berry-react-native-ui' },
      ],
      commands: ['react-ui:build', 'react-native-ui:build'],
      tests: ['published-package-boundary'],
      docs: ['consumer-retrieval-readme'],
      next: ['lookup'],
    },
    {
      id: 'lookup',
      intent: '설치된 패키지에서 찾는다',
      behavior:
        'npx @berrypjh/react-ui summary · find · api · token 이 자기와 같은 dist 의 카탈로그 · 토큰 파일만 읽는다. node_modules 배치에 기대지 않는다',
      context: 'consumer-repo',
      owner: 'consumer-retrieval',
      status: 'implemented',
      source: [{ path: 'tools/consumer-retrieval/package-cli.ts', symbol: 'loadCatalog' }],
      commands: [],
      tests: ['tools-vitest'],
      docs: ['consumer-retrieval-readme', 'react-ui-readme', 'react-native-ui-readme'],
      next: ['fallback'],
    },
    {
      id: 'fallback',
      intent: '카탈로그로 안 되면 소스로 내려간다',
      behavior:
        '정확한 심볼 조회가 not-found 이거나 질문이 구현 · 디버깅일 때만 소스 조회를 허용한다',
      context: 'consumer-repo',
      owner: 'consumer-retrieval',
      status: 'implemented',
      source: [{ path: 'tools/consumer-retrieval/levels.ts', symbol: 'canUseSourceFallback' }],
      commands: [],
      tests: ['tools-vitest'],
      docs: ['consumer-retrieval-readme'],
      next: [],
    },
    {
      id: 'repo-lookup',
      intent: '이 저장소에서 같은 조회를 한다',
      behavior:
        'pnpm ui:lookup 이 같은 catalog · tokens resolver 로 플랫폼 · 심볼 · 토큰을 JSON 으로 낸다',
      context: 'workspace',
      owner: 'consumer-retrieval',
      status: 'implemented',
      source: [
        { path: 'tools/consumer-retrieval/cli.ts' },
        { path: 'tools/consumer-retrieval/catalog.ts' },
        { path: 'tools/consumer-retrieval/tokens.ts' },
      ],
      commands: ['script:ui:lookup'],
      tests: ['tools-vitest'],
      docs: ['consumer-retrieval-readme'],
      next: [],
    },
  ],
};
