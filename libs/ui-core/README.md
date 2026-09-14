# @berrypjh/ui-core

Web과 React Native 렌더러가 같은 디자인 결정을 공유하게 하는 플랫폼 독립 코어 패키지.

두 렌더러가 함께 구현하는 **prop 계약**과, [design-tokens](../design-tokens/README.md) 산출물을 타입과 함께 통과시키는
**토큰 facade**를 제공한다. 렌더러 코드와 유틸리티는 두지 않는다.

> 워크스페이스 내부 패키지다 (`private: true`). 소비자는 이 패키지를 설치하지 않고
> `@berrypjh/react-ui` / `@berrypjh/react-native-ui`를 통해 필요한 심볼을 받는다.

## 특징

- **플랫폼 독립** — DOM·React·React Native API를 쓰지 않는다. `boundary.test.ts`가 소스를 훑어 막는다.
- **구현된 계약만** — 두 렌더러가 같은 불변식을 실제로 구현할 때만 계약이 들어온다.
- **design-tokens 캡슐화** — 토큰 트리·CSS 변수·Tailwind preset·`tokens.json`을 이 패키지가 통과시킨다. 다운스트림은 design-tokens를 직접 import하지 않는다.
- **엄격한 토큰 조회** — 없는 경로를 조회하면 `undefined`를 돌려주지 않고 던진다.

## 의존 방향

```
design-tokens (private) → ui-core (private) → react-ui / react-native-ui (public) → 앱
```

## 사용

### 공유 계약

렌더러는 계약 타입에 자기 플랫폼 prop을 합쳐 공개 props를 만든다.

```ts
import type { ButtonSemanticProps } from '@berrypjh/ui-core';
import type { PressableProps } from 'react-native';

export type ButtonProps = ButtonSemanticProps & Omit<PressableProps, 'disabled' | 'style'>;
```

### 토큰

```ts
import { createTheme, getColor, Native, Web } from '@berrypjh/ui-core';
import type { RNTokens, Theme } from '@berrypjh/ui-core';

const theme: Theme<RNTokens> = createTheme({ mode: 'light', tokens: Native.Light.tokens });
getColor(theme, 'primary.pr500'); // '#10B981'

Web.Light.tokens.spacing.md; // '0.75rem'
```

### CSS 변수 · Tailwind

```ts
import '@berrypjh/ui-core/css';
import preset from '@berrypjh/ui-core/tailwind';
```

둘 다 design-tokens 산출물을 그대로 통과시킨다. 사용법은 [design-tokens README](../design-tokens/README.md)와 같다.

## 공유 계약

| 계약          | 타입                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------- |
| `avatar`      | `AvatarSemanticProps`, `AvatarSize`, `AvatarShape`                                           |
| `badge`       | `BadgeSemanticProps`, `BadgeVariant`, `BadgeSize`, `BadgeIntent`, `BadgePlacement`           |
| `box`         | `BoxProps`, `BoxSpacingValue`, `BoxRadiusValue`                                              |
| `button`      | `ButtonSemanticProps`, `ButtonVariant`, `ButtonSize`, `ButtonColor`, `ButtonLoadingPosition` |
| `chip`        | `ChipSemanticProps`, `ChipSize`, `ChipVariant`                                               |
| `divider`     | `DividerSemanticProps`, `DividerOrientation`                                                 |
| `fab`         | `FabSemanticProps`, `FabShape`                                                               |
| `field`       | `FieldSemanticProps`, `InputFieldSemanticProps`, `FieldVariant`, `FieldSize`, `FieldColor`   |
| `icon-button` | `IconButtonSemanticProps`                                                                    |
| `stack`       | `StackSemanticProps`, `StackDirection`, `StackAlign`, `StackJustify`                         |

계약은 렌더러와 무관한 어휘(size·variant·상태)만 가진다. 슬롯·스타일·접근성 prop은 각 렌더러가 소유한다.
`menu-item`처럼 한쪽 렌더러만 구현한 계약은 그 렌더러 패키지에 있다.

## 토큰 API

| 심볼                                          | 내용                                                     |
| --------------------------------------------- | -------------------------------------------------------- |
| `getColor(theme, path)`                       | RN 토큰 트리에서 색을 조회한다. 경로가 없으면 던진다     |
| `createTheme({ mode, tokens })`               | `Theme<T>` 봉투를 만든다                                 |
| `themes`                                      | `readonly ThemeInfo[]` — 등록된 테마의 `name`·`selector` |
| `Web`, `Native`                               | design-tokens가 생성한 토큰 namespace 패스스루           |
| `ColorToken` `SpacingToken` `RadiusToken`     | 토큰 경로 문자열 유니온 (`'primary.pr500'`)              |
| `RNTokens` `Theme<T>` `ThemeName` `ThemeInfo` | 테마 타입                                                |

## 산출물

| 경로                         | 내용                                                              |
| ---------------------------- | ----------------------------------------------------------------- |
| `@berrypjh/ui-core`          | 계약 타입, 토큰 API, `Web`·`Native`·`themes` 패스스루             |
| `@berrypjh/ui-core/css`      | 모든 테마의 CSS 변수 (side-effect import, design-tokens에서 복사) |
| `@berrypjh/ui-core/tailwind` | Tailwind preset (default export, design-tokens 패스스루)          |

`dist/tokens.json`도 design-tokens에서 복사되지만 exports에 없다. 렌더러 빌드가 파일로 가져간다.
d.ts는 design-tokens 타입까지 inline한 단일 파일로 번들된다.

## 구조

```
src/
  index.ts      공개 re-export
  tailwind.ts   design-tokens/tailwind 패스스루
  contracts/    양 렌더러가 공유하는 prop 계약
  tokens/       토큰 타입, 조회 헬퍼, 테마 레지스트리, design-tokens 패스스루
```

## 개발

워크스페이스 루트에서 실행한다.

| 명령                                      | 설명                                                |
| ----------------------------------------- | --------------------------------------------------- |
| `pnpm nx run @berrypjh/ui-core:build`     | JS·d.ts 번들 + design-tokens CSS·`tokens.json` 복사 |
| `pnpm nx run @berrypjh/ui-core:typecheck` | 선언 emit 후 타입 계약 테스트 검사                  |
| `pnpm nx run @berrypjh/ui-core:test`      | build 후 테스트 (계약 타입·토큰 조회·패키지 경계)   |
| `pnpm nx run @berrypjh/ui-core:lint`      | 린트                                                |

토큰 JSON을 바꿨다면 `pnpm tokens:build`를 먼저 돌린다. ui-core는 design-tokens의 `dist`를 본다.

## 라이선스

[MIT](../../LICENSE)
