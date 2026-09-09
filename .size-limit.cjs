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
  // react-ui — 단일 bundle 구조라 베이스 ~9.3 KB가 항상 들어감.
  // 그래서 단일 심볼 케이스는 서로 구분되지 않는다 — 측정값이 9.36~9.41 KB 로 모인다
  // (ButtonBase 9.39 / IconButton 9.37 / Fab 9.40). Button 계열 형제를 더 넣어도
  // `* (full)` 이 더 좁은 여유로 이미 잡는 회귀만 중복 감시하므로 추가하지 않는다.
  reactUi('cx only', '{ cx }', '11 KB'),
  reactUi('Box only', '{ Box }', '11 KB'),
  reactUi('Button only', '{ Button }', '11 KB'),
  reactUi('ThemeProvider only', '{ ThemeProvider }', '11 KB'),
  reactUi('themes registry only', '{ themes }', '11 KB'),
  reactUi('Web tokens (Light)', '{ Web }', '13 KB'),
  reactUi('* (full)', '*', '14 KB'),

  // react-native-ui — 단일 import도 theme/styles 모듈 evaluate로 약 3 KB가 들어감.
  // 여기서는 선택 import가 실제로 갈린다(Button 4.59 / Fab 4.35 / IconButton 4.14 vs 전체 12.54)
  // 그래서 공개 Button 계열 3종을 개별로 건다. 내부 전용 ButtonBase 는 공개 API 가 아니라 넣지 않는다.
  //
  // Input 계열도 같은 이유로 RN 에만 건다. web 은 Input 심볼이 9.51~9.55 KB 로 모여
  // (InputBase 9.51 / PlainInput 9.53 / FilledInput 9.55 / TextField 9.51) 서로 구분되지 않고,
  // 여유가 더 좁은 `* (full)` 이 같은 회귀를 이미 잡는다.
  // Plain·Filled·Boxed 는 RN 에서도 셋 다 5.17 로 동일하다 — 공유 InputBase 가 거의 전부라
  // 하나만 걸어도 같은 회귀를 잡는다. 합성 계층은 값이 갈라져(TextField 6.29) 따로 건다.
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
  reactNativeUi('* (full)', '*', '15.1 KB'),
];
