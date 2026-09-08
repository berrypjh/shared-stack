const { withNxMetro } = require('@nx/expo');
const { getDefaultConfig } = require('@expo/metro-config');
const { mergeConfig } = require('metro-config');

const defaultConfig = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = defaultConfig.resolver;

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const customConfig = {
  cacheVersion: '@berrypjh/demo-mobile',
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    assetExts: assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...sourceExts, 'cjs', 'mjs', 'svg'],
  },
};

const nxConfig = withNxMetro(mergeConfig(defaultConfig, customConfig), {
  // Change this to true to see debugging info.
  // Useful if you have issues resolving modules
  debug: false,
  // all the file extensions used for imports other than 'ts', 'tsx', 'js', 'jsx', 'json'
  extensions: [],
  // Specify folders to watch, in addition to Nx defaults (workspace libraries and node_modules)
  watchFolders: [],
});

// `withNxMetro` 는 projectRoot 를 워크스페이스 루트로 바꾼다. 그러면 app.json 의 상대 자산
// 경로(`./assets/images/...`)가 루트에서 해석되어 ENOENT 가 나고, babel 의 root 도 루트가 되어
// 이 앱의 `.babelrc.js`(babel-preset-expo)가 적용되지 않는다 — 그 결과 dev 번들에서
// RN preset 의 jsx-self 가 붙어 `Duplicate __self` 로 깨진다.
// 워크스페이스 라이브러리 해석에 필요한 watchFolders/nodeModulesPaths 는 그대로 두고
// projectRoot 만 이 앱으로 되돌린다.
nxConfig.projectRoot = __dirname;

// 워크스페이스에 `react-native` 사본이 둘 있다 — 루트가 `0.81.5` 를 정확히 고정하고,
// `libs/react-native-ui` 의 peer `~0.81.5` 를 pnpm 이 `autoInstallPeers` 로 채우면서
// `0.81.6` 을 그 패키지 안에 따로 깐다. 둘 다 번들되면 네이티브 view config 가 한 사본에만
// 등록되어 `AndroidProgressBar`(ActivityIndicator) 같은 컴포넌트가
// "View config getter callback ... must be a function" 으로 터진다.
// RN 런타임은 반드시 하나여야 하므로 앱이 쓰는 사본으로 고정한다.
const resolveFromApp = { originModulePath: __filename };
const upstreamResolveRequest = nxConfig.resolver?.resolveRequest;

nxConfig.resolver = {
  ...nxConfig.resolver,
  resolveRequest: (context, moduleName, platform) => {
    const pinned =
      moduleName === 'react-native' || moduleName.startsWith('react-native/')
        ? { ...context, ...resolveFromApp }
        : context;

    return upstreamResolveRequest
      ? upstreamResolveRequest(pinned, moduleName, platform)
      : pinned.resolveRequest(pinned, moduleName, platform);
  },
};

module.exports = nxConfig;
