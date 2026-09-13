# @berrypjh/design-tokens

하나의 토큰 소스로 Web과 React Native가 같은 디자인 값을 쓰게 하는 디자인 토큰 빌드 패키지.

[DTCG](https://design-tokens.github.io/community-group/format/) 형식의 토큰 JSON을 [Style Dictionary](https://styledictionary.com)로 변환해
**CSS 변수**, **타입 안전한 Web/RN 토큰 객체**, **Tailwind preset**을 만든다.

> 워크스페이스 내부 패키지다 (`private: true`). 소비자는 이 패키지를 설치하지 않고
> `@berrypjh/react-ui` / `@berrypjh/react-native-ui`를 통해 산출물을 받는다.

## 특징

- **단일 소스, 두 플랫폼** — 같은 토큰 트리를 Web은 `rem`·`ms`·서체 스택으로, RN은 `number`로 내보낸다.
- **테마** — `light`를 base로 두고 다른 테마는 바뀌는 값만 덮어쓴다. CSS 변수라 런타임 전환에 재빌드가 필요 없다.
- **타입 안전** — 토큰 트리가 `as const` 객체로 생성되어 경로 오타가 타입 에러가 된다.
- **누락 방지** — 카테고리에 매핑되지 않은 토큰이 있으면 빌드가 실패한다.

## 사용

### CSS 변수

```ts
import '@berrypjh/design-tokens/css';
```

```css
.card {
  padding: var(--ds-spacing-md); /* 0.75rem */
  color: var(--ds-text-primary);
  box-shadow: var(--ds-shadow-md);
}
```

color 토큰은 alpha 합성용 채널 변수(`--ds-primary-pr500-rgb: 16 185 129`)를 함께 가진다.

### 토큰 객체

```ts
import { Native, Web } from '@berrypjh/design-tokens';

Web.Light.tokens.color.primary.pr500; // '#10B981'
Web.Light.tokens.spacing.md; // '0.75rem'
Native.Light.tokens.spacing.md; // 12
```

### Tailwind CSS

```js
// tailwind.config.js
import preset from '@berrypjh/design-tokens/tailwind';

export default {
  presets: [preset],
  content: ['./src/**/*.{ts,tsx}'],
};
```

```css
/* Tailwind v4 */
@import 'tailwindcss';
@config '../tailwind.config.js';
```

preset은 값을 굽지 않고 CSS 변수를 가리키므로 테마가 바뀌면 유틸리티 클래스도 따라 바뀐다.

## 테마

| 테마                                              | 셀렉터                                   |
| ------------------------------------------------- | ---------------------------------------- |
| `light`                                           | `:root` (base)                           |
| `dark` `sepia` `amber` `ember` `frost` `midnight` | `[data-theme="<name>"]`, `.theme-<name>` |

```html
<html data-theme="dark"></html>
```

JS에서는 `Web.Dark`, `Native.Midnight`처럼 테마 이름을 capitalize한 namespace로 접근한다.

## 플랫폼별 값

같은 토큰이 플랫폼에 맞는 형태로 변환된다.

| 토큰                                 | 원본                | Web                                        | React Native   |
| ------------------------------------ | ------------------- | ------------------------------------------ | -------------- |
| `spacing.md`                         | `{spacing.2xs} * 6` | `'0.75rem'`                                | `12`           |
| `motion.duration.normal`             | `140`               | `'140ms'`                                  | `140`          |
| `typography.fontFamilies.pretendard` | `Pretendard`        | `"Pretendard, 'Apple SD Gothic Neo', ..."` | `'Pretendard'` |
| `color.primary.pr500`                | `#10B981`           | `'#10B981'`                                | `'#10B981'`    |

`shadow`·`elevation`의 합성 변수(`--ds-shadow-md`)는 CSS 전용이다. RN은 구조화된 레이어 값을 그대로 쓴다.

## 산출물

| 경로                               | 내용                                                                                                                 |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `@berrypjh/design-tokens`          | `Web`, `Native`, `themes`, `ThemeName`, `ThemeDef`, `tailwindPreset`                                                 |
| `@berrypjh/design-tokens/web`      | Web 토큰 namespace                                                                                                   |
| `@berrypjh/design-tokens/rn`       | RN 토큰 namespace                                                                                                    |
| `@berrypjh/design-tokens/css`      | 모든 테마의 CSS 변수 (side-effect import)                                                                            |
| `@berrypjh/design-tokens/tailwind` | Tailwind preset (default export)                                                                                     |
| `@berrypjh/design-tokens/tokens`   | 코드를 실행하지 않고 토큰 이름·값을 찾을 때 쓰는 JSON 카탈로그 (AI 에이전트, `pnpm ui:lookup --token=color.primary`) |

## 토큰 작성

토큰은 `tokens/<theme>/<category>.json`에 DTCG 형식으로 작성한다.
`$type`은 Tokens Studio 어휘(`fontSizes`, `boxShadow` 등)를 쓰며 빌드 시 표준 타입으로 정렬된다.

```json
{
  "primary": {
    "pr500": { "$value": "#10B981", "$type": "color" }
  },
  "text": {
    "primary": { "$value": "{primary.pr700}", "$type": "color" }
  }
}
```

```
tokens/
  light/      base — 모든 카테고리의 풀세트
  dark/ ...   light 위에 덮어쓸 값만
src/
  themes.ts   테마 등록부
  build.ts    빌드 엔트리
  lib/        변환·생성 로직
test/         테스트 전용 헬퍼 (WCAG 대비 계산)
```

## 개발

워크스페이스 루트에서 실행한다.

| 명령                                       | 설명                                         |
| ------------------------------------------ | -------------------------------------------- |
| `pnpm tokens:gen`                          | 토큰 JSON → CSS·TS·Tailwind 생성 (가장 빠름) |
| `pnpm tokens:watch`                        | 토큰 JSON 변경 시 자동 재생성                |
| `pnpm tokens:build`                        | 생성 + `dist/` 컴파일                        |
| `pnpm tokens:clean`                        | 산출물 정리                                  |
| `pnpm nx run @berrypjh/design-tokens:test` | 테스트 (색 대비·파이프라인·패키지 경계)      |

## 라이선스

[MIT](../../LICENSE)
