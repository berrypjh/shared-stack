import type { Journey } from '../../domain/model';

/** 소비자 카탈로그 생성. 패키지 build 의 마지막 단계로 공개 심볼 카탈로그를 dist 에 쓴다. */
export const consumerCatalog: Journey = {
  id: 'consumer-catalog',
  kind: 'package',
  title: '소비자 카탈로그 생성',
  goal: 'UI 패키지의 공개 심볼 · prop 계약을 빌드된 선언에서 뽑아 dist/llm-catalog.json 으로 배포함. 소비자 조회가 이 파일을 읽음',
  steps: [
    {
      id: 'build',
      intent: '패키지를 빌드함',
      behavior: '패키지 build 가 번들 선언을 만든 뒤 마지막 단계로 카탈로그 생성기를 부름',
      context: 'workspace',
      owner: 'react-ui',
      status: 'implemented',
      commands: ['pnpm build:libs'],
      source: [
        {
          path: 'libs/react-ui/project.json',
          symbol: 'generate-consumer-catalog/index.ts --target=react-ui',
        },
        {
          path: 'libs/react-native-ui/project.json',
          symbol: 'generate-consumer-catalog/index.ts --target=react-native-ui',
        },
      ],
      tests: [],
      docs: [],
      next: ['extract'],
    },
    {
      id: 'extract',
      intent: '공개 심볼을 뽑음',
      behavior:
        '번들 선언과 package.json exports 에서 공개 경로로 import 할 수 있는 심볼 · prop 만 뽑음',
      context: 'workspace',
      owner: 'consumer-catalog-generator',
      status: 'implemented',
      actor: '패키지 build · 이 저장소의 개발자',
      commands: ['pnpm catalog:gen', 'pnpm catalog:gen --target=react-ui'],
      source: [
        { path: 'tools/scripts/generate-consumer-catalog/extract.ts', symbol: 'extractSymbols' },
        { path: 'tools/scripts/generate-consumer-catalog/generate.ts', symbol: 'buildCatalog' },
      ],
      tests: ['tools-vitest'],
      docs: [],
      next: ['write'],
    },
    {
      id: 'write',
      intent: 'dist 에 카탈로그를 씀',
      behavior:
        'schema 로 검증해 결정적으로 직렬화하고, 토큰은 복사하지 않고 토큰 카탈로그를 가리킴',
      context: 'workspace',
      owner: 'consumer-catalog-generator',
      status: 'implemented',
      source: [
        { path: 'tools/scripts/generate-consumer-catalog/generate.ts', symbol: 'writeCatalog' },
        { path: 'tools/scripts/generate-consumer-catalog/schema.ts', symbol: 'serializeCatalog' },
        { path: 'libs/react-ui/package.json', symbol: '"./catalog"' },
      ],
      tests: ['tools-vitest'],
      docs: [],
      next: ['drift'],
    },
    {
      id: 'drift',
      intent: '카탈로그 drift 를 막음',
      behavior:
        'dist 는 커밋하지 않아 git diff 대신 테스트가 빌드 결과와 재생성 결과, 선언 · source barrel 과의 일치를 대조',
      context: 'workspace',
      owner: 'consumer-catalog-generator',
      status: 'implemented',
      source: [
        {
          path: 'tools/scripts/generate-consumer-catalog/catalog.test.ts',
          symbol: 'matches the catalog the package build wrote to dist',
        },
      ],
      tests: ['tools-vitest'],
      docs: [],
      next: [],
    },
  ],
};
