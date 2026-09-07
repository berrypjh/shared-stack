# @berrypjh/react-ui

React 웹 UI 컴포넌트 라이브러리. 디자인 토큰 기반의 일관된 컴포넌트 세트와 테마 시스템을 제공한다.

## TL;DR

```tsx
// 1. 글로벌 CSS import (앱 진입점에서 한 번)
import '@berrypjh/react-ui/styles.css';

// 2. 컴포넌트 사용
import { Button, TextField, ThemeProvider } from '@berrypjh/react-ui';

<ThemeProvider mode="light">
  <Button variant="contained" color="primary">
    확인
  </Button>
  <TextField label="이름" />
</ThemeProvider>;
```

```js
// 3. (선택) Tailwind preset 연결
// tailwind.config.js
import preset from '@berrypjh/react-ui/tailwind';
export default { presets: [preset] };
```

## 찾는 순서

넓은 것부터 좁혀 들어간다. 위 단계로 해결되면 아래로 내려가지 않는다.

1. **플랫폼** — 어느 플랫폼 작업인가. 설치된 `@berrypjh` UI 패키지가 1차 근거이고,
   요구가 설치 상태와 어긋나면 추측하지 말고 되묻는다.
2. **패키지** — 웹은 `@berrypjh/react-ui`, React Native는 `@berrypjh/react-native-ui`.
   `@berrypjh/ui-core`와 `@berrypjh/design-tokens`는 private이다. 소비자가 직접 import하지 않는다 —
   필요한 토큰·유틸(`cx`, `getColor`, `createTheme`, `themes`, `Web`, `Native`)은
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
| 상속 prop 포함 전체 타입           | `dist/types/index.d.ts`   | 큼                     |
| 구현 세부                          | source                    | 큼                     |

필요한 부분만 뽑고 싶으면 패키지에 동봉된 CLI를 쓴다 — 파일 전체를 컨텍스트에 넣지 않아도 된다.

```bash
npx @berrypjh/react-ui find button      # 심볼 후보
npx @berrypjh/react-ui api Button       # 그 심볼의 prop 계약만
npx @berrypjh/react-ui token color.primary
```

`llm-catalog.json`은 빌드가 번들 declaration에서 생성한다. 이 문서는 심볼 목록을
중복 관리하지 않는다 — 정확한 개수·이름·prop은 항상 카탈로그가 정답이다.

## Export 경로

| 경로                            | 용도                                                          |
| ------------------------------- | ------------------------------------------------------------- |
| `@berrypjh/react-ui`            | 모든 컴포넌트·테마·토큰·유틸                                  |
| `@berrypjh/react-ui/styles.css` | 글로벌 CSS (토큰 변수 + 컴포넌트 스타일) — side-effect import |
| `@berrypjh/react-ui/tailwind`   | Tailwind preset (color/spacing/radius 등 매핑)                |

## Public 표면

### 컴포넌트

카테고리: 레이아웃 · 버튼 · 입력 · 선택 · 폼 구성 · 오버레이 · 내비게이션.

정확한 컴포넌트 목록과 prop은 `llm-catalog.json`의 `symbols`에서 읽는다
(`kind: "component"`). 각 컴포넌트는 `<Name>Props` 타입을 함께 export하며,
대부분 `component` prop으로 polymorphic이다 — `<Button component="a" href="...">`처럼
다른 element로 렌더할 수 있다.

### 테마

| 심볼               | 용도                                                                        |
| ------------------ | --------------------------------------------------------------------------- |
| `ThemeProvider`    | `<div data-theme="...">` 적용. `mode` prop (기본 `light`)                   |
| `themes`           | `readonly ThemeInfo[]` — `{ name, selector }` 배열                          |
| `ThemeName` (type) | 'light' \| 'dark' \| 'sepia' \| 'amber' \| 'ember' \| 'frost' \| 'midnight' |

### 토큰 / 유틸 (정적 객체)

| 심볼     | 용도                                                                |
| -------- | ------------------------------------------------------------------- |
| `Web`    | 정적 토큰 트리. `Web.Light.tokens.color.primary.pr500` 같은 값 참조 |
| `themes` | 등록된 테마 목록 (`ThemeInfo[]`)                                    |
| `cx`     | className merge — `cx('a', { b: cond }, c && 'd')`                  |

### Type alias (재export)

`ColorToken`, `RadiusToken`, `SpacingToken`, `ThemeInfo`, `ThemeName`

### deprecated — 다음 major에서 제거

RN 전용이라 web에서는 쓸 수 없다. `getColor`는 `Theme<RNTokens>`를 요구하고 `Native`는
RN transform을 거친 숫자 트리다. web은 CSS 변수와 `Web` 네임스페이스를 쓴다.

| 심볼                          | 대신 쓸 것                           |
| ----------------------------- | ------------------------------------ |
| `Native`                      | `Web`                                |
| `getColor`                    | CSS 변수 (`var(--ds-...)`) 또는 SCSS |
| `createTheme`                 | `<ThemeProvider mode>`               |
| `Theme<T>`, `RNTokens` (type) | (web 대응 없음)                      |

## ⚠️ 정적 객체 vs 런타임 테마

| 용도                  | 메커니즘                                                                  |
| --------------------- | ------------------------------------------------------------------------- |
| **런타임 테마 전환**  | CSS 변수 (`var(--ds-*)`). `<ThemeProvider>` → `data-theme` 속성 자동 적용 |
| **빌드 시점 정적 값** | `Web.Light.tokens.*` 등 namespace 직접 참조                               |

다크모드 처리하려고 `Web.Dark.tokens.*`로 namespace를 동적 선택하지 말 것 — CSS 변수가 자동 처리.

## ⚠️ Tailwind 연결 시 styles.css

```css
/* styles.css */
@import 'tailwindcss';
@config '../tailwind.config.js';
```

`@config`는 v3 호환 directive — IDE의 "Unknown at rule" 경고는 무시 가능 (PostCSS 빌드는 정상).

## 카탈로그 (`dist/llm-catalog.json`, `dist/tokens.json`)

### API 카탈로그 — `llm-catalog.json`

빌드가 번들 declaration에서 생성한 정확한 public API 사실.

```json
{
  "package": "@berrypjh/react-ui",
  "platform": "web",
  "exports": { ".": "@berrypjh/react-ui" },
  "symbols": {
    "Button": {
      "kind": "component",
      "importFrom": "@berrypjh/react-ui",
      "props": { "loading": { "type": "boolean", "required": false } }
    }
  }
}
```

`props`에는 이 라이브러리가 선언한 prop만 담긴다. DOM 상속 prop은 제외된다 —
그쪽이 필요하면 번들 `.d.ts`를 본다. 리터럴 union이 크면 값 대신 `valueCount`만 남는다.

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
