/**
 * react-native-ui 컴포넌트 테스트 러너.
 *
 * 다른 패키지는 Vitest + jsdom을 쓰지만 여기만 Jest입니다. RN 컴포넌트는 DOM이 아니라 RN
 * 호스트 트리로 렌더되고 `react-native`는 Flow 소스를 그대로 배포하기 때문입니다. RN이
 * 제공하는 `jest-preset.js`가 둘 다 처리합니다 (환경은 jsdom이 아닌 node 파생).
 */
const { dirname, resolve } = require('node:path');

// 워크스페이스에 react-native 사본이 둘 있습니다 (루트가 `0.81.5` 고정, 이 패키지의 peer
// `~0.81.5`가 `autoInstallPeers`로 `0.81.6`을 끌어옴). preset의 setup.js는 한쪽 사본의
// native module만 mock 하므로 섞이면 `__fbBatchedBridgeConfig is not set`으로 죽습니다.
// 근본 해결은 워크스페이스 버전을 하나로 맞추는 것입니다.
const reactNativeRoot = dirname(require.resolve('react-native/package.json'));

/** RN 소스는 Flow라 반드시 트랜스폼해야 합니다. preset은 이름만 주므로 경로로 고정합니다. */
const babelPreset = require.resolve('@react-native/babel-preset');

// design-tokens가 `export * as Native from ...`을 씁니다. RN preset에는 이 구문 플러그인이
// 없어서 CommonJS 변환 전에 따로 풀어 줘야 합니다.
const exportNamespaceFrom = require.resolve('@babel/plugin-transform-export-namespace-from');

module.exports = {
  displayName: '@berrypjh/react-native-ui',
  preset: 'react-native',
  rootDir: __dirname,
  testMatch: ['<rootDir>/src/**/*.test.tsx', '<rootDir>/src/**/*.test.ts'],

  transform: {
    // preset의 `babel-jest` 문자열을 대체합니다. babelrc 탐색을 끄고 preset을 직접 지정해야
    // `.pnpm` 안의 react-native 소스까지 같은 설정으로 트랜스폼됩니다.
    '^.+\\.[jt]sx?$': [
      'babel-jest',
      { babelrc: false, configFile: false, presets: [babelPreset], plugins: [exportNamespaceFrom] },
    ],
    '^.+\\.(bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp)$': require.resolve(
      'react-native/jest/assetFileTransformer.js',
    ),
  },

  // preset 기본값은 `node_modules/` 바로 다음 세그먼트가 RN 패키지일 때만 트랜스폼합니다.
  // pnpm은 `.pnpm/react-native@…/node_modules/react-native/`로 눕히므로 그 기본값이면 RN
  // 소스가 통째로 무시됩니다. 마지막 `node_modules/` 세그먼트를 보도록 고쳤습니다.
  transformIgnorePatterns: [
    'node_modules/(?!(?:.*/)?(?:(?:jest-)?react-native|@react-native(?:-community)?)/)',
  ],

  // dist/package.json이 소스 package.json과 haste 이름 충돌을 냅니다.
  modulePathIgnorePatterns: ['<rootDir>/dist/'],

  moduleNameMapper: {
    '^react-native$': reactNativeRoot,
    // 상대 경로로 잡습니다. `require.resolve('@berrypjh/ui-core/…')`를 쓰면 Nx가 이 라이브러리를
    // lazy-loaded로 보고 패키지 안의 모든 정적 import를 module-boundary 위반으로 만듭니다.
    '^@berrypjh/ui-core$': resolve(__dirname, '../ui-core/src/index.ts'),
  },
};
