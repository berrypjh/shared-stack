# design-tokens

## 절대 원칙

- 핵심 책임(JSON → CSS/RN/Tailwind 3종 출력) 외 기능 추가 금지.
- `Web.*`/`Native.*` namespace 구조와 `tokens.{category}.{...}` 트리는 **공개 API**. 다운스트림(ui-core)이 의존.
- `themes` 배열의 **첫 항목이 base** (light). 풀세트 토큰을 가짐. 다른 테마는 override.
- 미등록 토큰 head는 **즉시 throw** — 무음 누락 금지.
- **토큰 JSON은 DTCG 형식**(`$value`/`$type`)을 사용. type 어휘는 Tokens Studio 플러랄(`fontSizes`/`boxShadow` 등)을 유지하며 sd-transforms 전처리기가 DTCG 정렬 타입으로 자동 변환. 한 SD 인스턴스 안에서 legacy(`value`)와 DTCG는 섞을 수 없음.

## 파일 (전부)

```
src/
  build.ts          엔트리. SD dict → 3종 generator 호출
  themes.ts         테마 등록부. ThemeDef[], ThemeName, baseTheme = themes[0]
  index.ts          public re-export (Web, Native, themes, ThemeDef, ThemeName, tailwindPreset)
  web.ts/rn.ts/tailwind.ts   .generated/ → public 진입점
  lib/
    sd.ts           Style Dictionary 등록 + buildThemeDictionaries (web/rn 두 dict)
    tokens.ts       getTokenType / getTokenValue / cssVarName / colorToRgbChannels / classifyTokenPath / TOKEN_CATEGORIES
    genCss.ts       writeCss → dist/css/variables{,.<theme>}.css
    genTsTokens.ts  writeTsTokens → src/.generated/{web,rn}/themes/<t>/tokens.ts + index.ts
    genTailwind.ts  writeTailwindPreset → src/.generated/tailwind/preset.ts
    genCatalog.ts   writeTokensJson → dist/tokens.json (슬림 평탄 카탈로그)
    contrast.ts     WCAG 대비 회귀 가드
    pipeline.ts     생성 단계 조립
    platformValue.ts  SD 비의존 값 변환 (rem / 숫자 / ms / 서체 스택)
tokens/
  light/   base 풀세트 (color/typography/spacing/radius/borderWidth/border/shadow/elevation/component)
  dark/, sepia/   light 위 override
```

## 작업 매트릭스

| 작업                              | 수정 파일                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------ |
| 새 토큰 값                        | `tokens/<theme>/<category>.json`                                                                 |
| 새 테마                           | `tokens/<name>/` + `src/themes.ts` 배열에 항목 추가                                              |
| 새 top-level 키 (e.g. `tertiary`) | `src/lib/tokens.ts`의 `HEAD_REWRITE`                                                             |
| 새 token type 어휘                | `src/lib/sd.ts` transforms (필요 시) + `HEAD_REWRITE` 매핑                                       |
| 새 카테고리 (10번째)              | `src/lib/tokens.ts`의 `TOKEN_CATEGORIES` + `genTsTokens.ts`의 type alias + `genTailwind.ts` 분기 |

`HEAD_REWRITE`: `path[0]` → 카테고리 path 접두로 치환 (예: `primary` → `['color', 'primary']`).

## 테마 추가

브랜드든 다크모드든 **테마를 직접 추가하는 방법 하나**뿐이다. 소비자용 override 레이어는 두지 않는다.

1. `tokens/<name>/*.json` — light 위에 덮어쓸 토큰만 (풀세트일 필요 없다)
2. `src/themes.ts`에 한 줄
   ```ts
   { name: 'acme', selector: '[data-theme="acme"]', sourceDirs: ['light', 'acme'] }
   ```
3. `pnpm tokens:gen`
4. `libs/react-native-ui/src/theme/ThemeProvider.tsx`의 `DEFAULT_TOKENS_BY_MODE`에 한 줄

`themes.ts`가 단일 진실이라 CSS 블록·Web/RN 토큰 객체·Tailwind preset·namespace 진입점이
함께 생성되고, `themes`를 읽는 화면(데모의 Theme 전환)에도 자동으로 나타난다.

4번만 자동이 아니다 — RN은 CSS 캐스케이드가 없어 런타임에 토큰 객체를 골라야 하기 때문이다.
빠뜨리면 `satisfies Record<ThemeName, RNTokens>`가 react-native-ui typecheck를 깨뜨린다
(웹은 `pages.spec.tsx`가, 경로 어휘는 ui-core `parity.test.ts`가 같은 드리프트를 잡는다).

### 등록된 테마

| 테마       | 성격                    | 쓰는 곳                                     |
| ---------- | ----------------------- | ------------------------------------------- |
| `light`    | base. 풀세트            | 기본                                        |
| `dark`     | light 반전              | 기본 다크                                   |
| `sepia`    | 종이톤                  | 읽기 모드                                   |
| `amber`    | amber 강조 + paper 중립 | it-tech-blog `react-deep-dive-zone` (light) |
| `ember`    | amber 강조 + near-black | it-tech-blog `react-deep-dive-zone` (dark)  |
| `frost`    | cyan 강조 + slate 중립  | it-tech-blog `next-deep-dive-zone` (light)  |
| `midnight` | cyan 강조 + navy        | it-tech-blog `next-deep-dive-zone` (dark)   |

이름은 **분위기**를 말한다 — 소비자 앱 이름을 쓰지 않는다. 앱이 바뀌어도 테마는 그대로고,
어느 앱이 어느 테마를 쓰는지는 이 표가 관리한다. `accessibility-zone`은 자체 팔레트 없이
기본 `light`/`dark`를 쓴다.

`sourceDirs`는 deep-merge 순서다(뒤가 우선). 첫 번째 테마가 base이고 풀세트를 가져야 한다.
이름은 `genTsTokens`가 첫 글자만 대문자로 바꿔 `export * as <Name>`을 만들므로
한 단어 소문자를 쓴다. 여러 단어가 필요하면 camelCase 여야 한다 (`deepSea` ✓, `deep-sea` ✗).

시맨틱은 거의 전부 램프 alias라, 브랜드 테마는 보통 **`primary` 램프 + `neutral` 램프 +
`background.surface`** 만 바꾸면 나머지가 따라온다. 다크 계열은 `dark`를 중간 단계로 끼우면
(`['light', 'dark', 'ember']`) `dark`의 시맨틱 재지정을 재사용하고 램프만 갈아끼우면 된다.

새 테마는 `contrast.test.ts`의 대비 가드를 **자동으로 함께 받는다** — 텍스트 4.5:1,
UI 경계 3:1, 구분선 1.2:1을 모든 테마에 대해 검사하고, Input 은 페이지·카드·filled 세 표면
전부에서 다시 검사한다. 팔레트를 넣고 테스트를 돌리면 어느 조합이 모자란지 정확히 짚어 준다.
color 램프 같은 primitive도 테마에서 자유롭게 덮어쓴다 — 이 저장소가 토큰의 소유자다.

### 시맨틱 패밀리 구성

컴포넌트가 primitive를 직접 참조하지 않도록, 역할별로 패밀리를 맞춰 둔다.

| 패밀리                                                         | 용도                                                                                                                                                                | 소비처                                                                               |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `color.primaryBtn.*` `color.secondaryBtn.*` `color.errorBtn.*` | 버튼 색 역할 3종. 각각 `default`/`hover`/`disabled`/`focusRipple`/`outlinedHover`/`outlinedFocusRipple`                                                             | `button-base`, `fab`, `icon-button`                                                  |
| `color.field.*`                                                | 폼 컨트롤 표면·테두리·포커스 링 (`border`/`borderHover`/`borderStrong`/`surface`/`surfaceSubtle`/`focusRing`/`focusRingPrimary`/`focusRingError`)                   | `input-base`, `boxed-input`, `filled-input`, `plain-input`, `search-field`, `select` |
| `color.selectionControl.*`                                     | 선택 컨트롤이 기존 시맨틱으로 표현할 수 없는 셋 (`checked` 선택된 면·스위치 on 트랙 / `indicator` 그 위의 체크 글리프·라디오 점·thumb / `trackOff` 스위치 off 트랙) | `checkbox`, `radio`, `switch` (react-ui·react-native-ui 모두)                        |

세 버튼 패밀리는 **같은 shape**를 갖는다 — 새 색 역할을 추가할 때 이 6개 키를 그대로 따른다.

`selectionControl` 은 상태를 기계적으로 다 만들지 않는다. 뜻이 같은 상태는 기존 시맨틱을 쓴다 —
unchecked 경계 `field.border`, hover `field.borderHover`, error `stroke.error`, focus
`border.primary.color`, disabled `border.disabled.color`·`background.disable`. pressed 는 색이
아니라 위치라 색 토큰이 없다. base 램프 단계는 밝은 표면용이라 **`dark` 에서만** 다시 잡고
(`ember`·`midnight` 가 물려받는다), 나머지 테마는 base alias 가 자기 램프로 풀린다.
`background.primary` 를 선택된 면으로 쓰지 않는 이유: dark·midnight 에서 표면 대비가 3:1 아래다.

### component 토큰을 만드는 기준

컴포넌트 값은 기본적으로 `react-ui`의 `--ui-*` SCSS 지역 변수에 둔다 —
스코프되고 캐스케이드되며 빌드 비용이 없다. **아래 셋을 모두 만족할 때만** 토큰으로 승격한다.

1. **RN이 필요로 하는가** — RN은 `--ui-*`를 못 쓴다. 웹 전용이면 SCSS에 둔다.
2. **기존 시맨틱으로 표현 불가능한가** — 가능하면 시맨틱을 쓴다.
3. **여러 컴포넌트가 공유하거나 안정적인가**

승격된 것은 셋이다.

| 토큰                             | 왜                                                                                                                    |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `component.field.height.{sm,md}` | `input-base`/`select`가 같은 값(40/52)을 각자 하드코딩. Web `2.5rem`/`3.25rem`, RN `40`/`52`                          |
| `component.field.focusRingWidth` | 폼 필드 포커스 링은 2px, 버튼은 `borderWidth.semantic.focus`(4px)로 서로 다르다. 3개 컴포넌트에 8회 하드코딩돼 있었다 |
| `component.pressedOffset`        | 눌림 깊이. web `.ui-button:active`가 `1px`을 하드코딩했고 RN Button·IconButton은 아직 눌림 표현이 없다                |

**pressed는 색이 아니라 위치다.** `.ui-button:active`는 색을 그대로 둔 채 `translateY`만 주고,
Fab만 그 위에 elevation을 얹는다(`shadow.lg` → `xl`). 그래서 `primaryBtn.pressed` 같은 **색**
토큰은 만들지 않는다 — web에 없는 시각을 RN에 지어내는 셈이 된다. 테마를 타지 않으므로 base
(`tokens/light/component.json`)에만 authoring하고 테마 델타를 두지 않는다.
`contrast.test.ts`의 `describe('pressed 상태 어휘')`가 이 결정 셋을 전부 검사한다.

`component.button`은 소비처가 없어 **internal로 남긴다** — 카테고리 통째 공개가 아니라
path 단위 opt-in이다.

### 접근성 (WCAG) 보장

토큰 **기본값**은 WCAG 2.1 AA 대비를 충족한다. `lib/contrast.ts`의 순수 함수로 계산하고
`contrast.test.ts`가 등록된 **모든 테마** × 실제 컴포넌트 조합을 검사한다 — 색을 바꿔 대비가
내려가면 실패한다.

| 대상                                                                                    | 기준  | 근거                                    |
| --------------------------------------------------------------------------------------- | ----- | --------------------------------------- |
| 본문·보조·링크·오류 텍스트, 버튼 라벨                                                   | 4.5:1 | WCAG 1.4.3                              |
| Input 의 값·장식 아이콘 (페이지·카드·filled 세 표면)                                    | 4.5:1 | WCAG 1.4.3                              |
| 필드 라벨·헬퍼의 모든 상태 (페이지·카드 두 표면)                                        | 4.5:1 | WCAG 1.4.3 — 아래 disabled 항목 참조    |
| Input 테두리 평소/hover/strong/error (세 표면)                                          | 3:1   | WCAG 1.4.11 (UI 경계)                   |
| contained 버튼 라벨의 **hover 면**                                                      | 4.5:1 | WCAG 1.4.3                              |
| outlined·text 라벨과 IconButton 글리프의 hover 틴트                                     | 4.5:1 | WCAG 1.4.3                              |
| 버튼 outline 테두리 = `:focus-visible` 링 (두 표면)                                     | 3:1   | WCAG 1.4.11 + 2.4.7                     |
| 선택된 목록 행의 라벨·보조 설명 (`background.selected` 를 `background.surface` 에 합성) | 4.5:1 | WCAG 1.4.3                              |
| 선택 컨트롤의 경계·선택된 면·off 트랙 (두 표면), 그 위의 글리프·thumb                   | 3:1   | WCAG 1.4.11 (상태를 식별하는 그래픽)    |
| 구분선                                                                                  | 1.2:1 | 장식이라 기준 밖. 안 보이는 것만 막는다 |
| contained 면, 비활성 버튼 라벨, 비활성 선택 컨트롤, 포커스 halo                         | 1.2:1 | 기준 밖 — 아래 참조                     |

**버튼에서 기준 밖인 것 셋.** ① 채워진 버튼의 **면**은 3:1을 요구하지 않는다 — 라벨이 4.5:1을
지키면 버튼은 테두리가 아니라 글자로 식별된다. ② 비활성 버튼 라벨은 native `disabled` 컨트롤
**안**이라 Incidental 면제가 실제로 닿는다. ③ focus **halo**(`focusRipple`)는 outline 테두리
위에 얹는 장식이고, halo를 규정하는 Focus Appearance(2.4.13)는 **AAA**다. 셋 다 "안 보이게
미끄러지는 것"만 막는 가시성 바닥을 건다.

**Input 은 표면을 세 가지로 본다.** plain·boxed 는 배경이 투명해서 뒤의 페이지나 카드가
그대로 인접색이 되고, filled 만 자기 표면(`field.surface`)을 가진다. 한 표면에서만 재면
나머지 두 경우를 놓친다.

**`disabled` 는 어디에 있느냐로 갈린다.** WCAG 1.4.3 의 Incidental 면제는 "비활성 컨트롤에
속한" 텍스트에 닿는데, 그 사실이 드러나는 것과 아닌 것이 있다.

| 위치                           | 기준  | 왜                                                                            |
| ------------------------------ | ----- | ----------------------------------------------------------------------------- |
| 입력 **안**의 값 텍스트·테두리 | 1.2:1 | native `disabled` 안이라 도구도 사람도 비활성임을 안다. 묻히는 것만 막는다    |
| 라벨·헬퍼 (입력의 **형제**)    | 4.5:1 | 비활성임을 말하는 수단이 없다. axe 도 헬퍼 `<p>` 를 면제하지 않고 4.5 를 요구 |

axe 는 `<label for>` 이 비활성 컨트롤을 가리키면 면제하지만 `aria-describedby` 로만 이어진
헬퍼는 면제하지 않는다. 사람 눈에도 같다 — 옆 입력이 비활성이라는 것을 알기 전까지 그 문단은
그냥 읽어야 하는 글이다. 그래서 `text.disable` 은 **라벨·헬퍼 기준으로** 값을 잡는다.

focus **halo** 는 기준 대상이 아니다: 포커스 고지는 테두리 색 변화가 담당하고 halo 는 그 위의
보조 장식이며, Focus Appearance(2.4.13)는 AAA 다.

`BELOW_AA` 는 **비어 있다.** 한때 `text.placeholder`·`border.primary.color`·`stroke.secondary`
가 여기 얼어 있었는데, 원인이 전부 아래 "테마마다 값이 달라야 한다" 였고 테마별 시맨틱
override 로 해결했다. 새 팔레트가 기준에 못 미치면 **여기 넣어 동결하지 말고 그 테마의
시맨틱을 다시 잡는다** — 동결은 기준을 낮추는 것이지 지키는 것이 아니다.

**hover·focus 도 상태다.** `1.4.11` 은 "컴포넌트와 **상태**를 식별하는 시각 정보" 에 3:1 을
요구하므로 포커스 테두리(`border.primary.color`·`stroke.secondary`)도 `INPUT_BOUNDARIES` 에서
평상시 테두리와 같이 검사한다. hover 로 **배경이 바뀌면 그 위의 글자를 다시 재야 한다** —
`*Btn.outlinedHover` 가 그 자리이고, light 용 밝은 틴트를 다크 테마가 물려받아 밝은 글자 +
밝은 배경이 되는 사고가 실제로 있었다 (`primary` 1.16:1).

**테마마다 값이 달라야 한다.** `dark`는 `neutral` 램프를 재정의하지 않는데 표면만 뒤집히므로,
한 값이 세 테마를 동시에 만족하지 못한다 — 시맨틱 토큰에서 테마별로 잡는다.
예: `field.border` = light/sepia `ne500`, dark `ne300`.

`field` 는 **표면까지 테마별로 잡아야 한다.** `dark`가 `surface`·`surfaceSubtle`·`borderStrong`
을 빠뜨리면 light 의 밝은 램프 단계를 그대로 물려받아, dark 계열에서 흰 배경에 흰 글자가 된다
(`dark`를 중간 단계로 끼우는 `ember`·`midnight`도 같이 무너진다).

새 색을 넣을 때는 `contrastRatio()`로 먼저 재고, 통과하는 **최소 단계**를 고른다
(디자인 의도에서 최소한으로 벗어나기 위함).

### motion 카테고리

10번째 카테고리. `transition`/`animation` 값이 4개 컴포넌트에 22회 하드코딩돼 있어 승격했다.

|                                             | Web                             | RN                      |
| ------------------------------------------- | ------------------------------- | ----------------------- |
| `motion.duration.{fast,normal,slow,slower}` | `60ms` `140ms` `650ms` `1200ms` | `60` `140` `650` `1200` |
| `motion.easing.{standard,linear}`           | `ease` `linear`                 | `ease` `linear`         |

`duration`은 dimension과 같은 방식으로 플랫폼이 갈린다 — Web은 `ds/web/duration` transform이
`ms`를 붙이고, RN은 `RN_NUMERIC_TYPES`에 `duration`이 포함돼 숫자로 나간다.
RN의 `Animated.timing({ duration })`이 숫자를 요구하기 때문이다.

### 합성 shadow 변수

`boxShadow`는 sd-transforms가 레이어 자식으로 분해하므로(`--ds-shadow-lg-1-blur` …)
바로 쓸 수 있는 단일 변수가 없었다. `genCss`가 합성본을 함께 만든다.

- `--ds-shadow-{none,xs,sm,md,lg,xl,2xl,inner}` / `--ds-elevation-{0..6}`
- 레이어는 번호 순으로 `, ` 결합, `innerShadow`는 `inset` 접두
- 자식 변수는 **그대로 유지**된다 (기존 소비자 무해)
- Tailwind `boxShadow` 유틸이 이 합성 변수를 가리킨다
- **CSS 전용**이다 — `tokens.json` ABI와 RN 트리는 그대로다. RN은 구조화된 자식 값을
  그대로 쓰는 것이 맞다 (`shadowColor`/`shadowOffset`/`elevation`으로 매핑).

## 표면 경계 (package exports)

**이 패키지는 `private: true`다. 소비자는 절대 설치하지 않는다.**
소비자는 `react-ui` / `react-native-ui`만 설치하고, 이 패키지의 존재를 알 필요가 없다.
따라서 아래 exports map은 **워크스페이스 내부 경계**이고, `dist/`의 internal 모듈이
subpath로 새어 나가는 것을 차단하는 역할이다 (`packageSurface.test.ts`가 고정).

| subpath                             | 누가 쓰나                                                    |
| ----------------------------------- | ------------------------------------------------------------ |
| `.` `/web` `/rn` `/css` `/tailwind` | ui-core (→ react-ui / react-native-ui로 번들되어 소비자에게) |
| `/tokens`                           | ui-core 경유로 다운스트림에 **복사**되어 전달                |

`style-dictionary` / `@tokens-studio/sd-transforms`는 **빌드 도구**다. 런타임 의존이 아니므로
`dependencies`에도 `peerDependencies`에도 넣지 않는다. `dist/`로 나가는 진입점 어디에도
남지 않는다는 사실을 `packageSurface.test.ts`가 고정한다.

`tokens.json`의 positional ABI는 design-tokens → ui-core → react-ui/react-native-ui 로
**복사**되어 흐른다. 생성 지점은 design-tokens 빌드 하나뿐이다.

## 브랜드는 어떻게 추가하나

**이 저장소에서 테마로 추가한다.** 소비자가 컴파일러를 돌리거나 토큰을 재정의하지 않는다.

```
shared-stack
  tokens/<brand>/*.json  +  themes.ts 한 줄
        ↓ pnpm tokens:gen → 빌드
consumer
  @berrypjh/react-ui           <ThemeProvider mode="<brand>">
  @berrypjh/react-native-ui
```

소비자가 하는 일은 `mode`를 그 이름으로 주는 것뿐이다. design-tokens·Style Dictionary는
소비자 쪽에 전혀 나타나지 않는다.

`apps/demo-web` / `apps/demo-mobile`이 이 소비자 역할을 그대로 모델링한다 —
두 앱 모두 `react-ui` / `react-native-ui`만 의존하고 design-tokens를 import하지 않는다.

## SemVer 규칙 (토큰 표면 기준)

Nx fixed release + conventional commits 위에서 토큰 표면 변경을 이렇게 읽는다.
소비자가 실제로 결합하는 것은 `--ds-*` CSS 변수 이름과 `tokens.json`이다.

| 변경                           | 분류         | 커밋/릴리스             |
| ------------------------------ | ------------ | ----------------------- |
| 토큰 신규 추가                 | non-breaking | `feat` → minor          |
| 새 테마 추가                   | non-breaking | `feat` → minor          |
| 토큰 제거 (`--ds-*` 이름 소멸) | **breaking** | `!` → major             |
| 토큰 rename                    | **breaking** | `!` → major             |
| token type 변경                | **breaking** | `!` → major             |
| 값이 눈에 보이게 바뀜          | non-breaking | changelog에 반드시 명시 |

이 표는 사람이 판단한다 — 자동 비교기는 두지 않는다. `tokens.json`을 릴리스 diff에서
직접 읽는 편이 정확하다. 토큰을 지울 때는 **즉시 제거하지 않는다** — 최소 한 번의 minor 동안
새 이름과 함께 남긴다.

## 빌드

```bash
pnpm nx run @berrypjh/design-tokens:build:tokens   # JSON → 산출물
pnpm nx run @berrypjh/design-tokens:build:ts       # 산출물 → dist d.ts/JS
pnpm nx run @berrypjh/design-tokens:build          # 둘 다
```

`build.ts`는 시작 시 `src/.generated/`와 `dist/css/`를 정리해 stale 파일 누적을 막는다.

## Gotcha

- **TS 증분 캐시**: `tsBuildInfoFile`을 `dist/.tsbuildinfo`로 두어 `rm -rf dist`가 곧 클린 빌드가 된다 (react-native-ui 와 같은 관례). 밖에 두면 `dist`만 지웠을 때 tsc가 "최신"으로 판단해 **exit 0 인데 아무것도 emit 하지 않는다** — 산출물이 조용히 사라진다.
- **path 매핑 금지**: `tsconfig.base.json`의 `paths`에 `@berrypjh/design-tokens` 추가하지 말 것. composite project + rootDir 제약과 충돌해 ui-core 빌드가 깨진다. node_modules workspace 심링크로 해결되는 게 정상 경로.
- **`.generated/` 손대지 말 것**: 빌드 중간 산출물. 직접 편집해도 다음 build에서 덮어써짐.
- **base가 첫 항목**: `themes` 배열 순서는 의미가 있다. `baseTheme = themes[0]`을 import해 사용.
- **kebab-case CSS 변수**: `--ds-` prefix 고정. color는 `--ds-x-rgb` 채널 변수도 같이 생성 (Tailwind alpha 유틸용).

## 다운스트림

- `libs/ui-core/src/tokens/*` — `Web.Light.*` 타입을 주축으로 ColorToken, SpacingToken 등을 도출. 구조 변경 시 ui-core 영향 큼.
- `apps/demo-web/src/app/pages/TokensPage.tsx` — `Web.Light.tokens.color/typography/spacing/radius/borderWidth/shadow` 트리를 직접 순회. 카테고리 키 이름 변경 시 깨짐.
- 런타임 테마 전환: 다운스트림은 CSS 변수 (`var(--ds-*)`)에 의존하므로 `tokens.color.x`는 base 테마 값으로 고정 노출되어도 OK.

## 소비자 문서 없음

design-tokens는 `private: true`이고 `AGENTS.consumer.md`도 `dist/AGENTS.md`도 만들지 않는다.
소비자 대상 문서는 `react-ui`/`react-native-ui`가 담당한다. 이 때문에
`tools/scripts/measure-tokens`의 `design-tokens` target 중 `dist/AGENTS.md`를 읽는
시나리오(`agents+catalog`)는 현재 실패한다 — 그 README의 "알려진 제약" 참조.

## Validation

토큰 JSON validation은 SD 파이프라인에 위임. 별도 validator 없음. 잘못된 형식이면 SD가 throw.
