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

| 컴포넌트     | 요약                                                                  |
| ------------ | --------------------------------------------------------------------- |
| `Box`        | 토큰 기반 레이아웃 (padding·margin·background·radius)                 |
| `Button`     | 라벨 버튼. `variant`·`size`·`color`·`fullWidth`·`loading`·아이콘 슬롯 |
| `Fab`        | 플로팅 액션 버튼. `shape="circular" \| "extended"`                    |
| `IconButton` | 아이콘 전용 버튼. `accessibilityLabel` **필수**                       |

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

#### 접근 가능한 이름

| 컴포넌트               | 이름의 출처                                                 |
| ---------------------- | ----------------------------------------------------------- |
| `Button`               | 보이는 라벨(children). `accessibilityLabel` 로 덮을 수 있다 |
| `Fab shape="extended"` | 보이는 라벨(children). `accessibilityLabel` 로 덮을 수 있다 |
| `Fab` (circular)       | `accessibilityLabel` **필수** — 타입에서 강제한다           |
| `IconButton`           | `accessibilityLabel` **필수** — 타입에서 강제한다           |

`loading` 중에도 이름은 유지된다.

#### 없는 것 (web 에만 있다)

`href`, `component`(다형성), `className`, `IconButton` 의 `edge`. RN 에 대응 개념이 없어서
옮기지 않았다 — 카탈로그에도 없으므로 있다고 가정하지 말 것.

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

두 렌더러가 같은 뜻으로 구현한 Button 계열 어휘도 함께 나온다 (ui-core 소유):
`ButtonVariant`, `ButtonSize`, `ButtonColor`, `ButtonLoadingPosition`, `FabShape`

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
