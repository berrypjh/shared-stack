# @berrypjh/react-ui

React 웹 UI 컴포넌트 라이브러리. 디자인 토큰 기반의 일관된 컴포넌트 세트를 제공한다.

> **AI 에이전트용** — 소스나 번들 `.d.ts`를 열기 전에 아래를 먼저 읽는다. 전부 이 패키지 안에 있고 네트워크가 필요 없다.
>
> | 필요한 것            | 파일                    | 해석 가능한 경로             |
> | -------------------- | ----------------------- | ---------------------------- |
> | 사용 규칙 · 함정     | `dist/AGENTS.md`        | `@berrypjh/react-ui/agents`  |
> | 정확한 export · prop | `dist/llm-catalog.json` | `@berrypjh/react-ui/catalog` |
> | 정확한 토큰          | `dist/tokens.json`      | `@berrypjh/react-ui/tokens`  |
>
> 설치된 패키지의 CLI로 필요한 부분만 조회할 수도 있다.
>
> ```bash
> npx @berrypjh/react-ui summary          # 패키지 지형
> npx @berrypjh/react-ui find button      # 심볼 검색
> npx @berrypjh/react-ui api Button       # 정확한 prop 계약
> npx @berrypjh/react-ui token color.primary
> ```

## 설치

```bash
pnpm add @berrypjh/react-ui
```

**CSS를 따로 import해야 한다.**

```ts
import '@berrypjh/react-ui/styles.css';
```

## 사용 예시

```tsx
import { Button, TextField, ThemeProvider } from '@berrypjh/react-ui';

<ThemeProvider mode="light">
  <Button variant="contained" color="primary">
    확인
  </Button>
  <TextField label="이름" />
</ThemeProvider>;
```

## 제공 컴포넌트

| 카테고리   | 컴포넌트                                                                            |
| ---------- | ----------------------------------------------------------------------------------- |
| 레이아웃   | `Box`, `Stack`                                                                      |
| 버튼       | `Button`, `IconButton`, `Fab`, `ButtonBase`                                         |
| 입력       | `TextField`, `SearchField`, `BoxedInput`, `FilledInput`, `PlainInput`, `InputBase`  |
| 선택       | `Select`, `MenuItem`, `SegmentControl`, `Checkbox`, `Radio`, `RadioGroup`, `Switch` |
| 폼 구성    | `FormControl`, `InputLabel`, `FormHelperText`                                       |
| 표시       | `Avatar`, `Badge`, `Chip`, `List`, `ListItem`, `Table`, `TableScroll`               |
| 오버레이   | `Popover`, `PopoverTrigger`, `PopoverPanel`                                         |
| 내비게이션 | `SkipLink`                                                                          |

각 컴포넌트는 `<Name>Props` 타입을 함께 export하고, 대부분 `component` prop으로 polymorphic이다 — `<Button component="a" href="...">`처럼 다른 element로 렌더할 수 있다.

**정확한 심볼 · prop 목록은 build 산출물 `dist/llm-catalog.json`이 정답이다.**이 표는 사람이 훑어보기 위한 요약이라 새 컴포넌트가 추가되면 뒤처질 수 있다.

### 레이아웃 primitive 둘의 경계

`Box`와 `Stack`은 책임이 다르다. `Box`는 면 · 여백 · 모서리(visual/container)를, `Stack`은 자식을 한 축으로 흘리는 1차원 배치만 가진다. `Stack`은 `Box`를 상속하지 않으므로 둘 다 필요하면 겹쳐 쓴다.

```tsx
import { Box, Stack } from '@berrypjh/react-ui';

<Box p="lg" bg="background.surface" radius="md">
  <Stack direction="row" gap="md" align="center" justify="between">
    <span>왼쪽</span>
    <span>오른쪽</span>
  </Stack>
</Box>;
```

- **기본 축** — `column`. CSS 기본값 `row`가 아니라 RN과 맞춘 값이다
- **`gap`** — spacing 토큰 이름(`"md"`) 또는 원시 숫자(`12`). `0`은 "간격 없음"이고 미지정과 다르다
- **정렬** — `align` `start · center · end · stretch`, `justify` `start · center · end · between`, `wrap` `boolean`
- **비상호작용** — `role` · `tabIndex` · `aria-*`를 만들지 않고 포커스 · hover 시각도 없다. 소비자가 준 DOM prop은 그대로 전달하므로 `role` · `tabIndex`가 필요하면 직접 준다
- **반응형 prop 객체 없음** — 브레이크포인트가 필요하면 `className` · `style`로 다룬다
- **`Flex` · `Grid` 짝 API 없음** — 2차원 배치는 `Stack`을 중첩하거나 CSS로 직접 한다

## 테마와 토큰

| export                     | 내용                                                                        |
| -------------------------- | --------------------------------------------------------------------------- |
| `ThemeProvider`            | 라이트 · 다크 · 세피아 테마 컨텍스트                                        |
| `themes` · `Web`           | 토큰 정적 객체 (`Native`는 deprecated, RN 전용)                             |
| `cx`                       | className merge 유틸 (react-ui 구현)                                        |
| `getColor` · `createTheme` | **deprecated.** RN 전용이다. web은 CSS 변수와 `<ThemeProvider mode>`를 쓴다 |

타입은 `BoxProps` · `ButtonProps` · `ColorToken` · `RadiusToken` · `SpacingToken` · `Theme` · `ThemeName` 등이 함께 export된다.

## Tailwind 연동

```ts
// tailwind.config.{js,ts}
import preset from '@berrypjh/react-ui/tailwind';

export default {
  presets: [preset],
};
```

`styles.css`는 컴포넌트를 `@layer components`에 둔다(순서 `theme, base, components, utilities`). 그래서 import 순서와 상관없이 Tailwind 유틸리티 `className`이 컴포넌트 스타일을 덮는다. **레이어 밖에 쓴 CSS도 컴포넌트를 이기므로 전역 리셋은 `@layer base`에 둔다.**

## Export 경로

| 경로                            | 용도                                     |
| ------------------------------- | ---------------------------------------- |
| `@berrypjh/react-ui`            | 모든 컴포넌트 · 테마 · 토큰 · 유틸       |
| `@berrypjh/react-ui/styles.css` | 글로벌 CSS (토큰 변수 + 컴포넌트 스타일) |
| `@berrypjh/react-ui/tailwind`   | Tailwind preset                          |
