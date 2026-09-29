# editorial 테마 짝(ivory · charcoal)과 DevHub 의 ThemePair 추가

warm editorial 팔레트를 `ivory`(라이트) · `charcoal`(다크) 토큰 테마로 정식 등록하고, devhub-ui 의 논리 모드(라이트 · 다크)와 실제 토큰 테마를 선택 설정 `ThemePair` 로 분리. 기본 짝은 `light` · `dark` 그대로이고, shared-stack DevHub 도 기본 짝을 씀.

## 상황

- DevHub 에 warm monochrome editorial 모양(ivory 캔버스 · charcoal 잉크 · wood · stone 강조)을 쓸 수 있어야 함
- devhub-ui 의 테마 런타임은 논리 모드 값(`light` · `dark`)을 그대로 `<html data-theme>` 에 씀. `currentTheme()` 은 `'dark'` 와만 비교해 다른 토큰 테마를 쓰면 스위치 상태가 어긋남
- devhub-ui 는 공개 패키지이고 snapdone DevHub 도 옮겨 올 대상. 기본 동작을 바꾸면 그쪽이 함께 바뀜
- 기존 `light` 는 모든 테마의 base 이고, `dark` 는 `ember` · `midnight` 가 `sourceDirs` 로 물려받음. 둘의 값을 바꾸면 등록된 모든 테마와 react-ui · react-native-ui 소비자가 함께 바뀜

## 판단

- **기존 `light` · `dark` 값을 바꾸지 않음** — 영향 범위가 모든 테마와 모든 소비자. 새 테마 추가는 규칙상 non-breaking 확장 경로
- **`ivory` · `charcoal` 을 정식 `ThemeName` 으로 추가** — `ivory` 는 `['light', 'ivory']`, `charcoal` 은 dark 의 시맨틱 재지정을 재사용하는 `['light', 'dark', 'charcoal']`. 이름은 분위기이고 앱 이름이 아님. color 만 덮어쓰고 radius · spacing · typography 는 바꾸지 않음 — `radius.lg` · `xl` 은 버튼 · 검색 칸도 써서 테마로 낮추면 컨트롤 모양이 바뀜
- **논리 모드와 토큰 테마를 분리** — `ThemeMode`(`light` · `dark`)는 그대로 두고, 모드마다 쓸 테마를 `ThemePair` 가 정함. 스위치는 계속 라이트 · 다크 두 버튼
- **선택 설정으로만 넓힘** — `DevHubConfig.themePair?` · `ThemeSwitch` 의 `themePair?` · `currentTheme(pair?)` · `applyTheme(mode, pair?)` · `createThemeScript(pair?)`. 기본은 `DEFAULT_THEME_PAIR`(`light` · `dark`)라 짝을 넘기지 않으면 DOM 결과가 같음
- **저장값은 모드** — `devhub-theme` 에 `light` · `dark` 만 남김. 짝을 바꾸거나 되돌려도 저장된 선택을 옮기지 않고 그대로 씀
- **editorial 모양은 테마 선택자 아래에서만** — 셸에 스타일 없는 `devhub-*` 훅 클래스를 두고, `styles.css` 의 `:root:is([data-theme='ivory'], [data-theme='charcoal'])` 블록만 모양을 걺. 기본 짝에서는 아무것도 매칭되지 않음
- **shared-stack DevHub 는 기본 짝을 유지** — editorial 짝을 연결해 화면까지 확인했지만, 앱은 `light` · `dark` 로 두기로 함. 짝을 쓰는 앱은 `DevHubProvider` 에 `themePair` 를 넘기고 첫 paint 스크립트를 `createThemeScript(pair)` 로 만들며, 다크 테마의 `color-scheme: dark` 를 스스로 둠(devhub-ui README)

## 반영

- `libs/design-tokens` — `tokens/ivory/color.json` · `tokens/charcoal/color.json`, `src/themes.ts` 등록. 산출물은 `pnpm tokens:gen` 이 생성(`Web.Ivory` · `Web.Charcoal` · `Native.Ivory` · `Native.Charcoal`)
- `libs/react-native-ui` — `ThemeProvider.tsx` 의 `DEFAULT_TOKENS_BY_MODE` 두 줄, 테스트의 `customMap` 두 줄. `satisfies Record<ThemeName, RNTokens>` 는 그대로
- `libs/devhub-ui` — `theme/theme.ts`(`ThemePair` · `DEFAULT_THEME_PAIR` · `createThemeScript`), `theme-switch`, `provider/devhub-provider.tsx`, `shell/top-bar.tsx`, 훅 클래스(`workspace` · `explorer` · `canvas-viewport`), `styles.css` 의 editorial 블록, `theme/theme.spec.ts`, `CustomThemePair` 이야기
- `apps/devhub` — `theme-script.spec.ts` 가 `index.html` 인라인 스크립트를 devhub-ui `themeScript` 와 모든 입력에서 대조

## 검증

- design-tokens 테스트가 등록된 모든 테마로 대비 조합을 검사함(`contrast.test.ts`). 기준값 · `BELOW_AA` 는 그대로
- ui-core `parity.test.ts` 가 `keyof typeof Web` · `Native` 와 `Capitalize<ThemeName>` 의 일치를 타입으로 확인. react-native-ui 는 `satisfies` 가 빠진 테마를 컴파일 오류로 잡음
- demo-web 의 테마 선택은 레지스트리에서 만들어져 `pages.spec.tsx` 가 개수를 대조
- devhub-ui `theme.spec.ts` — 기본 짝 · 사용자 짝 적용, 모드 되읽기, 저장값이 모드뿐인지, 모르는 저장값의 OS 대체, 저장소 차단, 첫 paint 스크립트와 `applyTheme` 의 일치
- 기본 짝(`light` · `dark`)에서는 editorial 블록이 매칭되지 않음 — 빌드된 앱에서 구역 각 · 제목 크기 · 작업 영역 배경이 이전과 같음을 계산된 스타일로 확인
