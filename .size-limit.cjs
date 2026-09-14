// Tree-shaking·번들 사이즈 회귀 게이트.
// import 패턴별로 esbuild minify + brotli 사이즈를 잰다.
// 한도는 현재값 위 약 5% 여유로 둔다. 한도를 올린 이유는 커밋 메시지에 남긴다.
//
// 측정: pnpm run size (자세히: pnpm run size:why)
// CI: pr-check.yml 의 Bundle Size job

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
  // react-ui: 단일 심볼 케이스는 대부분 같은 값이 나온다.
  // 최상위 `Component.displayName = '...'` 할당은 번들러가 순수하다고 증명하지 못해서,
  // 무엇을 import 하든 해당 컴포넌트가 전부 남는다. 이 할당을 없애거나 감싸는 것은
  // 외부 소비자가 보는 속성을 바꾸는 breaking change 라 여기서는 값만 고정한다.
  reactUi('cx only', '{ cx }', '11 KB'),
  reactUi('Box only', '{ Box }', '11 KB'),
  // Stack 은 displayName 이 없어 위 바닥값 위에 자기 코드만 얹힌다. 실제로 구분되는 케이스다.
  reactUi('Stack only', '{ Stack }', '11 KB'),
  reactUi('Button only', '{ Button }', '11 KB'),
  reactUi('ThemeProvider only', '{ ThemeProvider }', '11 KB'),
  reactUi('themes registry only', '{ themes }', '11 KB'),
  reactUi('Web tokens (Light)', '{ Web }', '14 KB'),
  reactUi('* (full)', '*', '17 KB'),

  // react-native-ui: displayName 을 쓰지 않아 import 에 따라 값이 실제로 달라진다.
  // 그래서 공개 Button 계열(Button·IconButton·Fab)은 따로따로 검사한다. 내부용 ButtonBase 는 뺀다.
  // Input 계열은 RN 에서만 검사한다. Plain·Filled·Boxed 는 공유 InputBase 때문에 값이 같아서
  // PlainInput 하나만 둔다. TextField 는 합성 계층이라 값이 달라서 따로 둔다.
  reactNativeUi('themes registry only', '{ themes }', '3.7 KB'),
  reactNativeUi('getColor only', '{ getColor }', '4.1 KB'),
  reactNativeUi('Box only', '{ Box }', '5.1 KB'),
  reactNativeUi('Button only', '{ Button }', '5.6 KB'),
  reactNativeUi('IconButton only', '{ IconButton }', '5.0 KB'),
  reactNativeUi('Fab only', '{ Fab }', '5.3 KB'),
  reactNativeUi('ThemeProvider only', '{ ThemeProvider }', '3.8 KB'),
  reactNativeUi('Native tokens (Light)', '{ Native }', '3.7 KB'),
  reactNativeUi('PlainInput only', '{ PlainInput }', '6.2 KB'),
  reactNativeUi('TextField only', '{ TextField }', '7.5 KB'),
  reactNativeUi('* (full)', '*', '16.7 KB'),
];
