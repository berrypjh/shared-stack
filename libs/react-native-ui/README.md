# @berrypjh/react-native-ui

React Native 모바일 UI 컴포넌트 라이브러리. 디자인 토큰 기반의 일관된 컴포넌트 세트를 제공한다.

**아직 작업 중인 라이브러리다.** 웹 패키지(`@berrypjh/react-ui`)보다 컴포넌트가 적다.

> **AI 에이전트용** — 소스나 번들 `.d.ts`를 열기 전에 아래를 먼저 읽는다. 전부 이 패키지 안에 있고 네트워크가 필요 없다.
>
> | 필요한 것            | 파일                    | 해석 가능한 경로                    |
> | -------------------- | ----------------------- | ----------------------------------- |
> | 사용 규칙 · 함정     | `dist/AGENTS.md`        | `@berrypjh/react-native-ui/agents`  |
> | 정확한 export · prop | `dist/llm-catalog.json` | `@berrypjh/react-native-ui/catalog` |
> | 정확한 토큰          | `dist/tokens.json`      | `@berrypjh/react-native-ui/tokens`  |
>
> 설치된 패키지의 CLI로 필요한 부분만 조회할 수도 있다.
>
> ```bash
> npx @berrypjh/react-native-ui summary          # 패키지 지형
> npx @berrypjh/react-native-ui find button      # 심볼 검색
> npx @berrypjh/react-native-ui api Button       # 정확한 prop 계약
> npx @berrypjh/react-native-ui token color.primary
> ```

## 설치

```bash
pnpm add @berrypjh/react-native-ui
```

## 사용 예시

```tsx
import { Box, ThemeProvider } from '@berrypjh/react-native-ui';

<ThemeProvider mode="light">
  <Box p="md" bg="background.surface" radius="md" />
</ThemeProvider>;
```

## 제공 컴포넌트

| 컴포넌트      | 설명                                                               |
| ------------- | ------------------------------------------------------------------ |
| `Box`         | 기본 레이아웃 컴포넌트 (padding · margin · background · radius)    |
| `Stack`       | 1차원 배치 (`direction` · `gap` · `align` · `justify` · `wrap`)    |
| `Button`      | 라벨 버튼 (`variant` · `size` · `color` · `fullWidth` · `loading`) |
| `Fab`         | 플로팅 액션 버튼 (`shape="circular" \| "extended"`)                |
| `IconButton`  | 아이콘 전용 버튼 (`accessibilityLabel` 필수)                       |
| `PlainInput`  | 밑줄만 있는 텍스트 필드 (`accessibilityLabel` 필수)                |
| `FilledInput` | 채워진 표면 + 사방 테두리 (`accessibilityLabel` 필수)              |
| `BoxedInput`  | 윤곽선만 있는 필드 (`accessibilityLabel` 필수)                     |

**정확한 심볼 · prop 목록은 build 산출물 `dist/llm-catalog.json`이 정답이다.**

### Box와 Stack

`Box`와 `Stack`은 책임이 다르다. `Box`는 면 · 여백 · 모서리를, `Stack`은 자식을 한 축으로 흘리는 1차원 배치만 가진다. 둘 다 `View`이고 `Pressable`이 아니며, `Stack`은 `Box`를 상속하지 않으므로 겹쳐 쓴다.

```tsx
import { Box, Stack } from '@berrypjh/react-native-ui';

<Box p="lg" bg="background.surface" radius="md">
  <Stack direction="row" gap="md" align="center" justify="between">
    <Text>왼쪽</Text>
    <Text>오른쪽</Text>
  </Stack>
</Box>;
```

- **기본 축** — `column`
- **`gap`** — spacing 토큰 이름 또는 원시 숫자. `0`은 "간격 없음"이고 미지정과 다르다
- **비상호작용** — `accessible` · `accessibilityRole` · `focusable`을 만들지 않고, 소비자가 준 `ViewProps`는 그대로 전달한다
- **없는 것** — 반응형 prop 객체와 `Flex` · `Grid` 짝 API

### Button 계열

- **RN `Pressable` 위에 있다** — `onPress`를 쓰고, web의 `href` · `component` · `className` · `edge`는 없다
- **`disabled` · `loading`** — 누름을 막고 접근성 상태로 알린다
- **아이콘만 있는 컨트롤**(`IconButton`, circular `Fab`) — `accessibilityLabel`을 **타입에서** 요구한다

### Input 계열

- **구조** — RN `TextInput` 하나를 래퍼 `View` 안에 둔다. `value`는 `string`, 값 콜백은 `onChangeText`이고 `event.target.value`는 없다
- **네이티브 prop** — `keyboardType` · `inputMode` · `secureTextEntry`는 그대로 쓰고, `ref`는 `TextInput`을 가리킨다
- **`disabled` · `readOnly`** — `disabled`는 편집을 막고 접근성으로 알리며, `readOnly`는 편집만 막는다
- **이름** — placeholder는 접근 가능한 이름이 되지 못해 `accessibilityLabel`을 **타입에서** 요구한다
- **`error`** — 시각 상태일 뿐이다. RN에는 오류 메시지를 입력에 연결할 수단이 아직 없다(`required` · FormControl · 헬퍼 텍스트는 web 전용)

### FormControl

`FormControl`은 `color` · `size` · `disabled` · `error` · `fullWidth`를 자손에게 내려보내고, 입력의 focus/blur를 받아 라벨 · 테두리를 함께 움직인다.

- **보이는 라벨은 입력의 접근 가능한 이름이 아니다.** RN에 교차 플랫폼 연결 수단이 없어(`accessibilityLabelledBy`는 Android 전용) 입력마다 `accessibilityLabel`을 따로 준다
- 헬퍼도 입력의 설명으로 자동 연결되지 않고, 오류가 자동으로 읽히지도 않는다
- `required`는 시각 표시일 뿐이다. `TextField`는 아직 없다

## 테마와 토큰

| export                       | 내용                                                                                                                    |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `ThemeProvider` · `useTheme` | 라이트 · 다크 테마 컨텍스트                                                                                             |
| `themes` · `Native`          | 토큰 정적 객체 (`Web`은 deprecated, 값이 CSS 문자열이라 RN에서 못 쓴다)                                                 |
| `cx`                         | **deprecated.** className 유틸이라 RN에서 쓸 곳이 없다. 다음 major에서 제거. style은 배열 · `StyleSheet.flatten`을 쓴다 |
| `getColor`                   | 토큰 색 lookup                                                                                                          |

타입은 `BoxProps` · `PlainInputProps` · `FilledInputProps` · `BoxedInputProps` · `ColorToken` · `RadiusToken` · `SpacingToken` · `RNTokens` · `Theme` · `ThemeName` 등이 함께 export된다.

## Export 경로

| 경로                        | 용도                               |
| --------------------------- | ---------------------------------- |
| `@berrypjh/react-native-ui` | 모든 컴포넌트 · 테마 · 토큰 · 유틸 |
