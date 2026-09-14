# ui-core

`react-ui`(web)와 `react-native-ui`(RN)가 공유하는 prop 계약과 design-tokens 토큰 facade를 두는
워크스페이스 내부 패키지다. 사용법은 [README.md](./README.md)를 본다.

## 명령어

워크스페이스 루트에서 실행한다.

```bash
pnpm nx run @berrypjh/ui-core:build       # vite + d.ts 번들 + design-tokens css·tokens.json 복사
pnpm nx run @berrypjh/ui-core:typecheck   # tsc lib 선언 emit → tsc spec 검사
pnpm nx run @berrypjh/ui-core:test        # build 후 vitest
pnpm nx run @berrypjh/ui-core:lint
```

**build 성공이 typecheck 성공을 대신하지 않는다.** rollup/dts 단계는 타입을 확인하지 않는다.
토큰 JSON을 바꿨으면 `pnpm tokens:build`를 먼저 돌린다. ui-core는 design-tokens의 `dist`를 본다.

변경 후 검증 순서는 아래와 같다.

```bash
pnpm nx run-many -t lint,typecheck,test --projects=@berrypjh/ui-core,@berrypjh/react-ui
pnpm nx run @berrypjh/react-native-ui:typecheck   # 테마 레지스트리 드리프트가 여기서 걸린다
pnpm build:libs
pnpm tools:check                                  # 패키지 경계·카탈로그·소비자 grader
pnpm eval:consumer:smoke                          # 결정적 smoke (모델 호출 없음)
```

## 규칙

- 책임은 공유 prop 계약과 design-tokens 산출물 통과뿐이다. 토큰을 생성하거나 가공하지 않는다.
- 플랫폼 독립이다. DOM·RN 타입과 API(`HTMLElement`·`CSSProperties`·`ReactNode`·`ViewStyle`·`window`·`document` 등),
  React import(context·hook 포함)를 쓰지 않는다. `boundary.test.ts`가 소스를 훑어 실패시킨다. 테마 context는 각 렌더러가 쥔다.
- 두 렌더러가 같은 불변식을 **실제로 구현**할 때만 계약이 들어온다. 아래 [계약 설계](#계약-설계)를 본다.
- 한쪽 렌더러만 쓰는 계약·유틸은 그 렌더러 패키지에 둔다. 단일 사용처도 마찬가지다.
- 순수 함수라는 것은 소유 근거가 아니다. `cx`는 순수하지만 className은 web 렌더링 개념이다.
  "어디서든 돌아간다"와 "양 플랫폼이 같은 의미로 쓴다"는 다른 질문이다.
- 다운스트림(`react-ui`/`react-native-ui`/apps)은 design-tokens를 직접 import하지 않는다. `Web`·`Native`·`themes`·`/css`·`/tailwind`는 ui-core를 거친다.
- 공개 API는 `contracts/*`의 계약 타입, `getColor`·`createTheme`, 토큰 타입, 패스스루다. 바꾸기 전에 다운스트림 사용처를 grep한다
  (`grep -rn '<symbol>' libs apps tools`).
- 커밋 scope는 `ui-core`다 (`feat(ui-core): ...`).

## 구조

```
src/
  index.ts                public re-export (contracts, tokens)
  tailwind.ts             design-tokens/tailwind 패스스루
  boundary.test.ts        렌더러 타입·패키지가 src에 들어왔는지 검사
  packageSurface.test.ts  exports map ↔ dist 산출물 대조 (subpath 해석·side effect·복사 여부)
  contracts/              양 렌더러가 같은 불변식으로 구현하는 계약. 각 *.test.ts는 @ts-expect-error 타입 검사
    avatar.ts badge.ts box.ts button.ts chip.ts divider.ts fab.ts field.ts icon-button.ts stack.ts
    index.ts
  tokens/
    types.ts              ColorToken, SpacingToken, RadiusToken, RNTokens, Theme<T>, ThemeName
    path.ts               LeafDotPath, PathValue (internal generic 유틸)
    getToken.ts           internal path-walk (결손이면 던진다)
    getters.ts            getColor (현재 1개)
    theme.ts              createTheme
    registry.ts           themes(ThemeInfo[]), ThemeInfo
    index.ts              + design-tokens 패스스루 (Web, Native)
    parity.test.ts        Web/RN 경로 어휘 동등성 + 테마 레지스트리 ↔ 생성 namespace 검사
```

`utils/`는 없다. 있던 유틸(`cx`·폼/입력 헬퍼)은 전부 web 전용이라 react-ui로 돌아갔다.
`8dea928`에서 ui-core로 올렸지만 RN 소비자가 끝내 생기지 않았다.

## 작업별 수정 위치

| 작업                       | 수정                                                                        | 함께 볼 테스트                          |
| -------------------------- | --------------------------------------------------------------------------- | --------------------------------------- |
| 새 prop 계약               | 두 렌더러 구현이 있을 때만 `src/contracts/<name>.ts` + `contracts/index.ts` | `contracts/<name>.test.ts`              |
| 새 토큰 카테고리 getter    | `src/tokens/getters.ts` (`getColor` 패턴을 따른다)                          | `getters.test.ts`                       |
| 새 토큰 타입 alias         | `src/tokens/types.ts` + `tokens/index.ts`                                   | `parity.test.ts`                        |
| design-tokens 새 심볼 통과 | `src/tokens/index.ts`의 패스스루 라인                                       | `packageSurface.test.ts`                |
| 새 유틸                    | 두 렌더러가 실제로 호출할 때만 `src/utils/`를 새로 만든다                   | `boundary.test.ts`                      |
| 새 subpath                 | `package.json` exports + `project.json` build                               | `packageSurface.test.ts`의 exports 목록 |

`HEAD_REWRITE`·토큰 카테고리 추가는 design-tokens 작업이다. ui-core는 바꿀 것이 없다.

## 계약 설계

계약은 "쓸 수 있다"가 아니라 "쓰고 있다"로 들어온다. 이름이 같다, UI가 비슷하다, 순수 TypeScript다,
언젠가 재사용한다는 근거가 되지 않는다. RN 구현이 생긴 뒤에야 button·fab·icon-button·field가 올라왔고,
RN 구현이 없는 `menu-item`은 아직 `react-ui/src/types`에 있다.

같은 계약 안에서도 한쪽에만 있는 키는 승격하지 않는다. 슬롯·접근성 이름·스타일은 렌더러가 소유한다.

| 계약          | 가진 것                                       | 승격하지 않은 것과 이유                                                                                                                        |
| ------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `avatar`      | `size` `shape`                                | `src`·`source`·`alt`·`accessibilityLabel`·`fallback`은 렌더러 소유. 비상호작용이라 상태 키가 없다                                              |
| `badge`       | variant·size·intent·placement 어휘, 숫자      | 앵커/content 슬롯·접근성 이름·위치 좌표는 렌더러 소유. intent에 `warning`·`success`가 없는 것은 대비 실측 결과다                               |
| `box`         | `BoxProps` `BoxSpacingValue` `BoxRadiusValue` | 렌더러가 자체 props로 wrap해서 노출한다                                                                                                        |
| `button`      | variant·size·color·loadingPosition 어휘       | —                                                                                                                                              |
| `chip`        | `size` `variant` `selected` `disabled`        | selected/disabled는 interactive 전용이라 각 렌더러가 판별 유니온으로 조립한다. intent는 selected 강조와 겹쳐 V1에 없다                         |
| `divider`     | `orientation`                                 | 두께·색은 토큰(`semanticBorder.divider`·`stroke.light`)이 정한다. web `decorative`는 RN `accessibilityRole`에 separator가 없어 승격하지 않는다 |
| `fab`         | `FabShape`                                    | —                                                                                                                                              |
| `field`       | variant·size·color, `InputFieldSemanticProps` | `required`·`margin`·`hiddenLabel`은 RN 구현이 없어 react-ui가 가진다                                                                           |
| `icon-button` | `size` `color` `disabled`                     | `edge`·`loading`은 web 전용이다                                                                                                                |
| `stack`       | `direction` `gap` `align` `justify` `wrap`    | 자식 자리 prop·2차원 배치·반응형 객체. 브레이크포인트 어휘가 양 플랫폼에 없어 반응형은 web 전용이다                                            |

- `divider`의 `orientation`은 선이 **가르는** 축이라 Stack의 흐름 축 어휘(`column`·`row`)와 일부러 다르다.
- `stack`은 `direction` 기본값을 계약이 정한다. CSS `flex-direction` 기본은 `row`, RN Yoga는 `column`으로 갈리기 때문이다.
- `stack`과 `box`는 합성 관계라 `StackSemanticProps`가 `BoxProps`를 extends하지 않는다.

## 토큰 facade

| 층          | 무엇                                           | 누가                         |
| ----------- | ---------------------------------------------- | ---------------------------- |
| 정적 트리   | `Web.Light.tokens.…` / `Native.Light.tokens.…` | design-tokens 생성           |
| 경로 타입   | `ColorToken`·`SpacingToken`·`RadiusToken`      | `tokens/types.ts` (Web 유도) |
| 런타임 조회 | `getColor(theme, path)` → 없으면 던진다        | `tokens/getters.ts`          |
| 테마 봉투   | `createTheme({ mode, tokens })`                | `tokens/theme.ts`            |
| 테마 목록   | `themes: readonly ThemeInfo[]`                 | `tokens/registry.ts`         |

- web은 CSS 변수(`var(--ds-*)`)로 값을 읽고, RN은 `Native` 트리를 런타임 조회한다. 같은 경로 어휘를 쓴다는 것이 전제이며
  `parity.test.ts`가 검사한다.
- `ThemeInfo`는 `{ name, selector }`다. design-tokens의 `ThemeDef`에 있는 `sourceDirs`는 빌드 합성 메타데이터라
  소비자 계약이 될 수 없어 facade에서 잘라낸다. ui-core는 `ThemeDef`를 재노출하지 않는다.
  렌더러 패키지가 `ThemeInfo`로 옮긴 뒤 deprecated alias도 지웠다.

## 패키지 경계

이 패키지는 `private: true`다. 소비자는 `@berrypjh/react-ui` / `@berrypjh/react-native-ui`만 설치한다.
exports map이 경계이며 `packageSurface.test.ts`가 고정한다. dist에 파일이 있어도 exports에 없으면 공개가 아니다.

| subpath     | 누가 쓰나                                                       |
| ----------- | --------------------------------------------------------------- |
| `.`         | react-ui / react-native-ui 소스                                 |
| `/css`      | react-ui 빌드가 `dist/index.css` 앞에 붙인다, Storybook preview |
| `/tailwind` | react-ui 빌드가 `dist/tailwind.{js,d.ts}`를 복사한다            |

`/tailwind`·`/css`·`tokens.json`은 패키징 예외다. design-tokens가 private이라 ui-core가 경로만 빌려준다.
ui-core는 **복사**만 하고 다시 만들지 않으며, `packageSurface.test.ts`가 `tokens.json`을 바이트로 대조한다.

빌드 산출물은 `dist/index.{js,d.ts}`, `dist/tailwind.{js,d.ts}`, `dist/css/index.css`, `dist/tokens.json`이다.
d.ts는 `vite-plugin-dts`의 `rollupTypes: true` + `bundledPackages: ['@berrypjh/design-tokens']`로 단일 파일 번들된다.

### 다운스트림

| 위치                                                                         | 의존하는 것                                                                               |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `libs/react-ui/src/index.ts` · `libs/react-native-ui/src/index.ts`           | 플랫폼별 re-export. web은 `Web`+`themes`, RN은 `Native`+`getColor`+`createTheme`+`themes` |
| `libs/react-ui/src/deprecated.ts` · `libs/react-native-ui/src/deprecated.ts` | 반대 플랫폼 심볼의 `@deprecated` re-export. 다음 major에서 제거                           |
| `libs/react-ui/src/types/*`, 양 렌더러 `components/*/*.types.ts`             | 계약 타입을 wrap한 공개 props                                                             |
| `libs/react-native-ui/src/theme/ThemeProvider.tsx`, RN `*.styles.ts`         | `createTheme`·`Native`, `RNTokens`                                                        |
| `libs/react-native-ui/src/components/box/Box.tsx`                            | `getColor`                                                                                |
| `libs/{react-ui,react-native-ui}/project.json`                               | build가 `dist/css/index.css`·`tailwind.*`·`tokens.json`을 복사                            |
| `apps/demo-web/src/app/pages/TokensPage.tsx`                                 | react-ui가 재노출한 `Web.Light.tokens` 트리 순회. 카테고리 키 이름에 의존                 |
| `tools/consumer-retrieval/packages.ts`, `tools/scripts/treeshake`            | 내부 패키지 목록, tree-shaking 측정 대상                                                  |

ui-core export를 바꾸면 두 `index.ts`와 두 `deprecated.ts`를 함께 본다.

## 빌드·DTS 실패 디버깅

| 증상                                        | 원인 / 대응                                                                          |
| ------------------------------------------- | ------------------------------------------------------------------------------------ |
| `@ts-expect-error`가 조용히 통과            | `tsconfig.spec.json`이 `out-tsc`의 **빌드된 선언**을 읽는다. lib tsc를 먼저 돌린다   |
| 선언이 옛 심볼을 계속 들고 있음             | `rm -rf libs/ui-core/out-tsc`. `tsc`는 지워진 파일의 산출물을 정리하지 않는다        |
| `TS2209 project root is ambiguous`          | 자기 패키지 이름으로 static import했다. specifier를 변수로 돌려 런타임 해석으로 한다 |
| `packageSurface.test.ts`가 dist 없다고 실패 | 정상이다. 산출물 검사라서 build 없이는 통과하지 않는다                               |
| 선언에 `@berrypjh/design-tokens`가 남음     | `vite.config.mts`의 `bundledPackages`가 빠졌다                                       |
| 테마를 더했는데 RN이 안 깨짐                | design-tokens를 다시 빌드하지 않았다. ui-core는 dist를 통해 본다                     |

## Gotcha

- **타입 계약 검사는 순서를 탄다.** `tsconfig.lib.json`이 `composite`라 spec은 `out-tsc`의 선언을 읽는다. typecheck target이 두 tsc를 순서대로 도는 이유다.
- **토큰 조회는 엄격 실패다.** `getToken`은 경로가 없으면 던진다. 반환 타입(`PathValue<...>`)이 값을 약속하므로, 조용히 넘기면 `undefined`가 색 자리까지 흘러가
  원인에서 먼 곳에서 터진다. 키가 있고 값이 `undefined`인 경우는 결손이 아니므로 그대로 돌려준다.
- **공유 토큰 별칭은 Web에서 유도된다.** `ColorToken` 등은 `Web.Light` 트리 기준인데 `getColor`는 그 키로 RN 트리를 조회한다.
  `parity.test.ts`가 깨지면 별칭을 고치지 말고 두 어휘가 왜 갈라졌는지부터 확인한다.
- **getter는 시그니처를 맞춘다.** `<P extends XxxToken>`, `Theme<RNTokens>` 인자, `PathValue` 반환으로 type-narrow한다.
- **path 매핑 금지**: `tsconfig.base.json`의 `paths`에 `@berrypjh/design-tokens`를 넣지 않는다. composite project + rootDir 제약과 충돌해 빌드가 깨진다.
- **design-tokens 직접 import는 신호다.** 다운스트림에 `from '@berrypjh/design-tokens'`가 나오면 ui-core 패스스루가 빠진 것이다. 패스스루를 추가한다.
- **테스트 위치**: 단위 테스트는 같은 폴더의 `*.test.ts`다. vitest가 `{src,tests}/**/*.{test,spec}.*`를 픽업한다.
