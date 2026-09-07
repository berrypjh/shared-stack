# @berrypjh/react-ui

React 웹 UI 컴포넌트 라이브러리. 디자인 토큰 기반의 일관된 컴포넌트 세트를 제공합니다.

> **AI 에이전트용** — 소스나 번들 `.d.ts`를 열기 전에 아래를 먼저 읽으세요.
> 전부 이 패키지 안에 있고, 네트워크가 필요 없습니다.
>
> | 필요한 것            | 파일                    | 해석 가능한 경로             |
> | -------------------- | ----------------------- | ---------------------------- |
> | 사용 규칙 · 함정     | `dist/AGENTS.md`        | `@berrypjh/react-ui/agents`  |
> | 정확한 export · prop | `dist/llm-catalog.json` | `@berrypjh/react-ui/catalog` |
> | 정확한 토큰          | `dist/tokens.json`      | `@berrypjh/react-ui/tokens`  |
>
> 또는 설치된 패키지의 CLI로 필요한 부분만 조회할 수 있습니다.
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

CSS를 별도로 import해야 합니다.

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

| 카테고리   | 컴포넌트                                                                           |
| ---------- | ---------------------------------------------------------------------------------- |
| 레이아웃   | `Box`                                                                              |
| 버튼       | `Button`, `IconButton`, `Fab`, `ButtonBase`                                        |
| 입력       | `TextField`, `SearchField`, `BoxedInput`, `FilledInput`, `PlainInput`, `InputBase` |
| 선택       | `Select`, `MenuItem`, `SegmentControl`                                             |
| 폼 구성    | `FormControl`, `InputLabel`, `FormHelperText`                                      |
| 오버레이   | `Popover`, `PopoverTrigger`, `PopoverPanel`                                        |
| 내비게이션 | `SkipLink`                                                                         |

각 컴포넌트는 `<Name>Props` 타입을 함께 export하며, 대부분 `component` prop으로
polymorphic입니다 — `<Button component="a" href="...">`처럼 다른 element로 렌더할 수 있습니다.

> 정확한 심볼·prop 목록은 빌드 산출물 `dist/llm-catalog.json`이 정답입니다.
> 이 표는 사람이 훑어보기 위한 요약이라 새 컴포넌트가 추가되면 뒤처질 수 있습니다.

## 테마와 토큰

- `ThemeProvider` — 라이트/다크/세피아 테마 컨텍스트
- `themes`, `Web` — 토큰 정적 객체 (`Native`는 deprecated, RN 전용)
- `cx` — className merge 유틸 (react-ui 구현)
- `getColor`, `createTheme` — **deprecated**. RN 전용이다. web은 CSS 변수와 `<ThemeProvider mode>`를 쓴다

타입은 `BoxProps`, `ButtonProps`, `ColorToken`, `RadiusToken`, `SpacingToken`, `Theme`, `ThemeName` 등 함께 export됩니다.

## Tailwind 연동

```ts
// tailwind.config.{js,ts}
import preset from '@berrypjh/react-ui/tailwind';

export default {
  presets: [preset],
};
```

## Export 경로

| 경로                            | 용도                                     |
| ------------------------------- | ---------------------------------------- |
| `@berrypjh/react-ui`            | 모든 컴포넌트·테마·토큰·유틸             |
| `@berrypjh/react-ui/styles.css` | 글로벌 CSS (토큰 변수 + 컴포넌트 스타일) |
| `@berrypjh/react-ui/tailwind`   | Tailwind preset                          |
