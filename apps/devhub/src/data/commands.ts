import type { CommandConstraint, CommandGroupId, CommandRef, ConstraintRef } from '../domain/model';

/**
 * 저장소의 실행 가능한 명령 전부: 루트 `package.json` 의 script 와 `project.json` 에 적힌 Nx target.
 * 추론 target(lint · storybook 등)은 따로 넣지 않는다 — 그것을 부르는 script 로 보인다.
 * DevHub 는 명령을 실행하지 않는다. 조건마다 그것을 말하는 파일을 달고, 테스트가 경로 · 글자 · 완결성을 대조한다.
 */

const at = (kind: CommandConstraint, path: string, symbol: string): ConstraintRef => ({
  kind,
  evidence: { path, symbol },
});

const PORT = {
  demoWeb: at('port-binding', 'apps/demo-web/vite.config.mts', 'port: 4200'),
  demoMobile: at('port-binding', 'apps/demo-mobile/project.json', 'expo start'),
  qualityLab: at('port-binding', 'apps/quality-lab/vite.config.mts', 'port: 4300'),
  devhub: at('port-binding', 'apps/devhub/vite.config.mts', 'port: 4400'),
  storybook: at('port-binding', 'nx.json', '"serveStorybookTargetName": "storybook"'),
  registry: at('port-binding', 'package.json', '"port": 4873'),
};
const BUILT = {
  size: at('build-output', '.size-limit.cjs', 'libs/react-ui/dist/index.esm.js'),
  treeshake: at('build-output', 'tools/scripts/treeshake/check.ts', '선행 build 결손'),
  catalog: at(
    'build-output',
    'tools/scripts/generate-consumer-catalog/index.ts',
    'declaration 생성 이후에 실행되어야 한다',
  ),
  lookup: at('build-output', 'tools/consumer-retrieval/repo-source.ts', 'build the package first'),
  storybook: at('build-output', 'package.json', 'http-server libs/react-ui/storybook-static'),
  harness: at(
    'build-output',
    '.github/workflows/pr-check.yml',
    'Build libs (declarations + generated catalog)',
  ),
  collect: at('build-output', 'apps/quality-lab/README.md', '이미 있는 `dist`'),
};
const BROWSER = {
  e2e: at(
    'browser-binaries',
    'apps/quality-lab-e2e/playwright.config.ts',
    "devices['Desktop Chrome']",
  ),
  a11y: at('browser-binaries', '.github/workflows/pr-check.yml', 'Install Playwright Chromium'),
  quality: at('browser-binaries', 'apps/quality-lab/README.md', 'Playwright chromium + axe'),
};
const EXECUTOR = at(
  'external-executor',
  'tools/evals/consumer/runner/executor.ts',
  'no live executor is configured',
);
const API_KEY = at('optional-api-key', 'tools/scripts/measure-tokens/all.ts', 'ANTHROPIC_API_KEY');
const RELEASE = [
  at('registry-credentials', '.github/workflows/release.yml', 'NODE_AUTH_TOKEN'),
  at('repository-writes', 'nx.json', '"createRelease": "github"'),
];

/** `project.json` 의 Nx target. ID 는 `<디렉터리>:<target>`. */
const nx = (
  dir: string,
  target: string,
  group: CommandGroupId,
  purpose: string,
  constraints: ConstraintRef[] = [],
  project = `@berrypjh/${dir}`,
): CommandRef => ({
  id: `${dir}:${target}`,
  source: { kind: 'nx-target', project, target },
  group,
  purpose,
  constraints,
});

/** 루트 `package.json` 의 script. ID 는 `script:<이름>`. */
const script = (
  name: string,
  group: CommandGroupId,
  purpose: string,
  constraints: ConstraintRef[] = [],
): CommandRef => ({
  id: `script:${name}`,
  source: { kind: 'package-script', script: name },
  group,
  purpose,
  constraints,
});

export const commands: CommandRef[] = [
  // 빌드
  script('build', 'build', '모든 프로젝트의 build target 을 돌린다'),
  script(
    'build:libs',
    'build',
    '네 UI 계층 라이브러리(토큰 · ui-core · react-ui · react-native-ui)를 빌드한다',
  ),
  script('build:libs:web', 'build', '웹 계층 라이브러리(토큰 · ui-core · react-ui)만 빌드한다'),
  script('build:apps', 'build', '데모 앱 둘(demo-web · demo-mobile)을 빌드한다'),
  nx('ui-core', 'build', 'build', '계약 · 토큰 facade 를 번들하고 design-tokens 산출물을 복사한다'),
  nx('ui-core', 'build-js', 'build', 'Vite 라이브러리 모드로 JS 를 번들한다'),
  nx('react-ui', 'build', 'build', 'JS · 타입 · 소비자 카탈로그 · CLI 를 차례로 dist 에 만든다'),
  nx(
    'react-ui',
    'build-js',
    'build',
    'JS 번들 뒤 CSS 를 만들고 ui-core 토큰 · Tailwind preset 을 dist 로 옮긴다',
  ),
  nx('react-ui', 'bundle-js', 'build', 'rollup 으로 모듈당 한 파일 JS 를 만든다'),
  nx('react-ui', 'build-types', 'build', '공개 타입을 한 선언 파일로 묶는다'),
  nx(
    'react-native-ui',
    'build',
    'build',
    'JS · 타입 · 토큰 · 소비자 카탈로그 · CLI 를 dist 에 만든다',
  ),
  nx('react-native-ui', 'bundle-js', 'build', 'rollup 으로 JS 를 번들한다'),
  nx('react-native-ui', 'build-types', 'build', '공개 타입을 한 선언 파일로 묶는다'),
  nx(
    'observability-contracts',
    'build',
    'build',
    'zod 계약을 dist 로 만든다 — 도구와 앱이 dist 를 읽는다',
  ),
  nx('demo-web', 'build', 'build', '앱을 빌드한다'),
  nx('demo-mobile', 'build', 'build', 'expo export 로 번들을 만든다'),
  nx('quality-lab', 'build', 'build', '앱을 빌드한다'),
  nx('devhub', 'build', 'build', '앱을 빌드한다 — git 스냅샷과 문서 원문을 이때 묶는다'),
  nx(
    'devhub-ui',
    'build',
    'build',
    'tsc 로 dist 를 내고 styles.css 를 복사한다 — 모듈당 파일 하나',
  ),

  // 검사
  script('test', 'verify', '모든 프로젝트의 test target 을 돌린다'),
  script(
    'test:ci',
    'verify',
    'test 를 ci 설정으로 돌린다 — ci 설정이 없는 target 은 기본 설정으로 돈다',
  ),
  script('test:watch', 'verify', 'test 를 감시 모드로 돌린다', [
    at('watch-mode', 'package.json', 'nx run-many -t test --watch'),
  ]),
  script('typecheck', 'verify', '모든 프로젝트의 typecheck target 을 돌린다'),
  script('lint', 'verify', '모든 프로젝트의 lint target(ESLint plugin 이 만든다)을 돌린다'),
  script('lint:fix', 'verify', 'lint 를 돌리며 고칠 수 있는 것을 고친다'),
  script('format', 'verify', 'Prettier 로 파일을 고쳐 쓴다'),
  script('format:check', 'verify', 'Prettier 형식을 검사만 한다'),
  script(
    'tools:check',
    'verify',
    'tools/ 의 타입 검사와 테스트를 돌린다 — Nx 프로젝트가 아니라 affected 가 닿지 않는다',
    [BUILT.harness],
  ),
  nx('design-tokens', 'typecheck', 'verify', '생성된 선언과 테스트의 타입을 검사한다'),
  nx('design-tokens', 'test', 'verify', '빌드 뒤 토큰 · 대비 · 패키지 표면을 검사한다'),
  nx('ui-core', 'typecheck', 'verify', 'lib 선언을 만든 뒤 spec 의 타입 계약을 검사한다'),
  nx('ui-core', 'test', 'verify', '빌드 뒤 경계 · parity · 패키지 표면을 검사한다'),
  nx('react-ui', 'typecheck', 'verify', 'lib · Storybook · spec 세 tsconfig 를 차례로 검사한다'),
  nx('react-ui', 'test', 'verify', 'jsdom 에서 컴포넌트 테스트를 돌린다'),
  nx(
    'react-native-ui',
    'test',
    'verify',
    'RN preset 의 jest 로 컴포넌트 테스트를 돌린다(ci 설정은 jest --ci)',
  ),
  nx('observability-contracts', 'typecheck', 'verify', 'lib · spec 타입을 검사한다'),
  nx('observability-contracts', 'test', 'verify', 'schema 테스트를 돌린다'),
  nx('demo-web', 'typecheck', 'verify', '앱 타입을 검사한다'),
  nx('demo-web', 'test', 'verify', '라우트 스모크 · 정보 구조 · 검증 로직을 테스트한다'),
  nx('demo-mobile', 'typecheck', 'verify', '앱 타입을 검사한다'),
  nx('quality-lab', 'typecheck', 'verify', 'app · spec 타입을 검사한다'),
  nx('quality-lab', 'test', 'verify', '화면 · 데이터 · 경계를 테스트한다'),
  nx('quality-lab-e2e', 'typecheck', 'verify', 'e2e 코드의 타입을 검사한다'),
  nx('quality-lab-e2e', 'e2e', 'verify', 'quality-lab 개발 서버를 띄워 실제 브라우저로 검사한다', [
    PORT.qualityLab,
    BROWSER.e2e,
  ]),
  nx('devhub-e2e', 'typecheck', 'verify', 'e2e 코드의 타입을 검사한다'),
  nx('devhub-e2e', 'e2e', 'verify', 'devhub 개발 서버를 띄워 실제 브라우저로 검사한다', [
    PORT.devhub,
    at('browser-binaries', 'apps/devhub-e2e/playwright.config.ts', "devices['Desktop Chrome']"),
  ]),
  nx('devhub', 'typecheck', 'verify', 'app · spec 타입을 검사한다'),
  nx('devhub-ui', 'typecheck', 'verify', 'lib · spec 타입을 검사한다'),
  nx('devhub-ui', 'test', 'verify', '그림 계산 · markdown · 검색 순위 · 단축키를 테스트한다'),
  nx('devhub', 'test', 'verify', '셸 · 카탈로그 무결성 · 흐름 · 문서를 테스트한다'),

  // 토큰
  script('tokens:build', 'tokens', 'design-tokens 를 빌드한다(토큰 생성 + 선언)'),
  script('tokens:gen', 'tokens', '토큰 산출물만 다시 만든다'),
  script('tokens:watch', 'tokens', '토큰 소스가 바뀔 때마다 산출물을 다시 만든다', [
    at('watch-mode', 'package.json', 'nx watch --projects=@berrypjh/design-tokens'),
  ]),
  script('tokens:clean', 'tokens', 'design-tokens 의 dist · 생성 소스 · tsbuildinfo 를 지운다', [
    at('deletes-files', 'package.json', 'rm -rf libs/design-tokens/dist'),
  ]),
  nx('design-tokens', 'build', 'tokens', '토큰 생성과 선언 빌드를 묶는다(실행은 둘에 맡긴다)'),
  nx(
    'design-tokens',
    'build:tokens',
    'tokens',
    '토큰 JSON 에서 CSS · Web/RN 토큰 · Tailwind preset · tokens.json 을 만든다',
  ),
  nx('design-tokens', 'build:ts', 'tokens', '생성된 TS 를 선언과 함께 컴파일한다'),

  // Storybook · 접근성
  script('storybook', 'storybook', 'react-ui Storybook 개발 서버를 띄운다', [PORT.storybook]),
  script('build-storybook', 'storybook', 'react-ui 정적 Storybook 을 만든다'),
  script('storybook:a11y', 'storybook', '정적 Storybook 을 띄워 axe(WCAG 2 AA)로 검사한다', [
    BUILT.storybook,
    at('port-binding', 'package.json', 'storybook-static -p 6006'),
    BROWSER.a11y,
  ]),

  // 번들 크기 · 트리셰이킹
  script('size', 'bundle', '라이브러리 번들 크기를 size-limit 한도와 비교한다', [BUILT.size]),
  script('size:why', 'bundle', 'size-limit 결과의 구성을 풀어 보인다', [BUILT.size]),
  script('treeshake', 'bundle', '심볼 하나만 import 했을 때의 번들 크기를 전체와 비교한다', [
    BUILT.treeshake,
  ]),

  // 소비자 카탈로그 · 조회
  script('catalog:gen', 'consumer-catalog', '빌드된 선언에서 소비자 API 카탈로그를 다시 만든다', [
    BUILT.catalog,
  ]),
  nx(
    'react-ui',
    'generate-catalog',
    'consumer-catalog',
    'react-ui 빌드의 한 단계로 소비자 카탈로그를 만든다',
  ),
  script('ui:lookup', 'consumer-retrieval', '플랫폼 · 패키지 · 심볼 · 토큰을 좁혀 조회한다', [
    BUILT.lookup,
  ]),
  nx('react-ui', 'build-cli', 'consumer-retrieval', '패키지에 싣는 조회 CLI(cli.mjs)를 번들한다'),

  // 소비자 평가
  script(
    'eval:consumer:smoke',
    'consumer-eval',
    '고정 입력으로 harness 를 확인한다 — 모델 호출 없음',
  ),
  script(
    'eval:consumer:routing',
    'consumer-eval',
    '결정적 플랫폼 라우팅 confusion matrix 를 계산한다 — executor 없음',
  ),
  script(
    'eval:consumer:context',
    'consumer-eval',
    'variant 별 초기 컨텍스트 토큰을 잰다 — executor 없음',
  ),
  script(
    'eval:consumer:dev',
    'consumer-eval',
    'dev split 을 채점한다 — executor 가 없으면 trace replay 로만 돈다',
    [EXECUTOR],
  ),
  script(
    'eval:consumer:test',
    'consumer-eval',
    'held-out split 을 채점한다 — executor 가 없으면 trace replay 로만 돈다',
    [EXECUTOR],
  ),

  // 입력 토큰 측정
  script('tokens:measure', 'measurement', 'design-tokens 분석 입력 토큰 수를 시나리오별로 잰다', [
    API_KEY,
  ]),
  script('ui-core:measure', 'measurement', 'ui-core 분석 입력 토큰 수를 잰다', [API_KEY]),
  script('react-ui:measure', 'measurement', 'react-ui 분석 입력 토큰 수를 잰다', [API_KEY]),
  script('react-native-ui:measure', 'measurement', 'react-native-ui 분석 입력 토큰 수를 잰다', [
    API_KEY,
  ]),

  // 품질 관측
  script(
    'quality:collect',
    'observability',
    '품질 결과를 수집해 store 에 쓴다(프로필에 따라 비용이 다르다)',
    [at('long-running', 'apps/quality-lab/README.md', '명령당 15분 제한'), BUILT.collect],
  ),
  script(
    'quality',
    'observability',
    '떠 있는 quality-lab 을 axe 로 검사해 접근성 run 을 쓰고 export 한다',
    [
      at(
        'running-server',
        'tools/scripts/observability/quality.ts',
        '--base-url=http://localhost:4300',
      ),
      BROWSER.quality,
    ],
  ),
  script('quality:export', 'observability', '수집한 run 을 quality-lab public 으로 export 한다'),
  script('quality:lab', 'observability', 'quality-lab 개발 서버를 띄운다', [PORT.qualityLab]),

  // 릴리스
  script('local-registry', 'release', '로컬 verdaccio registry 를 띄운다', [PORT.registry]),
  script('release:local', 'release', '로컬 registry 로 버전 · 배포를 시험한다(커밋하지 않는다)', [
    at(
      'local-registry',
      'tools/scripts/release/release-local.ts',
      'Run "pnpm local-registry" in another terminal first.',
    ),
  ]),
  script('release:npm', 'release', 'GitHub Packages 로 정식 배포한다', RELEASE),
  script('release:npm:beta', 'release', 'GitHub Packages 로 베타 배포한다', RELEASE),
  script(
    'release:npm:first-release',
    'release',
    '첫 배포 — 직전 release tag 없이 버전을 정한다',
    RELEASE,
  ),

  // 플러그인
  script('build:mcp:commit', 'plugin', 'berry-commit 의 MCP 서버를 빌드한다'),
  nx(
    'berry-commit',
    'build',
    'plugin',
    '타입 검사 뒤 MCP 서버를 dist/index.js 한 파일로 번들한다',
    [],
    'commit-mcp',
  ),
  nx('berry-commit', 'typecheck', 'plugin', 'MCP 서버 타입을 검사한다', [], 'commit-mcp'),

  // 개발 서버
  script('start', 'dev-server', 'demo-web 개발 서버를 띄운다', [PORT.demoWeb]),
  script('start:mobile', 'dev-server', 'demo-mobile Expo 개발 서버를 띄운다', [PORT.demoMobile]),
  script('devhub', 'dev-server', 'devhub 개발 서버를 띄운다', [PORT.devhub]),
  nx('demo-web', 'serve', 'dev-server', '개발 서버를 띄운다', [PORT.demoWeb]),
  nx('demo-mobile', 'start', 'dev-server', 'Expo 개발 서버를 띄운다', [PORT.demoMobile]),
  nx('quality-lab', 'serve', 'dev-server', '개발 서버를 띄운다', [PORT.qualityLab]),
  nx('devhub', 'serve', 'dev-server', '개발 서버를 띄운다', [PORT.devhub]),

  // 작업 공간
  script('prepare', 'workspace', 'install 뒤 husky git hook 을 설치한다'),
  script('reset', 'workspace', 'Nx 캐시와 daemon 을 초기화한다'),
];

/** 카탈로그에 넣지 않은 명시 target. 사람이 부르는 명령이 아니다 — 이유가 테스트와 화면에 남는다. */
export const unlistedTargets: { project: string; target: string; reason: string }[] = [
  'commitlint-config',
  'eslint-config',
  'prettier-config',
  'tsconfig',
  'react-ui',
  'react-native-ui',
  'devhub-ui',
].map((dir) => ({
  project: `@berrypjh/${dir}`,
  target: 'nx-release-publish',
  reason: 'nx release 가 배포 단계에서 부르는 target 이다 — 직접 실행하지 않는다',
}));
