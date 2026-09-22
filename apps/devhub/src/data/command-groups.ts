import type { CommandGroup } from '../domain/model';

/** 엔지니어링 화면의 명령 묶음. 순서가 화면 순서다. 결과 · 측정값은 담지 않는다. */
export const commandGroups: CommandGroup[] = [
  {
    id: 'build',
    title: '빌드',
    summary:
      '라이브러리 · 앱의 build target 과 그것을 묶는 script. 라이브러리 build 는 여러 하위 target 을 차례로 부른다',
    docs: ['root-agents'],
  },
  {
    id: 'verify',
    title: '테스트 · 타입 · lint',
    summary:
      'CI 는 affected 로 바뀐 프로젝트의 target 만 돌린다. tools/ 는 Nx 프로젝트가 아니라 tools:check 로 따로 돈다',
    docs: ['root-agents'],
  },
  {
    id: 'tokens',
    title: '디자인 토큰',
    summary: '토큰 JSON 에서 웹 · RN 산출물을 만든다. build 는 build:tokens → build:ts 순서다',
    docs: ['design-tokens-agents', 'design-tokens-readme'],
  },
  {
    id: 'storybook',
    title: 'Storybook · 접근성',
    summary:
      'react-ui 의 Storybook 과 그 위의 axe 검사. 접근성 검사는 정적 Storybook 을 먼저 만든다',
    docs: ['react-ui-agents'],
  },
  {
    id: 'bundle',
    title: '번들 크기 · 트리셰이킹',
    summary: '빌드된 dist 를 잰다. 한도는 .size-limit.cjs 에 있고, 측정값은 여기 싣지 않는다',
    docs: ['treeshake-readme'],
  },
  {
    id: 'consumer-catalog',
    title: '소비자 카탈로그',
    summary:
      '빌드된 선언과 package.json exports 에서 소비자 API 카탈로그를 만든다. 패키지 build 의 한 단계다',
    docs: ['react-ui-consumer-agents'],
  },
  {
    id: 'consumer-retrieval',
    title: '소비자 조회',
    summary:
      '플랫폼 → 패키지 → 심볼 → 토큰으로 좁히는 결정적 조회. 저장소 안 CLI 와 패키지에 싣는 CLI 가 있다',
    docs: ['consumer-retrieval-readme'],
  },
  {
    id: 'consumer-eval',
    title: '소비자 평가',
    summary:
      'smoke · routing · context 는 executor 없이 결정적으로 돈다. dev · test 채점은 모델을 부르는 executor 가 필요한데 아직 없어, trace replay 없이는 실행을 거부한다',
    docs: ['consumer-eval-readme'],
  },
  {
    id: 'measurement',
    title: '분석 입력 토큰 측정',
    summary:
      '라이브러리를 분석할 때 드는 입력 토큰 수를 시나리오별로 잰다. 로컬 tokenizer 는 늘 돌고, Anthropic 은 키가 있을 때만 부른다',
    docs: ['measure-tokens-readme'],
  },
  {
    id: 'observability',
    title: '품질 관측',
    summary:
      '수집 → export → quality-lab 이 보여 준다. 결과 화면과 metric 은 quality-lab 의 몫이고 여기서는 명령과 흐름만 말한다',
    docs: ['quality-lab-architecture', 'quality-lab-collectors'],
  },
  {
    id: 'release',
    title: '릴리스',
    summary:
      'nx release 로 버전 · changelog · 배포를 한다. DevHub 는 이 명령을 실행하지 않는다 — 조건과 부작용을 알릴 뿐이다',
    docs: ['changelog'],
  },
  {
    id: 'plugin',
    title: 'Claude Code 플러그인',
    summary:
      'berry-commit 의 MCP 서버. dist 는 커밋되는 산출물이라 src 를 바꾸면 다시 빌드해 함께 커밋한다',
    docs: ['berry-commit-readme'],
  },
  {
    id: 'dev-server',
    title: '개발 서버',
    summary: '앱 개발 서버. 포트를 열고 끝나지 않는다',
    docs: [],
  },
  {
    id: 'workspace',
    title: '작업 공간',
    summary: 'install 과 Nx 상태를 다루는 script',
    docs: [],
  },
];
