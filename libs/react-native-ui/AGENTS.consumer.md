# @berrypjh/react-native-ui

React Native 모바일 UI 컴포넌트 라이브러리. 디자인 토큰 기반의 일관된 컴포넌트와 테마 시스템을 제공한다.

## TL;DR

```tsx
import { Box, ThemeProvider, useTheme, getColor } from '@berrypjh/react-native-ui';

function App() {
  return (
    <ThemeProvider mode="light">
      <Screen />
    </ThemeProvider>
  );
}

function Screen() {
  const theme = useTheme();
  return <Box p="md" bg="background.surface" radius="md" />;
}
```

## 찾는 순서

넓은 것부터 좁혀 들어간다. 위 단계로 해결되면 아래로 내려가지 않는다.

1. **플랫폼** — 어느 플랫폼 작업인가. 설치된 `@berrypjh` UI 패키지가 1차 근거이고,
   요구가 설치 상태와 어긋나면 추측하지 말고 되묻는다.
2. **패키지** — 웹은 `@berrypjh/react-ui`, React Native는 `@berrypjh/react-native-ui`.
   `@berrypjh/ui-core`와 `@berrypjh/design-tokens`는 private이다. 소비자가 직접 import하지 않는다 —
   필요한 토큰·유틸(`getColor`, `createTheme`, `themes`, `Web`, `Native`)은
   플랫폼 패키지가 전부 re-export한다.
3. **후보 심볼** — `llm-catalog.json`의 `symbols` 키를 훑어 후보를 좁힌다.
4. **정확한 API** — 그 심볼 하나의 항목만 읽는다 (`kind`, `importFrom`, `props`).
5. **토큰** — `tokens.json`에서 필요한 경로/접두사만 찾는다. 파일 전체를 컨텍스트에 넣지 않는다.
6. **번들 `.d.ts`** — 위로 부족할 때. DOM/RN 상속 prop이 필요하면 여기다.
7. **라이브러리 source** — 마지막 수단. 공개 API로 답이 안 나오는 구현·디버깅 질문에만.

| 단계                               | 읽을 것                   | 크기 감각              |
| ---------------------------------- | ------------------------- | ---------------------- |
| 사용 규칙 · 플랫폼 의미 · 함정     | 이 문서                   | 작음                   |
| 정확한 public export · 심볼 · prop | `llm-catalog.json`        | 중간                   |
| 정확한 토큰                        | `tokens.json` (표적 조회) | 조회는 작음, 전체는 큼 |
| 상속 prop 포함 전체 타입           | `dist/index.d.ts`         | 큼                     |
| 구현 세부                          | source                    | 큼                     |

필요한 부분만 뽑고 싶으면 패키지에 동봉된 CLI를 쓴다 — 파일 전체를 컨텍스트에 넣지 않아도 된다.

```bash
npx @berrypjh/react-native-ui find button      # 심볼 후보
npx @berrypjh/react-native-ui api Button       # 그 심볼의 prop 계약만
npx @berrypjh/react-native-ui token color.primary
```

`llm-catalog.json`은 빌드가 번들 declaration에서 생성한다. 이 문서는 심볼 목록을
중복 관리하지 않는다 — 정확한 개수·이름·prop은 항상 카탈로그가 정답이다.

## Export 경로

| 경로                        | 용도                         |
| --------------------------- | ---------------------------- |
| `@berrypjh/react-native-ui` | 모든 컴포넌트·테마·토큰·유틸 |

## Public 표면

### 컴포넌트

정확한 컴포넌트 목록과 prop은 `llm-catalog.json`의 `symbols`에서 읽는다 (`kind: "component"`).

| 컴포넌트         | 요약                                                                  |
| ---------------- | --------------------------------------------------------------------- |
| `Box`            | 토큰 기반 레이아웃 (padding·margin·background·radius)                 |
| `Button`         | 라벨 버튼. `variant`·`size`·`color`·`fullWidth`·`loading`·아이콘 슬롯 |
| `Fab`            | 플로팅 액션 버튼. `shape="circular" \| "extended"`                    |
| `IconButton`     | 아이콘 전용 버튼. `accessibilityLabel` **필수**                       |
| `PlainInput`     | 밑줄만 있는 텍스트 필드. `accessibilityLabel` **필수**                |
| `FilledInput`    | 채워진 표면 + 사방 테두리. `accessibilityLabel` **필수**              |
| `BoxedInput`     | 윤곽선만 있는 필드(표면 투명). `accessibilityLabel` **필수**          |
| `TextField`      | 라벨·입력·헬퍼 합성. 문자열 `label` 이 입력의 이름이 된다             |
| `SearchField`    | 검색 입력 + 지우기 + 제안 목록. `accessibilityLabel` **필수**         |
| `Select`         | 데이터 `options` 기반 단일 선택. `accessibilityLabel` **필수**        |
| `SegmentControl` | 상호배타 선택. **controlled 전용**                                    |

#### Button 계열 공통

- 누름 처리는 RN `Pressable` 이다 — `onPress`·`onLongPress`·`onPressIn/Out`·`hitSlop` 을 받는다.
  web 의 `onClick`·`href`·`component`·`className` 은 **없다**.
- `disabled` 는 누름을 막고 `accessibilityState.disabled` 로 알린다. 소비자가
  `accessibilityState` 로 뒤집을 수 없다.
- `loading` 은 평범한 boolean 이다 (web `IconButton` 의 `boolean | null` 3-상태를 옮기지 않았다).
  `true` 면 누름이 막히고 `busy` + `disabled` 를 함께 알리며 기본 `ActivityIndicator` 가 뜬다.
  `loadingIndicator` 로 교체할 수 있다.
- 아이콘 슬롯은 받은 노드를 **그대로** 렌더한다. `cloneElement` 로 색·크기를 주입하지 않는다.
  토큰 색이 필요하면 `IconButton` 의 `icon` 에 함수를 넘긴다:
  `icon={({ color, size }) => <MyIcon color={color} size={size} />}`.
- 모든 컨트롤은 시각 크기와 무관하게 최소 터치 타깃(48)을 지킨다. `Fab size="sm"` 의 원판은
  40 이지만 누를 수 있는 영역은 48 이다.

#### Input 계열 공통

세 variant 는 시각 표현만 다르고 동작·접근성 계약은 같다. 내부적으로 RN `TextInput` 하나를
래퍼 `View` 안에 두며, chrome(표면·테두리·radius)은 래퍼가 그린다.

- **값은 RN 네이티브 계약이다.** `value` 는 `string`(web 의 `number | readonly string[]` 없음),
  `defaultValue` 는 uncontrolled 초기값이다. 컴포넌트는 텍스트 상태를 들지 않는다 —
  `value` 를 주면 그 값이 그대로 유지되고, 안 주면 네이티브가 소유한다.
- **값 콜백은 `onChangeText(text: string)` 이다.** RN 네이티브 `onChange` 도 그대로 받지만
  그것은 RN 이벤트이지 DOM 이벤트가 아니다 — `event.target.value` 는 **없다**.
- **네이티브 TextInput prop 이 살아 있다**: `keyboardType`·`inputMode`·`secureTextEntry`·
  `autoComplete`·`maxLength`·`selectTextOnFocus`·`numberOfLines`·`placeholder` 등.
  카탈로그는 디자인 시스템 prop 만 싣는다(Button 의 `onPress` 도 없다) — 네이티브 표면은 여기다.
- **`ref` 는 `TextInput` 을 가리킨다.** 래퍼 View 가 아니라서 `focus()`·`blur()`·`isFocused()`
  를 바로 부를 수 있다.
- **`disabled` 와 `readOnly` 는 다르다.** 둘 다 편집을 막지만 `disabled` 만
  `accessibilityState.disabled` 로 알리고 disabled 토큰 색을 쓴다. `readOnly` 는 평범한 외형에
  비활성으로 알리지 않는다. `readOnly` 를 `TextInput` 에 직접 넘기지 않는다 — RN 이 그것으로
  `editable` 을 되계산해 우리가 만든 `disabled` 를 덮어쓰기 때문이다.
- **`multiline`** 은 네이티브 `TextInput` 그대로다. textarea 같은 별도 요소로 갈라지지 않고,
  윤곽선은 래퍼가 유지한다.
- **`startAdornment`/`endAdornment`** 는 받은 노드를 그대로 렌더한다(Button 아이콘 슬롯과 같은
  규약). 래퍼는 `accessible` 이 아니라서 상호작용 가능한 장식(예: `IconButton`)은 독립적으로
  접근·조작된다. 장식을 눌러도 입력에 자동으로 포커스가 가지 않는다.
- **`error` 는 시각 상태일 뿐이다.** 아래 "지금 없는 것" 을 볼 것.

#### Form 구조 (FormControl · InputLabel · FormHelperText)

`FormControl` 이 자손에게 내려보내는 값: `color`·`size`·`disabled`·`error`·`fullWidth`,
그리고 입력이 알려준 `focused`. 해석 순서는 언제나 **명시 prop → FormControl → 기본값** 이다.

- **focus 조정**: 입력의 `onFocus`/`onBlur` 가 FormControl 에 알리면 라벨과 테두리가 함께
  움직인다. `focused` prop 을 주면 소비자가 통제하고, `disabled` 는 그보다도 우선이다.
  web 처럼 루트에서 focus 를 버블링해 받지 않는다 — RN View 는 포커스를 버블링하지 않는다.
- **상속하지 않는 것**: `readOnly`·`multiline`·`autoFocus`·값·키보드 prop·장식.
  입력 하나하나의 관심사다.
- **`variant` 는 상속되지 않는다** — Plain/Filled/Boxed 가 각자 고정한다.
- **`margin`·`hiddenLabel` 은 없다** (web 폼 규약), **`filled`·`adornedStart` 도 없다**:
  web 에서조차 읽는 곳이 없어 옮기지 않았다.
- `InputLabel` 은 **정적**이다. 뜨거나(float) 줄어들지(shrink) 않고 애니메이션도 없다.
- `FormHelperText` 에는 `size` 가 없다 — web 의 `--size-sm`/`--size-md` 가 시각적으로 완전히
  같아서 아무 일도 하지 않을 prop 이기 때문이다.

#### ⚠️ 라벨·헬퍼의 접근성 한계 (중요)

**보이는 라벨은 입력의 접근 가능한 이름이 아니다.** RN 에는 교차 플랫폼 라벨 연결 수단이
없다 — `accessibilityLabelledBy`/`aria-labelledby` 는 **Android 전용**이다. 그래서:

```tsx
<FormControl>
  <InputLabel>이메일</InputLabel>
  <BoxedInput accessibilityLabel="이메일" /> {/* 이름은 여기서 온다 */}
  <FormHelperText>회사 주소만 됩니다</FormHelperText>
</FormControl>
```

`InputLabel` 을 썼다고 `accessibilityLabel` 을 빼면 안 된다. 라벨은 입력의
`accessibilityLabel` 을 건드리지 않는다. Android 한정으로 직접 연결하고 싶으면 라벨의
`nativeID` 와 입력의 `accessibilityLabelledBy` 를 소비자가 짝지어야 한다.

- **헬퍼는 입력의 설명이 아니다.** `aria-describedby` 에 해당하는 교차 플랫폼 수단이 없다.
- **오류는 자동으로 읽히지 않는다.** 헬퍼는 live region 이 아니다 — 모든 헬퍼를 live region
  으로 만들면 화면의 오류들이 서로를 덮어쓰고, `accessibilityLiveRegion` 은 Android 전용이라
  교차 플랫폼 답도 아니다. 정책이 필요하면 `accessibilityLiveRegion`·`accessibilityRole` 을
  직접 넘기거나 `AccessibilityInfo.announceForAccessibility` 를 쓴다(둘 다 그대로 전달된다).
- **`required` 는 시각 표시일 뿐이다.** 별표는 라벨 텍스트의 일부로 읽히고, RN
  `AccessibilityState` 에는 `required` 필드 자체가 없다. HTML 의 폼 검증도 없다.
- `FormControl` 루트는 접근성 집합체가 아니다 — 라벨·입력·헬퍼는 각각 조작된다.

#### TextField (합성 계층)

`FormControl` → `InputLabel` → Input → `FormHelperText` 를 한 번에 세운다. 값도 포커스도
chrome 도 소유하지 않는다 — 전부 합성 대상 것이다.

- **접근 가능한 이름을 보장한다.** 타입이 판별 유니온이라 둘 중 하나를 강제한다:
  문자열 `label` 을 주면 그것이 입력의 이름이 되고, `label` 이 ReactNode 이거나 없으면
  `accessibilityLabel` 이 **필수**다. `<TextField />` 와 `<TextField label={<Text>…</Text>} />`
  는 컴파일 오류다.
- **보이는 라벨과 말하는 이름은 다를 수 있다** — `label` 과 `accessibilityLabel` 을 함께 주면
  `accessibilityLabel` 이 이긴다.
- ReactNode 라벨에서 문자열을 뽑아내지 않고, placeholder 를 이름으로 쓰지 않는다.
- **헬퍼는 보이는 텍스트까지만 보장한다.** `aria-describedby` 에 해당하는 교차 플랫폼 수단이
  없어서 입력의 설명으로 자동 연결되지 않고, 자동 live region 도 아니며,
  `accessibilityHint` 로 옮기지도 않는다(hint 는 "동작의 결과"를 말하는 자리다).
- `label`·`helperText` 는 내용이 없으면(`null`·`undefined`·`''`) 아예 렌더하지 않는다.
- **`required` 는 시각 표시일 뿐이다** — 아래 라벨·헬퍼 한계 절과 같다.
- **`select` prop 이 없다.** web TextField 는 `select` 로 Select 로 갈아끼우지만 그 계약은
  `<option>` children 모델과 `htmlFor`·`aria-describedby` 연결 위에 서 있다. RN `Select` 는
  `options` 데이터를 받고 값 도메인·콜백·ref 대상이 다르다. `Select` 를 직접 쓴다.
- **`ref` 는 `TextInput` 을 가리킨다.** 루트 View 핸들은 노출하지 않는다.
- style 자리는 셋이다: `rootStyle`(FormControl 루트) · `containerStyle`(입력 래퍼) ·
  `style`(TextInput).
- 네이티브 `TextInput` prop 은 그대로 살아 있다 (`keyboardType`·`secureTextEntry`·
  `numberOfLines`·`maxLength` 등).

```tsx
<TextField label="이름" helperText="실명을 입력하세요" />
<TextField label="ID" accessibilityLabel="사용자 아이디" />
<TextField accessibilityLabel="검색어" placeholder="검색" />
```

#### SearchField

- **값 소유권은 Input 계열과 같다**: `value` 를 주면 소비자 것, 안 주면 `defaultValue` 로 시작해
  SearchField 가 가진다. 콜백은 `onChangeText(text: string)`.
  (Input 3종과 달리 내부 `TextInput` 은 항상 controlled 다 — 질의가 비었는지 알아야 지우기 버튼과
  선택 상태를 정할 수 있기 때문이다. 밖에서 본 계약은 동일하다.)
- **지우기 버튼은 `clearAccessibilityLabel` 을 줘야 생긴다.** 이것이 유일한 관문이다 —
  `clearable` boolean 도, 영어 기본값도 없다. 질의가 있고 편집 가능할 때만 보인다.
  누르면 `onChangeText('')` → `onClear()` 순서로 부른다. controlled 면 스스로 비우지 않는다.
- **후보는 소비자가 준다.** `suggestions` 는 이미 좁혀진 목록이고 **컴포넌트는 거르지 않는다**.
  질의로 필터링하거나 데이터를 가져오는 일은 소비자 몫이다.
- **제안 값 fallback**: `suggestion.value ?? suggestion.label`. 빈 문자열 `value` 는 의도된
  값으로 존중된다. 선택 상태는 저장하지 않고 현재 질의에서 파생한다.
- **목록 가시성**: 입력 focus 와 질의 변경이 연다. 선택·지우기·제출이 닫는다.
  **blur 는 닫지 않는다** — RN 에는 web 의 DOM 포커스 봉쇄(`relatedTarget`·`Node.contains`)가
  없어서, blur 로 닫으면 제안을 누르는 터치가 목록 언마운트와 경쟁한다. 대가로 다른 곳을 눌러
  키보드만 내려도 목록은 남는다.
- 선택 뒤 입력에 포커스를 되돌리지 않는다(키보드가 다시 올라오기 때문).
- **하드웨어 키보드 이동은 없다** — ArrowDown/Up·Escape·`aria-activedescendant` 는 DOM 포커스
  안무라 옮기지 않았다.
- **네이티브 역할·상태**: 입력은 `accessibilityRole="search"`, 제안 표면이 있을 때만
  `accessibilityState.expanded` 를 말한다. 제안 행은 `button` 역할 +
  `accessibilityState={{ selected, disabled }}` 다 — RN 은 `option` 역할을 네이티브 역할로
  **매핑하지 않는다**(Android `ReactAccessibilityDelegate` 의 role 스위치에 case 가 없다).
  `combobox` 로 승격하지 않는 이유도 같다: 행이 option 이 될 수 없어 반쪽 약속이 된다.
- `noSuggestionsText` 를 주지 않으면 빈 상자를 그리지 않는다. 빈 상태는 live region 이 아니다.
- `enterKeyHint`·`inputMode` 기본값은 `search` 다(소비자가 덮을 수 있다).
- `startAdornment`/`endAdornment` 는 **없다** — 뒤 슬롯은 지우기 버튼이 소유한다.

#### Select

- **옵션은 데이터다**: `options: readonly SelectOption<T>[]`. web 처럼 `<MenuItem>` children 을
  훑지 않는다. **RN 에 `MenuItem` 은 없다** — children-as-configuration 은 React 관용구이지
  옮겨갈 수 있는 교차 플랫폼 계약이 아니다.
- **값 도메인은 문자열**(`T extends string`)이고 **단일 선택**이다. `multiple` 은 없다.
  web 은 `unknown` + 참조 동일성까지 받지만 그것은 DOM 폼 값에서 온 넓힘이다.
  비어 있음은 `undefined` 다(web 의 `''` 은 옮기지 않았다).
- **값과 개폐는 독립 상태**다. controlled 판정은 각각 `value !== undefined`,
  `open !== undefined`. 값 콜백은 `onValueChange(next)` — web 의 `{target:{name,value}}` 합성
  이벤트는 HTML 폼 호환을 위한 것이라 옮기지 않았다. 개폐 콜백은 `onOpen()`/`onClose()` 다.
- 이미 선택된 값을 다시 골라도 닫히지만 `onValueChange` 는 부르지 않는다(web 과 같은 정책).
  비활성 선택지는 값도 못 바꾸고 목록도 닫지 못한다.
- **접근성**: 트리거 `combobox` + `accessibilityState.expanded`, 목록 `radiogroup`,
  선택지 `radio` + `accessibilityState.checked`. 설치된 RN 이 실제로 지원하는 역할만 쓴다.
  `accessibilityLabel` 은 **필수**다 — 형제 `InputLabel` 은 이름을 만들어 주지 않는다.
- **해제 경로**: 배경 탭 · Android 하드웨어 back(`onRequestClose`) · iOS 스크린리더
  escape(`onAccessibilityEscape`). `dismissAccessibilityLabel` 을 주면 배경이 이름 있는 해제
  버튼이 된다(기본 영어 문자열을 박지 않는다).
- 메커니즘은 **코어 RN `Modal`** 이다. picker·bottom-sheet·portal·애니메이션 의존성을 더하지
  않았다.
- `renderValue` 는 트리거 표시를 통째로 대체하고 다른 표시 규칙보다 우선한다. 임의의 노드를
  문자열로 만들지 않으므로 이름은 `accessibilityLabel` 이 준다.

#### SegmentControl

- **controlled 전용이다.** `value` 가 선택 상태의 유일한 권한이고 내부 상태가 없다 —
  누른다고 스스로 바뀌지 않으니 `onChange` 를 반드시 처리해야 한다.
  `defaultValue` 는 없다.
- 옵션 모델: `{ value: T; label: ReactNode; accessibilityLabel?: string; disabled?: boolean }`.
  web 의 per-option `className` 은 없다.
- 세그먼트는 **`button` 역할 + `accessibilityState.selected`** 다. 상호배타라는 이유만으로
  radio/tab 으로 바꾸지 않는다 — 폼 radio 도, 화면을 전환하는 tab 도 아니다. RN
  `togglebutton` 역할도 쓰지 않는다(켜짐/꺼짐 하나를 말하는 역할이다).
- **이름**: 문자열 라벨이면 보이는 텍스트가 그대로 이름이 된다. 아이콘·글리프 라벨이면 옵션의
  `accessibilityLabel` 을 줘야 한다.
- 비활성 옵션은 눌리지 않고 `accessibilityState.disabled` 로 알린다. 이미 선택된 옵션을 다시
  눌러도 `onChange` 가 호출된다(web 과 같은 동작).
- 루트는 접근성 집합체가 아니다 — 세그먼트는 각각 조작된다.
- **`size`·`fullWidth`·루트 `disabled` 는 없다** (web 에도 없다).

#### 접근 가능한 이름

| 컴포넌트               | 이름의 출처                                                                       |
| ---------------------- | --------------------------------------------------------------------------------- |
| `Button`               | 보이는 라벨(children). `accessibilityLabel` 로 덮을 수 있다                       |
| `Fab shape="extended"` | 보이는 라벨(children). `accessibilityLabel` 로 덮을 수 있다                       |
| `Fab` (circular)       | `accessibilityLabel` **필수** — 타입에서 강제한다                                 |
| `IconButton`           | `accessibilityLabel` **필수** — 타입에서 강제한다                                 |
| Input 3종              | `accessibilityLabel` **필수** — 타입에서 강제한다                                 |
| `TextField`            | 문자열 `label` 에서 파생, 또는 `accessibilityLabel`. 타입이 둘 중 하나를 강제한다 |
| `SearchField`          | `accessibilityLabel` **필수** — 타입에서 강제한다                                 |
| `Select`               | `accessibilityLabel` **필수** — 타입에서 강제한다                                 |
| `SegmentControl`       | 옵션별. 문자열 라벨은 보이는 텍스트, 아이콘 라벨은 `accessibilityLabel`           |

`loading` 중에도 이름은 유지된다.

**placeholder 는 레이블이 아니다.** RN `TextInput` 은 placeholder 로 접근 가능한 이름을 만들지
않고(`accessibilityLabelledBy` 는 Android 전용이다), 그래서 Input 3종은 `accessibilityLabel` 을
타입에서 필수로 요구한다.

#### 없는 것 (web 에만 있다)

`href`, `component`(다형성), `className`, `IconButton` 의 `edge`. RN 에 대응 개념이 없어서
옮기지 않았다 — 카탈로그에도 없으므로 있다고 가정하지 말 것.

Input 계열에서 특히 없는 것: `inputProps`/`textareaProps` 분리, HTML `type`(대신
`keyboardType`·`inputMode`·`secureTextEntry`), `rows`(대신 `numberOfLines`), `name`·`id`,
`event.target.value`, DOM ref 타입.

#### 지금 없는 것 (Input / 합성)

- **Input 3종의 `required`**: 타입에 없다. `FormControl`·`TextField` 에는 있지만 **시각 표시
  전용**이다 — RN `AccessibilityState` 에 `required` 필드가 없고 폼 검증도 없다.
- **오류 메시지 연결**: `error` 는 시각 상태다. RN 에는 `aria-invalid`·`aria-describedby` 에
  해당하는 교차 플랫폼 수단이 없어서 `TextField` 의 `helperText` 도 입력의 설명으로 연결되지
  않는다. **오류 사유를 스크린 리더가 읽게 하려면 소비자가 정책을 고른다** —
  `accessibilityLiveRegion`(Android 전용)·`AccessibilityInfo.announceForAccessibility`.
  기본은 조용하다.
- **`multiple` Select**: 없다. 단일 선택뿐이다.
- **`MenuItem`**: 없다. `Select` 는 `options` 데이터를 받는다.
- **하드웨어 키보드 목록 이동**: `SearchField`·`Select` 모두 없다.

### 테마

| 심볼               | 용도                                                                        |
| ------------------ | --------------------------------------------------------------------------- |
| `ThemeProvider`    | RN context 기반 테마. `mode` prop (기본 `light`)                            |
| `useTheme`         | 현재 theme 객체 반환. `getColor(theme, ...)` 등에 사용                      |
| `themes`           | `[{ name: 'light', ... }, ...]` namespace 배열                              |
| `ThemeName` (type) | 'light' \| 'dark' \| 'sepia' \| 'amber' \| 'ember' \| 'frost' \| 'midnight' |

### 토큰 / 유틸 (정적 객체)

| 심볼          | 용도                                                                   |
| ------------- | ---------------------------------------------------------------------- |
| `Native`      | 정적 토큰 트리. `Native.Light.tokens.color.primary.pr500` 같은 값 참조 |
| `themes`      | 등록된 테마 목록 (`ThemeInfo[]`)                                       |
| `getColor`    | 토큰 색 lookup (`getColor(theme, 'primary.pr500')`)                    |
| `createTheme` | 런타임 theme 객체 생성                                                 |

### Type alias (재export)

`ColorToken`, `RadiusToken`, `SpacingToken`, `RNTokens`, `Theme<T>`, `ThemeInfo`, `ThemeName`

두 렌더러가 같은 뜻으로 구현한 어휘도 함께 나온다 (ui-core 소유):
`ButtonVariant`, `ButtonSize`, `ButtonColor`, `ButtonLoadingPosition`, `FabShape`,
`FieldVariant`, `FieldSize`, `FieldColor`

Input 계열 prop 타입: `PlainInputProps`, `FilledInputProps`, `BoxedInputProps`,
`InputState`, `InputContainerStyle`(`containerStyle` 콜백이 받는 상태/스타일)

Form 구조 prop 타입: `FormControlProps`, `InputLabelProps`, `FormHelperTextProps`.
`FormControlContext`·`useFormControl` 은 **비공개**다 — 선언에도 카탈로그에도 없다.

### deprecated — 다음 major에서 제거

| 심볼  | 이유 / 대신 쓸 것                                               |
| ----- | --------------------------------------------------------------- |
| `Web` | 값이 CSS 문자열(`"0.75rem"`)이라 RN 스타일에 못 쓴다 → `Native` |
| `cx`  | className은 web 개념 → style 배열 / `StyleSheet.flatten`        |

## ⚠️ 정적 객체 vs 런타임 테마

| 용도                  | 메커니즘                                                                             |
| --------------------- | ------------------------------------------------------------------------------------ |
| **런타임 테마 전환**  | `ThemeProvider` context. `useTheme()` 훅으로 현재 theme 획득 후 `getColor` 등에 사용 |
| **빌드 시점 정적 값** | `Native.Light.tokens.*` 등 namespace 직접 참조                                       |

다크모드 처리하려고 `Native.Dark.tokens.*`로 namespace를 동적 선택하지 말 것 — `ThemeProvider`가 자동 처리.

## ⚠️ Web vs Native 토큰

`Native.*` 트리는 RN-specific transforms 적용된 값:

- `spacing`/`radius`/`borderWidth` → number (px 단위 stripped)
- `typography.{fontSize,lineHeight,letterSpacing,fontWeight}` → number (단독 토큰 + composite 자식 모두)
- `color.*` → hex string 그대로
- `shadow.*` 산출물은 leaf로 분해 (`shadow.xs.0.x` 등) — 일반 사용자는 `Native.Light.tokens.shadow` 직접 접근보다 컴포넌트의 elevation prop 권장

Web 토큰을 RN에서 그대로 쓰지 말 것 — `Native` namespace가 호환 형식.

## 카탈로그 (`dist/llm-catalog.json`, `dist/tokens.json`)

### API 카탈로그 — `llm-catalog.json`

빌드가 번들 declaration에서 생성한 정확한 public API 사실.

```json
{
  "package": "@berrypjh/react-native-ui",
  "platform": "react-native",
  "symbols": {
    "Box": {
      "kind": "component",
      "importFrom": "@berrypjh/react-native-ui",
      "props": { "p": { "type": "BoxSpacingValue", "required": false } }
    }
  }
}
```

`props`에는 이 라이브러리가 선언한 prop만 담긴다. RN `ViewProps` 상속 prop은 제외된다 —
그쪽이 필요하면 번들 `.d.ts`를 본다.

### 토큰 카탈로그 — `tokens.json`

빌드 산출물에 토큰 카탈로그가 포함됨. flat 형태:

```json
{
  "schema": "tokens[path] = [cssVar, ...valuesPerTheme]",
  "themes": ["light", "dark", "sepia"],
  "tokens": {
    "color.primary.pr500": ["--ds-primary-pr500", "#2E90FA", "#1849A9", "#2E90FA"]
  }
}
```

전체 토큰 enumeration이 필요할 때 d.ts 트리 traverse 대신 이 파일 한 번 read.

## 자동화 메모

- 이 파일은 빌드 시 `dist/AGENTS.md`로 복사. 직접 편집 금지 — 원본은 `AGENTS.consumer.md`.
- 더 자세한 사용법은 `README.md` 참조.
