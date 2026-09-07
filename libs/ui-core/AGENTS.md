# ui-core

## 왜 있나

`react-ui`(web)와 `react-native-ui`(RN)가 **같은 디자인 결정을 공유**하되 렌더러 코드는 섞지 않기 위한
경계다. 두 가지만 한다.

1. **공유 계약** — 두 렌더러가 같은 불변식으로 구현하는 prop 계약 (지금은 `BoxProps` 하나).
2. **토큰 façade** — design-tokens 산출물을 타입과 함께 통과시킨다. 생성은 하지 않는다.

`private: true`라서 소비자는 이 패키지를 설치하지도, import하지도 않는다. 렌더러 패키지가
필요한 것만 골라 re-export한다.

## 절대 원칙

- **플랫폼 독립**: web/native 렌더링 가정·DOM API·RN-only API 금지. `src/boundary.test.ts`가 소스를 훑어 강제한다.
- **"쓸 수 있다"가 아니라 "쓰고 있다"**: 두 렌더러가 같은 불변식을 **실제로 구현**해야 계약이 ui-core에 들어온다. 이름이 같다·UI가 비슷하다·순수 TypeScript다·언젠가 재사용한다는 근거가 아니다. button/field/fab/icon-button/menu-item 계약이 `react-ui/src/types`로 간 이유가 그것이다.
- **design-tokens 캡슐화**: ui-core가 design-tokens를 wrap. 다운스트림(`react-ui`/`react-native-ui`/apps)은 **design-tokens를 직접 import하지 않는다**. `Web`, `Native`, `themes`, `/tailwind`, `/css`는 ui-core에서 패스스루.
- **공개 surface는 안정**: `getColor`, `createTheme`, `BoxProps`, 토큰 타입·패스스루는 다운스트림이 의존. 변경 시 reverse-search로 영향 확인 필수.
- **단일 사용처면 ui-core가 아님**: 한 컴포넌트만 쓰면 그 컴포넌트 폴더로 옮겨라.
- **순수함은 소유 근거가 아니다**: `cx`는 순수 함수지만 className은 web 렌더링 개념이다. "어디서든 돌아간다"와 "양 플랫폼이 같은 의미로 쓴다"는 다른 질문이다.

## 파일 (전부)

```
src/
  index.ts          public re-export (contracts/tokens)
  tailwind.ts       design-tokens/tailwind 패스스루
  boundary.test.ts  렌더러 타입·패키지가 src에 들어왔는지 훑는 검사
  packageSurface.test.ts  exports map ↔ dist 산출물 대조 (subpath 해석·side effect·복사 여부)
  contracts/
    box.ts          BoxProps, BoxSpacingValue, BoxRadiusValue (양 렌더러가 구현하는 유일한 계약)
    box.test.ts     계약의 타입 수준 검증 (@ts-expect-error)
    index.ts
  tokens/
    types.ts        ColorToken, SpacingToken, RadiusToken, RNTokens, Theme<T>, ThemeName
    path.ts         LeafDotPath, PathValue (internal generic 유틸)
    getToken.ts     internal path-walk (결손이면 던진다)
    getters.ts      getColor (현재 1개. 새 카테고리 getter 필요 시 여기 추가)
    getters.test.ts
    theme.ts        createTheme
    theme.test.ts
    getToken.test.ts
    registry.ts     themes(ThemeInfo[]) — 빌드 메타데이터(sourceDirs)를 잘라낸 소비자용 형태
    index.ts        + design-tokens 패스스루 (Web, Native)
    parity.test.ts  Web/RN 경로 어휘 동등성 + 테마 레지스트리 ↔ 생성 namespace 검사
```

`utils/`는 없다. 있던 유틸(`cx`·폼/입력 헬퍼)은 전부 web 전용이라 react-ui로 돌아갔다 —
`8dea928`에서 ui-core로 올렸지만 RN 소비자가 끝내 생기지 않았다.

## 토큰 접근 모델

| 층          | 무엇                                           | 누가                         |
| ----------- | ---------------------------------------------- | ---------------------------- |
| 정적 트리   | `Web.Light.tokens.…` / `Native.Light.tokens.…` | design-tokens 생성           |
| 경로 타입   | `ColorToken`·`SpacingToken`·`RadiusToken`      | `tokens/types.ts` (Web 유도) |
| 런타임 조회 | `getColor(theme, path)` → 없으면 **던진다**    | `tokens/getters.ts`          |
| 테마 봉투   | `createTheme({ mode, tokens })`                | `tokens/theme.ts`            |
| 테마 목록   | `themes: readonly ThemeInfo[]`                 | `tokens/registry.ts`         |

web은 CSS 변수(`var(--ds-*)`)로 값을 읽고, RN은 `Native` 트리를 런타임 조회한다. 같은 경로 어휘를
쓴다는 것이 전제이며 `parity.test.ts`가 그것을 검사한다.

`ThemeInfo`는 `{ name, selector }`다. design-tokens의 `ThemeDef`에는 `sourceDirs`(빌드 합성
메타데이터)가 더 있는데, 소비자 계약이 될 수 없어 façade에서 잘라낸다. `ThemeDef`는 deprecated로
남아 있고 렌더러 패키지는 더 이상 노출하지 않는다.

## 여기 두면 안 되는 것

- 토큰 생성·변환·Style Dictionary 로직 (design-tokens 소관)
- DOM/RN 타입과 API — `HTMLElement`·`CSSProperties`·`ReactNode`·`ViewStyle`·`window`·`document` 등
- React import 일체 (context·hook 포함). 테마 context는 각 렌더러가 쥔다
- 한쪽 렌더러만 쓰는 계약·유틸
- 순수하다는 이유만으로 올라오는 범용 헬퍼

앞의 두 줄은 `boundary.test.ts`가 소스를 훑어 실패시킨다.

## 작업 매트릭스

| 작업                            | 수정 파일                                                                                                |
| ------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 새 prop 계약 (예: TooltipProps) | 두 렌더러 구현이 있을 때만 `src/contracts/<name>.ts` + `contracts/index.ts`. 한쪽뿐이면 그 렌더러 패키지 |
| 새 토큰 카테고리 getter         | `src/tokens/getters.ts` (기존 `getColor` 패턴 따라)                                                      |
| 새 토큰 타입 alias 노출         | `src/tokens/types.ts` + `tokens/index.ts`                                                                |
| 새 유틸                         | 두 렌더러가 **실제로** 호출할 때만 `src/utils/`를 새로 만든다. 한쪽뿐이면 그 렌더러 패키지               |
| design-tokens에서 새 심볼 노출  | `src/tokens/index.ts`의 패스스루 라인에 추가                                                             |

`HEAD_REWRITE`/카테고리 추가는 design-tokens 쪽 작업. ui-core는 noop.

## 빌드 / 테스트

```bash
pnpm nx build @berrypjh/ui-core         # vite + dts + css/tokens 복사
pnpm nx test @berrypjh/ui-core          # vitest
pnpm nx typecheck @berrypjh/ui-core     # tsc (lib 선언 emit → spec 검사)
pnpm nx lint @berrypjh/ui-core          # eslint
```

변경 후 최소 검증 순서. **build 성공이 typecheck 성공을 대신하지 않는다** — rollup/dts 단계는
타입을 확인하지 않는다.

```bash
pnpm nx run-many -t lint,typecheck,test --projects=@berrypjh/ui-core,@berrypjh/react-ui
pnpm nx typecheck @berrypjh/react-native-ui   # 테마 레지스트리 드리프트가 여기서 걸린다
pnpm run build:libs
pnpm run tools:check                          # 패키지 경계·카탈로그·소비자 grader
pnpm run eval:consumer:smoke                  # 결정적 smoke (모델 호출 없음)
```

토큰을 건드렸다면 `pnpm tokens:build`를 먼저 돌린다. ui-core는 design-tokens의 **dist**를 보므로
소스만 고치면 아무것도 바뀌지 않는다.

빌드 산출물: `dist/index.{js,d.ts}` + `dist/tailwind.{js,d.ts}` + `dist/css/index.css` + `dist/tokens.json`(design-tokens에서 복사). d.ts는 `vite-plugin-dts`의 `rollupTypes: true` + `bundledPackages: ['@berrypjh/design-tokens']`로 단일 파일 번들.

## 빌드·DTS 실패 디버깅

| 증상                                        | 원인 / 대응                                                                         |
| ------------------------------------------- | ----------------------------------------------------------------------------------- |
| `@ts-expect-error`가 조용히 통과            | `tsconfig.spec.json`이 `out-tsc`의 **빌드된 선언**을 읽는다. lib tsc를 먼저 돌려라  |
| 선언이 옛 심볼을 계속 들고 있음             | `rm -rf libs/ui-core/out-tsc` — `tsc`는 지워진 파일의 산출물을 정리하지 않는다      |
| `TS2209 project root is ambiguous`          | 자기 패키지 이름으로 static import 했을 때. specifier를 변수로 돌려 런타임 해석으로 |
| `packageSurface.test.ts`가 dist 없다고 실패 | 정상이다. 산출물 검사라서 build 없이는 통과시키지 않는다                            |
| 선언에 `@berrypjh/design-tokens`가 남음     | `vite.config.mts`의 `bundledPackages`가 빠졌다는 신호                               |
| 테마를 더했는데 RN이 안 깨짐                | design-tokens를 다시 빌드하지 않았다. ui-core는 dist를 통해 본다                    |

## Gotcha

- **design-tokens 직접 노출 금지**: 다운스트림에서 `from '@berrypjh/design-tokens'` 등장하면 ui-core 패스스루가 빠진 신호. ui-core를 통하도록 우회.
- **path 매핑 금지**: `tsconfig.base.json`의 `paths`에 `@berrypjh/design-tokens` 추가하지 말 것 (composite + rootDir와 충돌해 빌드 깨짐 — design-tokens 리팩토링 시 학습된 사실).
- **컴포넌트 props는 wrap이 원칙**: `BoxProps`는 react-ui/react-native-ui가 자체 props로 wrap해서 노출함. ui-core 자체의 props가 다운스트림에 그대로 노출되지 않게 주의.
- **타입 계약 검사는 순서를 탄다**: `tsconfig.lib.json`이 `composite`라 `tsconfig.spec.json`은 `out-tsc`의 **빌드된 선언**을 읽는다. lib을 먼저 emit하지 않으면 `@ts-expect-error`가 옛 선언을 보고 조용히 통과한다. typecheck target이 두 tsc를 순서대로 도는 이유.
- **토큰 조회는 엄격 실패**: `getToken`은 경로가 없으면 `undefined`를 돌려주지 않고 던진다. 반환 타입(`PathValue<...>`)이 값을 약속하기 때문 — 조용히 넘기면 `undefined`가 색 자리까지 흘러가 원인에서 먼 곳에서 터진다. 키가 있고 값이 `undefined`인 경우는 결손이 아니므로 그대로 돌려준다.
- **공유 토큰 별칭은 Web에서 유도된다**: `ColorToken`·`SpacingToken`·`RadiusToken`은 `Web.Light` 트리 기준인데 `getColor`는 그 키로 RN 트리를 조회한다. 두 어휘가 같다는 것이 전제이고 `parity.test.ts`가 그 전제를 검사한다. 갈라지면 별칭을 고치지 말고 왜 갈라졌는지부터 확인할 것.
- **exports map이 경계다**: dist에 파일이 있어도 `package.json` exports에 없으면 공개가 아니다. 새 진입점은 exports + `packageSurface.test.ts`의 목록을 함께 고쳐야 한다.
- **`tailwind`/`css`/`tokens.json`은 패키징 예외**: design-tokens가 private이라 ui-core가 경로만 빌려준다. 여기서 생성하거나 가공하지 말 것 — 복사만 한다.
- **getters 일관성**: 추가 시 기존 `getColor` 시그니처(`<P extends XxxToken>`, `Theme<RNTokens>` 인자)를 따르라. PathValue 반환으로 type-narrow.
- **테스트 위치**: 단위 테스트는 `*.test.ts`로 같은 폴더. `vitest`가 `src/**/*.{test,spec}.ts`를 픽업.

## 다운스트림 영향

- `libs/react-ui/src/index.ts` · `libs/react-native-ui/src/index.ts`가 ui-core façade를 **플랫폼별로 갈라** re-export한다. web은 `Web`+`themes`, RN은 `Native`+`getColor`+`createTheme`. 반대편 심볼은 각 패키지의 `src/deprecated.ts`에 `@deprecated`로 남아 있고 다음 major에서 사라진다. **ui-core export를 바꾸면 두 index와 두 deprecated 파일을 함께 본다**.
- `libs/react-ui/src/components/box/Box.types.ts`가 `BoxProps`·`ColorToken` 직접 import. web 전용 계약은 `libs/react-ui/src/types/`가 소유하므로 ui-core 변경과 무관.
- `libs/react-native-ui/src/components/box/Box.tsx`가 `getColor` 사용.
- `apps/demo-web/src/app/pages/TokensPage.tsx`가 `Web.Light.tokens` 트리 순회 — 카테고리 키 변경 시 깨짐.

## 변경 체크리스트

- [ ] 진짜 양 플랫폼이 쓰는가? (단일 사용처면 그 패키지로)
- [ ] 다운스트림 사용처 grep 했는가? (`grep -rn '<symbol>' libs apps`)
- [ ] design-tokens 패스스루를 우회하지 않는가?
- [ ] 테스트가 의도를 표현하는가?
- [ ] react-ui·react-native-ui index.ts re-export 동기화 필요 없는가?
