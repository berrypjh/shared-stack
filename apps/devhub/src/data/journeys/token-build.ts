import type { Journey } from '../../domain/model';

/** 디자인 토큰 빌드. 테마별 토큰 JSON 하나에서 웹 · RN · Tailwind 산출물을 만든다. */
export const tokenBuild: Journey = {
  id: 'token-build',
  kind: 'package',
  title: '디자인 토큰 빌드',
  goal: '테마별 토큰 JSON 하나에서 CSS 변수 · TS 토큰(Web · Native) · Tailwind preset · tokens.json 을 만들고, 모든 테마가 WCAG AA 대비를 지키는지 검사함',
  steps: [
    {
      id: 'edit',
      intent: '토큰을 고침',
      behavior:
        'tokens/<테마>/*.json 을 DTCG 로 씀. light 만 전체 키를 갖고 다른 테마는 값만 덮어씀',
      context: 'workspace',
      owner: 'design-tokens',
      status: 'implemented',
      actor: '이 저장소의 개발자 · 에이전트',
      source: [{ path: 'libs/design-tokens/tokens', directory: true }],
      tests: [],
      docs: ['design-tokens-agents'],
      next: ['dictionary'],
    },
    {
      id: 'dictionary',
      intent: '테마별 사전을 만듦',
      behavior: 'Style Dictionary 로 테마마다 토큰 사전을 빌드',
      context: 'workspace',
      owner: 'design-tokens',
      status: 'implemented',
      commands: ['pnpm tokens:gen', 'pnpm tokens:watch'],
      source: [
        { path: 'package.json', symbol: 'tokens:gen' },
        { path: 'libs/design-tokens/src/build.ts', symbol: 'buildTokenOutputs' },
        { path: 'libs/design-tokens/src/lib/sd.ts', symbol: 'buildThemeDictionaries' },
      ],
      tests: ['design-tokens-vitest'],
      docs: [],
      next: ['outputs'],
    },
    {
      id: 'outputs',
      intent: '플랫폼별 산출물을 씀',
      behavior:
        '--ds-* CSS 변수 · Web · Native TS 토큰 · Tailwind preset · tokens.json 을 한 번에 씀',
      context: 'workspace',
      owner: 'design-tokens',
      status: 'implemented',
      source: [
        { path: 'libs/design-tokens/src/lib/genCss.ts', symbol: 'writeCss' },
        { path: 'libs/design-tokens/src/lib/genTsTokens.ts', symbol: 'writeTsTokens' },
        { path: 'libs/design-tokens/src/lib/genTailwind.ts', symbol: 'writeTailwindPreset' },
        { path: 'libs/design-tokens/src/lib/genCatalog.ts', symbol: 'writeTokensJson' },
      ],
      tests: ['design-tokens-vitest'],
      docs: [],
      next: ['compile'],
    },
    {
      id: 'compile',
      intent: '패키지를 빌드함',
      behavior:
        'build 가 토큰 생성 뒤 tsc 로 dist 를 만듦. 소비자는 react-ui · react-native-ui 를 거쳐 받음',
      context: 'workspace',
      owner: 'design-tokens',
      status: 'implemented',
      commands: ['pnpm tokens:build'],
      source: [
        { path: 'package.json', symbol: 'tokens:build' },
        {
          path: 'libs/design-tokens/project.json',
          symbol: '"dependsOn": ["build:tokens", "build:ts"]',
        },
      ],
      tests: [],
      docs: [],
      next: ['verify'],
    },
    {
      id: 'verify',
      intent: '대비와 공개 표면을 검사함',
      behavior:
        '모든 테마 기본값의 WCAG AA 대비, 공개 subpath 와 private 배포 설정을 테스트가 확인',
      context: 'workspace',
      owner: 'design-tokens',
      status: 'implemented',
      commands: ['pnpm nx test @berrypjh/design-tokens'],
      source: [
        { path: 'libs/design-tokens/src/lib/contrast.test.ts', symbol: 'BELOW_AA' },
        { path: 'libs/design-tokens/src/lib/packageSurface.test.ts', symbol: 'public subpaths' },
      ],
      tests: ['design-tokens-vitest'],
      docs: ['design-tokens-readme'],
      next: [],
    },
  ],
};
