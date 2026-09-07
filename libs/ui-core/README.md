# @berrypjh/ui-core

플랫폼 독립적인 공통 UI 코어. `react-ui` (web) · `react-native-ui` (RN)이 공유하는 prop 계약과 토큰 타입·헬퍼를 제공한다.

유틸리티는 두지 않는다 — 순수 함수라는 것은 공유 계층에 둘 근거가 아니다. `cx` 같은 className 헬퍼는 react-ui가 소유한다.

## private 경계

`private: true`다. **소비자는 이 패키지를 설치하지도 import하지도 않는다.**

```
design-tokens (private) → ui-core (private) → react-ui / react-native-ui (public) → 앱
```

소비자가 `@berrypjh/ui-core`를 import하면 consumer eval의 public-import grader가
`private-package-import`로 잡는다. 필요한 심볼은 렌더러 패키지가 플랫폼에 맞게 re-export한다 —
web은 `Web`·`themes`·`cx`, RN은 `Native`·`getColor`·`createTheme`.

`design-tokens`는 이 패키지에 캡슐화되어 다운스트림(`react-ui`/`react-native-ui`/apps)은 design-tokens를 직접 의존하지 않는다.

## 사용

```ts
// 토큰 접근
import { getColor, createTheme } from '@berrypjh/ui-core';
import type { ColorToken, Theme, RNTokens } from '@berrypjh/ui-core';
const theme: Theme<RNTokens> = createTheme({ mode: 'light', tokens });
const c = getColor(theme, 'primary.pr500');

// design-tokens 패스스루 (consumer는 design-tokens 인지 필요 없음)
import { Web, Native, themes } from '@berrypjh/ui-core';
import type { ThemeInfo } from '@berrypjh/ui-core';
const lightColor = Web.Light.tokens.color.primary.pr500;

// Tailwind preset
import preset from '@berrypjh/ui-core/tailwind';

// CSS 변수
import '@berrypjh/ui-core/css';
```

## Export 경로

| 경로                         | 용도                                                    |
| ---------------------------- | ------------------------------------------------------- |
| `@berrypjh/ui-core`          | 토큰 헬퍼 · 컴포넌트 prop 계약 · design-tokens 패스스루 |
| `@berrypjh/ui-core/tailwind` | Tailwind preset 패스스루 — **패키징 예외**(아래 참조)   |
| `@berrypjh/ui-core/css`      | CSS 변수 (side-effect import, design-tokens에서 흡수)   |

## Public 표면

**ui-core 자체 기여**

| 카테고리           | 심볼                                                                                                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 토큰 헬퍼          | `getColor`, `createTheme`                                                                                                                                                                  |
| 토큰 타입          | `ColorToken`, `RadiusToken`, `SpacingToken`, `RNTokens`, `Theme<T>`, `ThemeName`, `ThemeInfo`                                                                                              |
| 컴포넌트 prop 계약 | `BoxProps`, `BoxRadiusValue`, `BoxSpacingValue` — 양 렌더러가 같은 불변식을 구현하는 유일한 계약. web 전용 계약(button/field/fab/icon-button/menu-item)은 `react-ui/src/types`가 소유한다. |

**design-tokens 산출물 façade**

| 심볼            | 종류                                                                                          |
| --------------- | --------------------------------------------------------------------------------------------- |
| `Web`, `Native` | namespace 값 — 생성된 토큰 트리를 그대로 통과시킨다                                           |
| `themes`        | `readonly ThemeInfo[]` — 값은 design-tokens 레지스트리, 타입은 `{ name, selector }` 로 좁힌다 |
| `ThemeDef`      | type — **deprecated**. 빌드 합성 메타데이터(`sourceDirs`)까지 드러낸다. `ThemeInfo` 를 쓸 것  |

### tailwind 브릿지는 패키징 예외다

`@berrypjh/ui-core/tailwind`는 플랫폼 중립 런타임 코어가 아니다. design-tokens가 private이라
소비자가 직접 import할 수 없고, 렌더러 패키지는 빌드에서 `libs/ui-core/dist/tailwind.js`를 복사해
간다. ui-core는 그 경로 하나만 제공한다 — preset 생성은 design-tokens의 `genTailwind` 소관이다.

`/css`와 `tokens.json`도 같은 성격이다. ui-core는 design-tokens 산출물을 **복사**할 뿐
다시 만들지 않는다 (`packageSurface.test.ts`가 바이트로 확인한다).

## 디렉토리

```
src/
├── index.ts                    public re-export
├── tailwind.ts                 design-tokens/tailwind 패스스루
├── boundary.test.ts            렌더러 타입·패키지 유입 검사
├── packageSurface.test.ts      exports map ↔ dist 산출물 검사
├── contracts/                  양 렌더러가 공유하는 prop 계약
│   ├── box.ts, box.test.ts, index.ts
└── tokens/                     토큰 타입·접근 헬퍼
    ├── types.ts                ColorToken, SpacingToken, RadiusToken, RNTokens, Theme, ThemeName
    ├── path.ts                 LeafDotPath, PathValue (internal generic)
    ├── getToken.ts             internal path-walk (결손이면 던진다)
    ├── getters.ts              getColor (1개)
    ├── theme.ts                createTheme
    ├── registry.ts             themes(ThemeInfo[]), ThemeInfo, deprecated ThemeDef
    ├── parity.test.ts          Web/RN 경로 어휘 + 테마 레지스트리 검사
    └── index.ts
```

`utils/`는 없다. web 전용 유틸은 react-ui가 소유한다.

## 빌드 / 테스트

```bash
pnpm nx build @berrypjh/ui-core      # vite + d.ts 번들링 + css 복사
pnpm nx test @berrypjh/ui-core       # vitest
pnpm nx typecheck @berrypjh/ui-core
pnpm nx lint @berrypjh/ui-core
```

## Publish

`private: true` 워크스페이스 패키지. 직접 publish 안 함 — `react-ui`/`react-native-ui` 빌드 시 d.ts·CSS·Tailwind preset 모두 번들되어 다운스트림에 전달된다 (vite-plugin-dts의 `bundledPackages: ['@berrypjh/design-tokens']`로 design-tokens 타입까지 inline).

`package.json`의 `sideEffects: ["./dist/css/index.css"]`가 CSS-only import의 tree-shake를 막는다.
