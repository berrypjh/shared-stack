import type { EvidenceGap, Package, PackageEntry } from '../domain/model';

/** `exports` 의 subpath 를 소비자 specifier 로. `.` 은 패키지 이름이다. */
const specifierOf = (packageName: string, subpath: string) =>
  subpath === '.' ? packageName : `${packageName}/${subpath.slice(2)}`;

/** 빌드가 `dist/` 에 만드는 진입점. 커밋되지 않는다. */
const built = (root: string, packageName: string, subpath: string, file: string): PackageEntry => ({
  specifier: specifierOf(packageName, subpath),
  target: `${root}/dist/${file}`,
  origin: 'build-output',
});

/** 저장소에 커밋된 파일을 그대로 가리키는 진입점. */
const committed = (root: string, specifier: string, file: string): PackageEntry => ({
  specifier,
  target: `${root}/${file}`,
  origin: 'committed',
});

const noTest = (root: string): EvidenceGap => ({
  kind: 'no-test',
  note: '테스트 파일도 test target 도 없다. 설정 파일만 배포한다',
  evidence: [{ path: `${root}/package.json` }, { path: `${root}/project.json` }],
});

/** 두 private 패키지는 소비자 문서(dist/AGENTS.md)가 없어 토큰 측정 시나리오가 실패한다고 적혀 있다. */
const measureFailure: EvidenceGap = {
  kind: 'known-failure',
  note: '토큰 측정 시나리오가 dist/AGENTS.md 를 읽는데 이 패키지는 그 파일을 만들지 않아 측정이 실패한다',
  evidence: [{ path: 'tools/scripts/measure-tokens/README.md' }],
};

const DT = 'libs/design-tokens';
const UC = 'libs/ui-core';
const RU = 'libs/react-ui';
const RN = 'libs/react-native-ui';
const OC = 'libs/observability-contracts';
const DU = 'libs/devhub-ui';

export const packages: Package[] = [
  {
    id: 'design-tokens',
    kind: 'foundation',
    packageName: '@berrypjh/design-tokens',
    visibility: 'internal',
    root: DT,
    packageManifest: { path: `${DT}/package.json` },
    nxProject: '@berrypjh/design-tokens',
    nxManifest: { path: `${DT}/project.json` },
    platform: 'platform-neutral',
    purpose:
      'DTCG 토큰 JSON 을 CSS 변수 · Web/RN 토큰 객체 · Tailwind preset · tokens.json 으로 변환한다',
    entries: [
      built(DT, '@berrypjh/design-tokens', '.', 'index.js'),
      built(DT, '@berrypjh/design-tokens', './web', 'web.js'),
      built(DT, '@berrypjh/design-tokens', './rn', 'rn.js'),
      built(DT, '@berrypjh/design-tokens', './css', 'css/variables.css'),
      built(DT, '@berrypjh/design-tokens', './tailwind', 'tailwind.js'),
      built(DT, '@berrypjh/design-tokens', './tokens', 'tokens.json'),
      committed(DT, '@berrypjh/design-tokens/package.json', 'package.json'),
    ],
    barrel: { path: `${DT}/src/index.ts` },
    surfaceGuard: { path: `${DT}/src/lib/packageSurface.test.ts` },
    commands: [
      'design-tokens:build',
      'design-tokens:typecheck',
      'design-tokens:test',
      'script:tokens:measure',
    ],
    docs: ['design-tokens-agents', 'design-tokens-readme'],
    source: [
      { path: `${DT}/src/build.ts` },
      { path: `${DT}/src/themes.ts` },
      { path: `${DT}/src/index.ts` },
      { path: `${DT}/tokens`, directory: true },
    ],
    gaps: [measureFailure],
  },
  {
    id: 'ui-core',
    kind: 'foundation',
    packageName: '@berrypjh/ui-core',
    visibility: 'internal',
    root: UC,
    packageManifest: { path: `${UC}/package.json` },
    nxProject: '@berrypjh/ui-core',
    nxManifest: { path: `${UC}/project.json` },
    platform: 'platform-neutral',
    purpose: 'react-ui 와 react-native-ui 가 공유하는 prop 계약과 design-tokens 토큰 facade',
    entries: [
      built(UC, '@berrypjh/ui-core', '.', 'index.js'),
      built(UC, '@berrypjh/ui-core', './css', 'css/index.css'),
      built(UC, '@berrypjh/ui-core', './tailwind', 'tailwind.js'),
      committed(UC, '@berrypjh/ui-core/package.json', 'package.json'),
    ],
    barrel: { path: `${UC}/src/index.ts` },
    surfaceGuard: { path: `${UC}/src/packageSurface.test.ts` },
    commands: ['ui-core:build', 'ui-core:typecheck', 'ui-core:test', 'script:ui-core:measure'],
    docs: ['ui-core-agents', 'ui-core-readme'],
    source: [{ path: `${UC}/src/index.ts` }, { path: `${UC}/src/contracts`, directory: true }],
    gaps: [measureFailure],
  },
  {
    id: 'react-ui',
    kind: 'ui',
    packageName: '@berrypjh/react-ui',
    visibility: 'public',
    root: RU,
    packageManifest: { path: `${RU}/package.json` },
    nxProject: '@berrypjh/react-ui',
    nxManifest: { path: `${RU}/project.json` },
    platform: 'web',
    purpose: 'React 웹 컴포넌트 라이브러리. ui-core 계약과 토큰을 번들에 실어 소비자에게 감춘다',
    entries: [
      built(RU, '@berrypjh/react-ui', '.', 'index.esm.js'),
      built(RU, '@berrypjh/react-ui', './styles.css', 'index.css'),
      built(RU, '@berrypjh/react-ui', './tailwind', 'tailwind.js'),
      built(RU, '@berrypjh/react-ui', './catalog', 'llm-catalog.json'),
      built(RU, '@berrypjh/react-ui', './tokens', 'tokens.json'),
      built(RU, '@berrypjh/react-ui', './agents', 'AGENTS.md'),
    ],
    barrel: { path: `${RU}/src/index.ts` },
    surfaceGuard: { path: 'tools/lib/package-boundary.test.ts' },
    commands: [
      'react-ui:build',
      'react-ui:typecheck',
      'react-ui:test',
      'script:storybook',
      'script:storybook:a11y',
      'script:size',
      'script:react-ui:measure',
    ],
    docs: ['react-ui-agents', 'react-ui-readme', 'react-ui-consumer-agents'],
    source: [{ path: `${RU}/src/index.ts` }, { path: `${RU}/src/styles.scss` }],
  },
  {
    id: 'react-native-ui',
    kind: 'ui',
    packageName: '@berrypjh/react-native-ui',
    visibility: 'public',
    root: RN,
    packageManifest: { path: `${RN}/package.json` },
    nxProject: '@berrypjh/react-native-ui',
    nxManifest: { path: `${RN}/project.json` },
    platform: 'react-native',
    purpose:
      'React Native 컴포넌트 라이브러리. ui-core 계약과 토큰을 번들에 실어 소비자에게 감춘다',
    entries: [
      committed(RN, '@berrypjh/react-native-ui/package.json', 'package.json'),
      built(RN, '@berrypjh/react-native-ui', '.', 'index.esm.js'),
      built(RN, '@berrypjh/react-native-ui', './catalog', 'llm-catalog.json'),
      built(RN, '@berrypjh/react-native-ui', './tokens', 'tokens.json'),
      built(RN, '@berrypjh/react-native-ui', './agents', 'AGENTS.md'),
    ],
    barrel: { path: `${RN}/src/index.ts` },
    surfaceGuard: { path: 'tools/lib/package-boundary.test.ts' },
    commands: [
      'react-native-ui:build',
      'react-native-ui:test',
      'script:size',
      'script:react-native-ui:measure',
    ],
    docs: ['react-native-ui-agents', 'react-native-ui-readme', 'react-native-ui-consumer-agents'],
    source: [{ path: `${RN}/src/index.ts` }],
    gaps: [
      {
        kind: 'doc-code-mismatch',
        note: '패키지 경계 테스트의 주석은 이 패키지에 test target 이 없다고 하지만 project.json 에는 jest test target 이 있다',
        evidence: [{ path: 'tools/lib/package-boundary.test.ts' }, { path: `${RN}/project.json` }],
      },
      {
        kind: 'unsupported',
        note: 'consumer eval 의 검증 단계는 RN 컴포넌트 테스트를 돌리지 못한다(unsupported)',
        evidence: [{ path: 'tools/evals/consumer/README.md' }],
      },
    ],
  },
  {
    id: 'devhub-ui',
    kind: 'ui',
    packageName: '@berrypjh/devhub-ui',
    visibility: 'public',
    root: DU,
    packageManifest: { path: `${DU}/package.json` },
    nxProject: '@berrypjh/devhub-ui',
    nxManifest: { path: `${DU}/project.json` },
    platform: 'web',
    purpose:
      '저장소마다 있는 DevHub 앱의 공용 화면(셸 · 그림 · markdown · 검색 · 테마). 카탈로그는 앱이 갖고 라우터는 DevHubProvider 로 받는다',
    entries: [
      built(DU, '@berrypjh/devhub-ui', '.', 'index.js'),
      built(DU, '@berrypjh/devhub-ui', './styles.css', 'styles.css'),
    ],
    barrel: { path: `${DU}/src/index.ts` },
    surfaceGuard: { path: 'tools/lib/package-boundary.test.ts' },
    commands: ['devhub-ui:build', 'devhub-ui:typecheck', 'devhub-ui:test'],
    docs: ['devhub-ui-agents', 'devhub-ui-readme'],
    source: [
      { path: `${DU}/src/index.ts` },
      { path: `${DU}/src/provider/devhub-provider.tsx`, symbol: 'DevHubProvider' },
    ],
  },
  {
    id: 'observability-contracts',
    kind: 'contract',
    packageName: '@berrypjh/observability-contracts',
    visibility: 'internal',
    root: OC,
    packageManifest: { path: `${OC}/package.json` },
    nxProject: '@berrypjh/observability-contracts',
    nxManifest: { path: `${OC}/project.json` },
    platform: 'platform-neutral',
    purpose:
      'quality-lab 수집기(Node)와 화면(브라우저)이 같은 zod schema 로 산출물을 검증하게 한다',
    entries: [built(OC, '@berrypjh/observability-contracts', '.', 'index.js')],
    barrel: { path: `${OC}/src/index.ts` },
    commands: [
      'observability-contracts:build',
      'observability-contracts:typecheck',
      'observability-contracts:test',
    ],
    docs: ['observability-contracts-agents'],
    source: [{ path: `${OC}/src/index.ts` }],
  },
  {
    id: 'eslint-config',
    kind: 'config',
    packageName: '@berrypjh/eslint-config',
    visibility: 'public',
    root: 'libs/eslint-config',
    packageManifest: { path: 'libs/eslint-config/package.json' },
    nxProject: '@berrypjh/eslint-config',
    nxManifest: { path: 'libs/eslint-config/project.json' },
    platform: 'node',
    purpose: '공유 ESLint flat config (base · nx · react)',
    entries: [
      committed('libs/eslint-config', '@berrypjh/eslint-config/base', 'base.mjs'),
      committed('libs/eslint-config', '@berrypjh/eslint-config/nx', 'nx.mjs'),
      committed('libs/eslint-config', '@berrypjh/eslint-config/react', 'react.mjs'),
    ],
    commands: [],
    docs: ['eslint-config-readme'],
    source: [{ path: 'libs/eslint-config/base.mjs' }],
    gaps: [noTest('libs/eslint-config')],
  },
  {
    id: 'prettier-config',
    kind: 'config',
    packageName: '@berrypjh/prettier-config',
    visibility: 'public',
    root: 'libs/prettier-config',
    packageManifest: { path: 'libs/prettier-config/package.json' },
    nxProject: '@berrypjh/prettier-config',
    nxManifest: { path: 'libs/prettier-config/project.json' },
    platform: 'node',
    purpose: '공유 Prettier 설정',
    entries: [committed('libs/prettier-config', '@berrypjh/prettier-config', 'index.js')],
    commands: [],
    docs: ['prettier-config-readme'],
    source: [{ path: 'libs/prettier-config/index.js' }],
    gaps: [noTest('libs/prettier-config')],
  },
  {
    id: 'tsconfig',
    kind: 'config',
    packageName: '@berrypjh/tsconfig',
    visibility: 'public',
    root: 'libs/tsconfig',
    packageManifest: { path: 'libs/tsconfig/package.json' },
    nxProject: '@berrypjh/tsconfig',
    nxManifest: { path: 'libs/tsconfig/project.json' },
    platform: 'node',
    purpose: '공유 TypeScript 설정 (base · library · next)',
    entries: [
      committed('libs/tsconfig', '@berrypjh/tsconfig/base.json', 'base.json'),
      committed('libs/tsconfig', '@berrypjh/tsconfig/next.json', 'next.json'),
      committed('libs/tsconfig', '@berrypjh/tsconfig/library.json', 'library.json'),
    ],
    commands: [],
    docs: ['tsconfig-readme'],
    source: [{ path: 'libs/tsconfig/base.json' }],
    gaps: [noTest('libs/tsconfig')],
  },
  {
    id: 'commitlint-config',
    kind: 'config',
    packageName: '@berrypjh/commitlint-config',
    visibility: 'public',
    root: 'libs/commitlint-config',
    packageManifest: { path: 'libs/commitlint-config/package.json' },
    nxProject: '@berrypjh/commitlint-config',
    nxManifest: { path: 'libs/commitlint-config/project.json' },
    platform: 'node',
    purpose: '공유 commitlint 설정 (Conventional Commits)',
    entries: [committed('libs/commitlint-config', '@berrypjh/commitlint-config', 'index.js')],
    commands: [],
    docs: ['commitlint-config-readme'],
    source: [{ path: 'libs/commitlint-config/index.js' }],
    gaps: [noTest('libs/commitlint-config')],
  },
];
