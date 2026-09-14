# design-tokens

DTCG 토큰 JSON을 CSS 변수, Web/RN 토큰 객체, Tailwind preset, 토큰 카탈로그(`tokens.json`)로 변환하는
워크스페이스 내부 패키지다. 사용법은 [README.md](./README.md)를 본다.

## 명령어

워크스페이스 루트에서 실행한다.

```bash
pnpm tokens:gen                                  # 토큰 JSON → dist/css, dist/tokens.json, src/.generated
pnpm tokens:build                                # gen + tsc → dist
pnpm nx run @berrypjh/design-tokens:test         # build 후 vitest
pnpm nx run @berrypjh/design-tokens:typecheck
```

테스트는 생성된 `dist/tokens.json`을 읽는다. 토큰 JSON을 바꿨으면 다시 생성한 뒤 테스트한다.

## 규칙

- 책임은 토큰 JSON → CSS / Web·RN TS / Tailwind preset / `tokens.json` 생성뿐이다. 다른 기능을 넣지 않는다.
- 공개 API는 `Web.*`/`Native.*` namespace, `tokens.{category}.{...}` 트리, `--ds-*` 변수 이름, `tokens.json` 형식이다.
  ui-core가 이것에 의존한다.
- `themes[0]`(`light`)이 base이며 풀세트를 가진다. 다른 테마는 base에 있는 키의 값만 덮어쓰고, 새 키를 만들지 않는다.
- `HEAD_REWRITE`에 없는 top-level 키가 나오면 빌드가 throw한다. 무음 누락을 허용하지 않는다.
- 토큰 JSON은 DTCG(`$value`/`$type`)로 쓴다. `$type`은 Tokens Studio 어휘(`fontSizes`, `boxShadow` 등)를 유지하고
  sd-transforms 전처리기가 표준 타입으로 정렬한다. 한 SD 인스턴스에서 legacy `value`와 섞을 수 없다.
- 별도 validator는 없다. 형식이 잘못되면 Style Dictionary가 throw한다.
- `src/.generated/`와 `dist/`는 빌드 산출물이다. 직접 편집하지 않는다.
- `style-dictionary`와 `@tokens-studio/sd-transforms`는 빌드 도구다. `dependencies`·`peerDependencies`에 넣지 않는다.

## 구조

```
src/
  themes.ts            테마 등록부 (ThemeDef[], ThemeName, baseTheme = themes[0])
  build.ts             빌드 엔트리 → lib/pipeline.ts
  index.ts             공개 re-export (Web, Native, themes, ThemeDef, ThemeName, tailwindPreset)
  web.ts rn.ts tailwind.ts   src/.generated 재노출
  lib/
    pipeline.ts        산출물 정리 후 생성 단계 조립
    sd.ts              Style Dictionary 설정과 플랫폼 transform
    platformValue.ts   SD 비의존 값 변환 (rem / number / ms / 서체 스택)
    tokens.ts          HEAD_REWRITE, TOKEN_CATEGORIES, classifyTokenPath, cssVarName, colorToRgbChannels
    genCss.ts          dist/css/variables{,.<theme>}.css (-rgb 채널, 합성 shadow 포함)
    genTsTokens.ts     src/.generated/{web,rn}/themes/<theme>/tokens.ts + index.ts
    genTailwind.ts     src/.generated/tailwind/preset.ts
    genCatalog.ts      dist/tokens.json
test/
  contrast.ts          WCAG 대비 계산 (contrast.test.ts 전용, 빌드에 포함되지 않음)
tokens/
  light/               base 풀세트 (color typography spacing radius borderWidth border shadow elevation component motion)
  <theme>/             light 위에 덮어쓸 값만
```

## 작업별 수정 위치

| 작업                             | 수정                                                                                            | 함께 볼 테스트                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 토큰 값 변경                     | `tokens/<theme>/<category>.json`                                                                | `contrast.test.ts`                                 |
| 새 테마                          | 아래 [테마 추가](#테마-추가)                                                                    | 자동으로 모든 테마 테스트에 포함된다               |
| 새 top-level 키 (예: `tertiary`) | `src/lib/tokens.ts`의 `HEAD_REWRITE`                                                            | `tokens.test.ts`                                   |
| 새 `$type`                       | `src/lib/sd.ts` transform (필요 시)                                                             | `sd.test.ts`의 token type closed set               |
| 새 카테고리 (11번째)             | `TOKEN_CATEGORIES`·`HEAD_REWRITE`, `genTsTokens.ts`의 타입 alias, 필요 시 `genTailwind.ts` 분기 | `tokens.test.ts`, `pipeline.test.ts`의 카테고리 수 |

`HEAD_REWRITE`는 `path[0]`을 카테고리 접두 path로 바꾼다 (`primary` → `['color', 'primary']`).

## 테마 추가

브랜드든 다크 모드든 테마를 추가하는 방법은 하나다. 소비자용 override 레이어는 두지 않는다.

1. `tokens/<name>/*.json`에 light 위에 덮어쓸 값만 작성한다.
2. `src/themes.ts`에 항목을 추가한다.
   ```ts
   { name: 'acme', selector: '[data-theme="acme"], .theme-acme', sourceDirs: ['light', 'acme'] }
   ```
3. `pnpm tokens:gen`
4. `libs/react-native-ui/src/theme/ThemeProvider.tsx`의 `DEFAULT_TOKENS_BY_MODE`에 한 줄 추가한다.

4번만 자동이 아니다. RN은 CSS cascade가 없어 런타임에 토큰 객체를 골라야 한다. 빠뜨리면
`satisfies Record<ThemeName, RNTokens>`가 react-native-ui typecheck를 깨뜨린다. 웹은 demo-web `pages.spec.tsx`가,
경로 어휘는 ui-core `parity.test.ts`가 같은 드리프트를 잡는다.

- `name`은 생성되는 namespace 식별자가 된다 (`acme` → `Acme`). 한 단어 소문자나 camelCase를 쓴다 (`deepSea`는 되고 `deep-sea`는 안 된다).
- `sourceDirs`는 deep-merge 순서다 (뒤가 우선). 어두운 테마는 `['light', 'dark', '<name>']`로 `dark`의 시맨틱 재지정을 재사용하고 램프만 바꾼다.
- 시맨틱은 거의 전부 램프 alias라, 브랜드 테마는 보통 `primary`·`neutral` 램프와 `background.surface`만 바꾸면 된다.
- 새 테마는 `contrast.test.ts`의 대비 검사를 자동으로 받는다. 팔레트를 넣고 테스트를 돌리면 모자란 조합이 나온다.

### 등록된 테마

이름은 분위기를 뜻한다. 소비자 앱 이름을 쓰지 않는다.

| 테마       | 성격                    | 쓰는 곳                                     |
| ---------- | ----------------------- | ------------------------------------------- |
| `light`    | base, 풀세트            | 기본                                        |
| `dark`     | light 반전              | 기본 다크                                   |
| `sepia`    | 종이톤                  | 읽기 모드                                   |
| `amber`    | amber 강조 + paper 중립 | it-tech-blog `react-deep-dive-zone` (light) |
| `ember`    | amber 강조 + near-black | it-tech-blog `react-deep-dive-zone` (dark)  |
| `frost`    | cyan 강조 + slate 중립  | it-tech-blog `next-deep-dive-zone` (light)  |
| `midnight` | cyan 강조 + navy        | it-tech-blog `next-deep-dive-zone` (dark)   |

`accessibility-zone`은 자체 팔레트 없이 기본 `light`/`dark`를 쓴다.

## 토큰 설계

### 시맨틱 패밀리

컴포넌트가 primitive를 직접 참조하지 않도록 역할별 패밀리를 둔다.

| 패밀리                                                         | 키                                                                                                              | 소비처                                                                                                            |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `color.primaryBtn.*` `color.secondaryBtn.*` `color.errorBtn.*` | `default` `hover` `disabled` `focusRipple` `outlinedHover` `outlinedFocusRipple`                                | `button-base`, `fab`, `icon-button`, `chip`, `table` (RN: Button·Fab·Select)                                      |
| `color.field.*`                                                | `border` `borderHover` `borderStrong` `surface` `surfaceSubtle` `focusRing` `focusRingPrimary` `focusRingError` | `input-base`, `boxed-input`, `filled-input`, `plain-input`, `search-field`, `select`, `checkbox`, `radio`, `chip` |
| `color.selectionControl.*`                                     | `checked` (선택된 면·on 트랙) `indicator` (체크·점·thumb) `trackOff` (off 트랙)                                 | `checkbox`, `radio`, `switch`, `chip` (web·RN)                                                                    |

- 버튼 패밀리 셋은 같은 6개 키를 갖는다. 새 색 역할도 이 키를 따른다.
- `selectionControl`은 기존 시맨틱으로 표현할 수 없는 셋만 둔다. unchecked 경계는 `field.border`, hover는 `field.borderHover`,
  error는 `stroke.error`, focus는 `border.primary.color`, disabled는 `border.disabled.color`·`background.disable`을 쓴다.
- `selectionControl`의 base 램프 단계는 밝은 표면용이라 `dark`에서만 다시 잡는다 (`ember`·`midnight`가 상속).
  `background.primary`를 선택된 면으로 쓰지 않는 이유는 dark·midnight에서 표면 대비가 3:1 아래이기 때문이다.

### component 토큰

컴포넌트 값은 기본적으로 react-ui의 `--ui-*` SCSS 지역 변수에 둔다. 아래 셋을 모두 만족할 때만 토큰으로 올린다.

1. RN이 필요로 한다 (RN은 `--ui-*`를 못 쓴다).
2. 기존 시맨틱으로 표현할 수 없다.
3. 여러 컴포넌트가 공유하거나 값이 안정적이다.

| 토큰                             | 값 (Web / RN)                  | 소비처                                                             |
| -------------------------------- | ------------------------------ | ------------------------------------------------------------------ |
| `component.field.height.{sm,md}` | `2.5rem` `3.25rem` / `40` `52` | `input-base`, `select`                                             |
| `component.field.focusRingWidth` | `0.125rem` / `2`               | 폼 필드·radio·chip 포커스 링 (버튼은 `borderWidth.semantic.focus`) |
| `component.pressedOffset`        | `0.0625rem` / `1`              | web `button-base`·`chip`·`table`, RN Button·IconButton·Chip        |

- **pressed는 색이 아니라 위치다.** 눌림은 색을 그대로 둔 채 `translateY(pressedOffset)`만 주고, Fab만 elevation을 얹는다
  (`shadow.lg` → `xl`). `primaryBtn.pressed` 같은 색 토큰은 만들지 않는다. `contrast.test.ts`의 `describe('pressed 상태 어휘')`가 이 결정을 검사한다.
- component 토큰은 테마를 타지 않으므로 `tokens/light/component.json`에만 작성한다.
- `component.button`은 소비처가 없어 **internal로 남긴다** — 산출물에는 그대로 나가지만 컴포넌트에서 쓰지 않는다.

### motion

|                                             | Web                             | RN                      |
| ------------------------------------------- | ------------------------------- | ----------------------- |
| `motion.duration.{fast,normal,slow,slower}` | `60ms` `140ms` `650ms` `1200ms` | `60` `140` `650` `1200` |
| `motion.easing.{standard,linear}`           | `ease` `linear`                 | `ease` `linear`         |

Web은 `ds/web/duration` transform이 `ms`를 붙이고, RN은 `Animated.timing({ duration })`이 숫자를 요구하므로 숫자로 나간다.

### 합성 shadow

sd-transforms는 `boxShadow`를 레이어 자식 변수(`--ds-shadow-lg-1-blur` …)로 분해한다. `genCss`가 바로 쓸 수 있는 합성 변수를 함께 만든다.

- `--ds-shadow-{none,xs,sm,md,lg,xl,2xl,inner}`, `--ds-elevation-{0..6}`
- 레이어는 번호 순으로 `, ` 결합하고, `innerShadow`는 `inset`을 붙인다.
- 자식 변수는 그대로 유지된다. Tailwind `boxShadow` 유틸은 합성 변수를 가리킨다.
- CSS 전용이다. `tokens.json`과 RN 트리는 바뀌지 않고, RN은 구조화된 레이어 값을 쓴다.

## 접근성 (WCAG 2.1 AA)

토큰 기본값은 AA 대비를 충족해야 한다. `contrast.test.ts`가 등록된 **모든 테마** × 실제 컴포넌트 조합을 검사한다.

| 대상                                                                               | 기준     |
| ---------------------------------------------------------------------------------- | -------- |
| 본문·보조·링크·오류 텍스트, 버튼 라벨, Input 값·아이콘, 필드 라벨·헬퍼 (모든 상태) | 4.5:1    |
| contained 버튼 hover 면의 라벨, outlined·text·IconButton의 hover 틴트 위 글자      | 4.5:1    |
| 선택된 목록 행의 글자 (`background.selected`를 표면과 합성한 뒤)                   | 4.5:1    |
| Input 테두리 (평소·hover·strong·error·focus), 버튼 outline = focus 링              | 3:1      |
| 선택 컨트롤의 경계·선택된 면·off 트랙과 그 위 글리프·thumb                         | 3:1      |
| 구분선, contained 면, 비활성 버튼·입력·선택 컨트롤                                 | 1.2:1    |
| focus halo (보이는지만)                                                            | 1:1 초과 |

- Input은 페이지·카드·filled 세 표면에서 모두 잰다. plain·boxed는 배경이 투명해 뒤 표면이 인접색이 된다.
- **disabled는 위치로 갈린다.** 입력 안의 값·테두리는 native `disabled` 안이라 면제(1.2:1 바닥만)지만,
  입력의 형제인 라벨·헬퍼는 비활성임을 전달할 수단이 없어 4.5:1이다. `text.disable`은 라벨·헬퍼 기준으로 잡는다.
- focus halo는 테두리 색 변화 위에 얹는 보조 장식이고, 이를 규정하는 Focus Appearance(2.4.13)는 AAA라 기준 밖이다.
- hover로 배경이 바뀌면 그 위의 글자를 다시 잰다. light용 밝은 틴트를 다크 테마가 물려받으면 밝은 글자 + 밝은 배경이 된다.
- 한 값이 모든 테마를 만족하지 못하면 시맨틱 토큰을 테마별로 잡는다 (예: `field.border`는 light·sepia `ne500`, dark `ne300`).
  `field`는 표면(`surface`·`surfaceSubtle`·`borderStrong`)까지 테마별로 잡아야 한다.
- 새 색은 `contrastRatio()`로 재고 통과하는 **최소 단계**를 고른다.
- `BELOW_AA`는 비어 있어야 한다. 기준에 못 미치면 여기 넣어 동결하지 말고 그 테마의 시맨틱을 다시 잡는다.

## 패키지 경계

이 패키지는 `private: true`다. 소비자는 `@berrypjh/react-ui` / `@berrypjh/react-native-ui`만 설치한다.
exports map은 `dist/`의 내부 모듈이 subpath로 새지 않게 막는 워크스페이스 내부 경계이며 `packageSurface.test.ts`가 고정한다.

| subpath                             | 누가 쓰나                                                    |
| ----------------------------------- | ------------------------------------------------------------ |
| `.` `/web` `/rn` `/css` `/tailwind` | ui-core (→ react-ui / react-native-ui로 번들되어 소비자에게) |
| `/tokens`                           | ui-core 경유로 다운스트림에 복사                             |

`tokens.json`은 design-tokens → ui-core → react-ui / react-native-ui로 **복사**된다. 생성 지점은 이 패키지 하나뿐이다.

### 다운스트림

| 위치                                                                  | 의존하는 것                                                                 |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `libs/ui-core/src/tokens/*`                                           | `Web.Light.*` 타입에서 `ColorToken` 등을 도출. 구조 변경 영향이 크다        |
| `libs/react-native-ui/src/theme/ThemeProvider.tsx`                    | 테마별 RN 토큰 객체 (`DEFAULT_TOKENS_BY_MODE`)                              |
| `apps/demo-web/src/app/pages/TokensPage.tsx`                          | react-ui가 재노출한 `Web.Light.tokens` 트리를 순회. 카테고리 키 이름에 의존 |
| `tools/scripts/generate-consumer-catalog`, `tools/consumer-retrieval` | `tokens.json`                                                               |
| `tools/scripts/observability/collectors/design-system.ts`             | 토큰 산출물과 **이 문서의 문구** (`component.button` 정책 문장)             |

## SemVer

소비자가 결합하는 것은 `--ds-*` 변수 이름과 `tokens.json`이다. 자동 비교기는 없고 릴리스 diff에서 사람이 판단한다.

| 변경                        | 분류         | 커밋/릴리스             |
| --------------------------- | ------------ | ----------------------- |
| 토큰·테마 추가              | non-breaking | `feat` → minor          |
| 토큰 제거·rename, type 변경 | **breaking** | `!` → major             |
| 값이 눈에 보이게 바뀜       | non-breaking | changelog에 반드시 명시 |

토큰을 지울 때는 최소 한 번의 minor 동안 새 이름과 함께 남긴다. 커밋 scope는 `design-tokens`다 (`feat(design-tokens): ...`).

## Gotcha

- **CSS 변수 이름은 authoring path 기준이다.** `tokens.json` 키는 카테고리가 붙지만 변수는 아니다 (`color.primary.pr500` → `--ds-primary-pr500`).
  color는 `--ds-*-rgb` 채널 변수도 함께 생긴다 (Tailwind alpha 유틸용).
- **TS 증분 캐시**: `tsBuildInfoFile`을 `dist/.tsbuildinfo`에 둔다. 밖에 두면 `dist`만 지웠을 때 tsc가 exit 0인데 아무것도 emit하지 않는다.
- **path 매핑 금지**: `tsconfig.base.json`의 `paths`에 `@berrypjh/design-tokens`를 넣지 않는다. composite project + rootDir 제약과 충돌해 ui-core 빌드가 깨진다.
- **stale 정리**: `pipeline.ts`가 생성 전에 `src/.generated/`, `dist/css/`, `dist/tokens.json`을 지운다.
- **테마 순서**: `themes` 배열 순서는 `tokens.json` 값 순서이기도 하다. base를 참조할 때는 `baseTheme`을 import한다.
- **소비자 문서 없음**: `AGENTS.consumer.md`도 `dist/AGENTS.md`도 만들지 않는다. 그래서 `tools/scripts/measure-tokens`의
  `design-tokens` target 중 `dist/AGENTS.md`를 읽는 시나리오는 현재 실패한다 (그 README의 "알려진 제약" 참조).
