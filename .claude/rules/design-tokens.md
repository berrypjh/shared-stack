---
paths:
  - 'libs/design-tokens/**'
---

# design-tokens (`libs/design-tokens`)

Style Dictionary로 DTCG 토큰 JSON(`tokens/<theme>/*.json`)을 CSS 변수 · Web/RN 토큰 객체 · Tailwind preset · `dist/tokens.json`으로 바꾸는 private 패키지. 테마 목록은 `src/themes.ts`(추가 절차는 [테마 추가](#테마-추가)), 카테고리와 top-level 키 매핑은 `src/lib/tokens.ts`가 원본이다.

## 규칙

- **공개 계약은 `--ds-*` 변수 이름, `tokens.json` 형식, `Web.*` · `Native.*` 트리다.** ui-core가 이 트리에서 토큰 타입을 유도하고 소비자가 변수 이름에 결합한다
- **`light`(`themes[0]`)만 풀세트를 갖고, 다른 테마는 base에 있는 키의 값만 덮어쓴다.** 다른 테마에만 넣은 새 키는 산출물에서 빠진다
- **테마 이름은 분위기로 짓고 한 단어 소문자나 camelCase로 한다.** `name`이 생성 namespace가 된다(`deepSea`는 되고 `deep-sea`는 안 된다)
- **토큰 JSON은 DTCG(`$value` · `$type`)와 Tokens Studio `$type` 어휘(`fontSizes` · `boxShadow` 등)로 쓴다**
- **컴포넌트는 primitive 대신 시맨틱 패밀리(`color.primaryBtn` · `field` · `selectionControl` 등)를 참조한다.** 버튼 패밀리는 같은 6개 키를 갖고, 새 색 역할도 그 키를 따른다
- **component 토큰은 세 조건을 모두 만족할 때만 만든다.** RN이 필요로 하고(RN은 react-ui의 `--ui-*` 변수를 못 쓴다), 기존 시맨틱으로 표현할 수 없고, 여러 컴포넌트가 공유하거나 값이 안정적이다. 그 밖은 react-ui `--ui-*`에 둔다
- **component 토큰은 `tokens/light/component.json`에만 쓴다.** 테마를 타지 않는다. `component.button`은 소비처가 없는 internal 토큰이다 — 산출물에는 나가지만 컴포넌트에서 쓰지 않는다
- **pressed는 색이 아니라 위치로 표현한다.** `translateY(component.pressedOffset)`만 주고 Fab만 elevation을 올린다. `primaryBtn.pressed` 같은 색 토큰은 만들지 않는다(`contrast.test.ts`가 검사)
- **모든 테마의 기본값은 WCAG 2.1 AA 대비를 만족한다.** 조합별 기준은 `src/lib/contrast.test.ts`가 원본이다. 한 값이 모든 테마를 만족하지 못하면 시맨틱을 테마별로 잡고, `BELOW_AA`에 넣어 동결하지 않는다
- **disabled 대비는 위치로 갈린다.** 입력 안의 값 · 테두리는 1.2:1 바닥만 보지만, 형제인 라벨 · 헬퍼는 4.5:1이다. `text.disable`은 라벨 · 헬퍼 기준으로 잡는다
- **토큰을 지우거나 이름을 바꾸면 breaking(major)이다.** 한 번 이상의 minor 동안 새 이름과 함께 남긴다. 추가는 minor다

## 테마 추가

브랜드든 다크 모드든 방법은 하나다. 소비자용 override 레이어는 두지 않는다.

1. `tokens/<name>/*.json`에 base 위에 덮어쓸 값만 쓴다. 보통 `primary` · `neutral` 램프와 `background.surface`면 된다. 어두운 테마는 `sourceDirs: ['light', 'dark', '<name>']`로 `dark`를 재사용한다
2. `src/themes.ts`에 항목을 추가하고 `pnpm tokens:gen`
3. `libs/react-native-ui/src/theme/ThemeProvider.tsx`의 `DEFAULT_TOKENS_BY_MODE`에 한 줄 추가한다. RN은 이 단계만 자동이 아니고, 빠뜨리면 react-native-ui typecheck가 깨진다

## 검증

```bash
pnpm tokens:build                                # 토큰 생성 + tsc → dist
pnpm nx run @berrypjh/design-tokens:test
pnpm nx run @berrypjh/design-tokens:typecheck
```

테스트는 생성된 `dist/tokens.json`을 읽는다. 구조를 바꿨으면 ui-core의 `parity.test.ts`, demo-web 테스트, `pnpm tools:check`(소비자 카탈로그)까지 본다.

## Gotcha

- **`HEAD_REWRITE`에 없는 top-level 키는 빌드를 throw시킨다.** 새 top-level 키나 카테고리는 `src/lib/tokens.ts`의 `HEAD_REWRITE`(카테고리는 `TOKEN_CATEGORIES`도)에 먼저 등록한다
- **CSS 변수 이름에는 카테고리가 붙지 않는다.** `color.primary.pr500` → `--ds-primary-pr500`
- **base를 참조할 때는 `themes[0]` 대신 `baseTheme`을 import한다.** 배열 순서가 `tokens.json` 값 순서라 바뀔 수 있다
- **`tsBuildInfoFile`은 `dist/.tsbuildinfo`에 둔다.** 밖에 두면 `dist`만 지웠을 때 tsc가 아무것도 emit하지 않고 성공한다
- **`tsconfig.base.json`의 `paths`에 `@berrypjh/design-tokens`를 넣지 않는다.** composite 제약과 충돌해 ui-core 빌드가 깨진다
