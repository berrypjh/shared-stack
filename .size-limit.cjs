// Tree-shaking + bundle 사이즈 회귀 방지.
// 실제 production 번들러(esbuild)로 import 패턴별 minified+brotlied 사이즈 측정.
// limit은 baseline +20% 여유. 큰 회귀 발생 시 CI 차단 가능.
//
// 측정: pnpm run size
// 자세히: pnpm run size:why
// CI: GitHub Action `andresz1/size-limit-action` 또는 `pnpm run size`로 통합

const reactExternals = ['react', 'react-dom', 'react/jsx-runtime'];
const rnExternals = ['react', 'react-native', 'react/jsx-runtime'];

const reactUi = (name, importStr, limit) => ({
  name: `@berrypjh/react-ui — ${name}`,
  path: 'libs/react-ui/dist/index.esm.js',
  import: importStr,
  limit,
  ignore: reactExternals,
  modifyEsbuildConfig: (config) => ({ ...config, target: 'es2022' }),
});

const reactNativeUi = (name, importStr, limit) => ({
  name: `@berrypjh/react-native-ui — ${name}`,
  path: 'libs/react-native-ui/dist/index.esm.js',
  import: importStr,
  limit,
  ignore: rnExternals,
  modifyEsbuildConfig: (config) => ({ ...config, target: 'es2022' }),
});

module.exports = [
  // react-ui — 단일 bundle 구조라 베이스 ~9.3 KB가 항상 들어감
  reactUi('cx only', '{ cx }', '11 KB'),
  reactUi('Box only', '{ Box }', '11 KB'),
  reactUi('Button only', '{ Button }', '11 KB'),
  reactUi('ThemeProvider only', '{ ThemeProvider }', '11 KB'),
  reactUi('themes registry only', '{ themes }', '11 KB'),
  reactUi('Web tokens (Light)', '{ Web }', '13 KB'),
  reactUi('* (full)', '*', '14 KB'),

  // react-native-ui — 단일 import도 theme/styles 모듈 evaluate로 약 3 KB가 들어감.
  reactNativeUi('themes registry only', '{ themes }', '3.7 KB'),
  reactNativeUi('getColor only', '{ getColor }', '4.1 KB'),
  reactNativeUi('Box only', '{ Box }', '5.1 KB'),
  reactNativeUi('ThemeProvider only', '{ ThemeProvider }', '3.8 KB'),
  reactNativeUi('Native tokens (Light)', '{ Native }', '3.7 KB'),
  reactNativeUi('* (full)', '*', '15.1 KB'),
];
