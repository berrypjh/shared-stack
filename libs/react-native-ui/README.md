# @berrypjh/react-native-ui

> **Note**
> 현재 작업 중인 라이브러리입니다.

React Native 모바일 UI 컴포넌트 라이브러리. 디자인 토큰 기반의 일관된 컴포넌트 세트를 제공합니다.

> **AI 에이전트용** — 소스나 번들 `.d.ts`를 열기 전에 아래를 먼저 읽으세요.
> 전부 이 패키지 안에 있고, 네트워크가 필요 없습니다.
>
> | 필요한 것            | 파일                    | 해석 가능한 경로                    |
> | -------------------- | ----------------------- | ----------------------------------- |
> | 사용 규칙 · 함정     | `dist/AGENTS.md`        | `@berrypjh/react-native-ui/agents`  |
> | 정확한 export · prop | `dist/llm-catalog.json` | `@berrypjh/react-native-ui/catalog` |
> | 정확한 토큰          | `dist/tokens.json`      | `@berrypjh/react-native-ui/tokens`  |
>
> 또는 설치된 패키지의 CLI로 필요한 부분만 조회할 수 있습니다.
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

| 컴포넌트     | 설명                                                       |
| ------------ | ---------------------------------------------------------- |
| `Box`        | 기본 레이아웃 컴포넌트 (padding·margin·background·radius)  |
| `Button`     | 라벨 버튼 (`variant`·`size`·`color`·`fullWidth`·`loading`) |
| `Fab`        | 플로팅 액션 버튼 (`shape="circular" \| "extended"`)        |
| `IconButton` | 아이콘 전용 버튼 (`accessibilityLabel` 필수)               |

Button 계열은 RN `Pressable` 위에 있습니다 — `onPress` 를 쓰고, web 의 `href`·`component`·
`className`·`edge` 는 없습니다. `disabled`/`loading` 은 누름을 막고 접근성 상태로 알립니다.
아이콘만 있는 컨트롤(`IconButton`, circular `Fab`)은 `accessibilityLabel` 을 **타입에서**
요구합니다.

> 정확한 심볼·prop 목록은 빌드 산출물 `dist/llm-catalog.json`이 정답입니다.

## 테마와 토큰

- `ThemeProvider`, `useTheme` — 라이트/다크 테마 컨텍스트
- `themes`, `Native` — 토큰 정적 객체 (`Web`은 deprecated, 값이 CSS 문자열이라 RN에서 못 쓴다)
- `cx` — **deprecated**. className 유틸이라 RN에서 쓸 곳이 없다. 다음 major에서 제거. style은 배열/`StyleSheet.flatten` 사용
- `getColor` — 토큰 색 lookup

타입은 `BoxProps`, `ColorToken`, `RadiusToken`, `SpacingToken`, `RNTokens`, `Theme`, `ThemeName` 등 함께 export됩니다.

## Export 경로

| 경로                        | 용도                         |
| --------------------------- | ---------------------------- |
| `@berrypjh/react-native-ui` | 모든 컴포넌트·테마·토큰·유틸 |
