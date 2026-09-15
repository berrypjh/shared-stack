/**
 * react-native-ui 컴포넌트 테스트 러너.
 *
 * 다른 패키지는 Vitest + jsdom을 쓰지만 여기만 Jest입니다. RN 컴포넌트는 DOM이 아니라 RN
 * 호스트 트리로 렌더되고 `react-native`는 Flow 소스를 그대로 배포하기 때문입니다.
 * `@react-native/jest-preset`이 둘 다 처리합니다 (환경은 jsdom이 아닌 node 파생). RN 0.85부터
 * preset은 `react-native` 밖의 이 패키지로 옮겨졌습니다.
 */
const { resolve } = require('node:path');

/** RN 소스는 Flow라 반드시 트랜스폼해야 합니다. preset은 이름만 주므로 경로로 고정합니다. */
const babelPreset = require.resolve('@react-native/babel-preset');

// design-tokens가 `export * as Native from ...`을 씁니다. RN preset에는 이 구문 플러그인이
// 없어서 CommonJS 변환 전에 따로 풀어 줘야 합니다.
const exportNamespaceFrom = require.resolve('@babel/plugin-transform-export-namespace-from');

module.exports = {
  displayName: '@berrypjh/react-native-ui',
  preset: '@react-native/jest-preset',
  rootDir: __dirname,
  testMatch: ['<rootDir>/src/**/*.test.tsx', '<rootDir>/src/**/*.test.ts'],

  // 파일의 첫 render 가 react-native 모듈 로딩·트랜스폼을 떠안습니다. transform 캐시가 없는
  // CI 에서 다른 task 와 병렬로 돌면 기본 5초를 넘깁니다 (로컬 cold 1.1초, warm 0.1초).
  testTimeout: 15000,

  transform: {
    // preset의 `babel-jest` 문자열을 대체합니다. babelrc 탐색을 끄고 preset을 직접 지정해야
    // `.pnpm` 안의 react-native 소스까지 같은 설정으로 트랜스폼됩니다.
    '^.+\\.[jt]sx?$': [
      'babel-jest',
      { babelrc: false, configFile: false, presets: [babelPreset], plugins: [exportNamespaceFrom] },
    ],
    '^.+\\.(bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp)$': require.resolve(
      '@react-native/jest-preset/jest/assetFileTransformer.js',
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

  // `react-native`는 매핑하지 않습니다. preset이 자기가 mock 하는 사본으로 `react-native`와
  // 하위 경로를 함께 매핑합니다. 여기서 다른 사본을 가리키면 mock 되지 않은 사본이 로드되어
  // `__fbBatchedBridgeConfig is not set`으로 죽습니다 (pnpm이 peer 조합별로 사본을 따로 깝니다).
  moduleNameMapper: {
    // 상대 경로로 잡습니다. `require.resolve('@berrypjh/ui-core/…')`를 쓰면 Nx가 이 라이브러리를
    // lazy-loaded로 보고 패키지 안의 모든 정적 import를 module-boundary 위반으로 만듭니다.
    '^@berrypjh/ui-core$': resolve(__dirname, '../ui-core/src/index.ts'),
  },
};
