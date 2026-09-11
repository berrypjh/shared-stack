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
  // react-ui — 단일 심볼 케이스가 서로 구분되지 않는다: `cx`(10줄 순수 함수)와 `TextField` 가
  // **바이트 단위로 같다** (raw 34,244 vs 34,245). 원인은 번들 구조가 아니라
  // **`Component.displayName = '...'` 최상위 할당 21개**다 — 속성 할당은 번들러가 순수하다고
  // 증명할 수 없어서 그 컴포넌트를 통째로 붙잡는다. 그래서 무엇을 import 하든 21개가 전부 남는다.
  //
  // 실측: 빌드된 `dist/index.esm.js` 에서 그 21줄만 지우고 `cx` 를 다시 번들하면
  // raw 34,245 → 1,150, gzip 10,697 → 481 (−97%). RN 은 `displayName` 을 쓰지 않아서
  // 단일 심볼이 단조 증가한다 (getColor 63KB → TextField 83KB).
  //
  // 고치려면 `displayName` 을 없애거나 `process.env.NODE_ENV` 로 감싸야 하는데, 둘 다 소비자가
  // 관찰하는 속성을 바꾸므로 **breaking public** 이다. 저장소 안에는 읽는 곳이 0 이지만
  // 외부 소비자 영향은 별도 판단이 필요해 여기서는 숫자만 고정한다.
  reactUi('cx only', '{ cx }', '11 KB'),
  reactUi('Box only', '{ Box }', '11 KB'),
  reactUi('Button only', '{ Button }', '11 KB'),
  reactUi('ThemeProvider only', '{ ThemeProvider }', '11 KB'),
  reactUi('themes registry only', '{ themes }', '11 KB'),
  // 13 KB -> 14 KB: 필드 컴포넌트 접근성 보강분이다. 측정으로 확인한 값 — 이 작업 직전 baseline
  // 12.84 KB, 이후 13.18 KB (+340 B brotli). 같은 증가가 모든 react-ui 케이스에 고르게 나타난다
  // (cx 9.85 -> 10.18, full 14.28 -> 14.6). 토큰이 아니라 위 displayName 때문에 무엇을 import 하든
  // 남는 컴포넌트 코드가 늘었다는 뜻이다 — SearchField 지우기 버튼·list-autocomplete combobox,
  // Select 의 aria-activedescendant 모델, TextField select 모드 onChange 전달. 전부 동작이다.
  // RN 케이스는 변화가 없다. 14 KB 는 현재값 위 약 6% 여유로 full 게이트와 같은 수준이다.
  reactUi('Web tokens (Light)', '{ Web }', '14 KB'),
  // 14 KB -> 15 KB: Popover 접근성 보강분이다. 측정으로 확인한 값 — 이 작업 직전 baseline
  // 13.97 KB, 이후 14.23 KB (+232 B brotli). 늘어난 것은 포커스 수명주기(닫힐 때 패널 안
  // 포커스를 트리거로 복원), Escape 범위 지정(중첩/형제에서 무관한 팝업을 닫지 않음),
  // dialog 진입 포커스, `semantics` 전달이다 — 전부 동작이라 줄일 군더더기가 없다.
  // `FOCUSABLE_SELECTOR` 를 문자열 리터럴로 합쳐 보기도 했으나 brotli 가 반복 패턴을 덜
  // 압축해 오히려 +7 B 라 되돌렸다.
  //
  // 기존 14 KB 는 baseline 대비 여유가 0.2% 뿐이라 어떤 기능 추가에도 걸렸다 — 이 파일
  // 머리말이 말하는 "baseline +20%" 와 맞지 않았다. 15 KB 는 현재값 위로 약 5% 여유로,
  // 다른 타이트한 게이트(Web tokens 13 KB vs 12.81)와 같은 수준을 유지한다.
  //
  // 15 KB -> 16 KB: 선택 컨트롤(Checkbox·Radio·RadioGroup) 추가분이다. 측정으로 확인한 값 —
  // Checkbox 직전 baseline 14.6 KB, Checkbox 뒤 14.8 KB, Radio·RadioGroup 뒤 15.18 KB
  // (+0.58 KB brotli). 새 컴포넌트는 displayName 을 두지 않아 단일 심볼 케이스는 그대로다
  // (cx 10.18 -> 10.15) — 늘어난 것은 전체 re-export 에 실리는 동작 코드뿐이다. 16 KB 는
  // 현재값 위 약 5% 여유로 기존 게이트와 같은 수준이다. 이어서 Switch 뒤 15.25 KB (+0.07 KB) —
  // 한도는 그대로 두었다.
  reactUi('* (full)', '*', '16 KB'),

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
