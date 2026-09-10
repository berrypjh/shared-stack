# react-native-ui

## 절대 원칙

- **RN 전용**: React Native renderer · 모바일 네이티브 인터랙션 전제. DOM/web-only API 금지. 양 플랫폼이 쓸 코드는 ui-core로 올린다.
- **ui-core 캡슐화**: react-native-ui 소비자는 `@berrypjh/ui-core`·`@berrypjh/design-tokens`를 모른다. 컴포넌트 prop은 ui-core contracts를 wrap해 노출.
- **accessibility는 필수**: RN role · label · hint · disabled · focus 동작은 변경 시 보존.
- **토큰만 사용**: 색·spacing·radius 하드코딩 금지. `getColor` + `Native` namespace 활용. 다크모드는 `ThemeProvider`가 처리.
- **단일 사용처면 react-native-ui가 아님**: 양 플랫폼이 쓸 로직은 ui-core, 한 컴포넌트 안에서만 쓰면 그 컴포넌트 폴더로.

## 파일 (전부)

```
src/
  index.ts                    public re-export (components/theme + ui-core 패스스루)
  components/
    box/{Box.tsx, index.ts}
    button-base/              내부 Pressable 동작 원시 — 배럴 없음(비공개)
      {ButtonBase.tsx, ButtonBase.types.ts, ButtonBase.test.tsx}
    button/{Button.tsx, Button.types.ts, Button.styles.ts, index.ts}
    fab/{Fab.tsx, Fab.types.ts, Fab.styles.ts, index.ts}
    icon-button/{IconButton.tsx, IconButton.types.ts, IconButton.styles.ts, index.ts}
    form-control/             FormControl + 비공개 Context/hook
      {FormControl.tsx, FormControl.types.ts, FormControlContext.ts, useFormControl.ts, index.ts}
    form-helper-text/{FormHelperText.tsx, .types.ts, .styles.ts, index.ts}
    input-label/{InputLabel.tsx, .types.ts, .styles.ts, index.ts}
    input-base/               내부 TextInput 동작 원시 — 배럴 없음(비공개)
      {InputBase.tsx, InputBase.types.ts, InputBase.styles.ts, InputBase.test.tsx}
    plain-input/{PlainInput.tsx, PlainInput.types.ts, index.ts}
    filled-input/{FilledInput.tsx, FilledInput.types.ts, index.ts}
    boxed-input/{BoxedInput.tsx, BoxedInput.types.ts, index.ts}
    text-field/               합성 계층 — 상태를 갖지 않는다
      {TextField.tsx, TextField.types.ts, index.ts}
    search-field/             검색 입력 + 지우기 + 제안 목록
      {SearchField.tsx, .types.ts, .styles.ts, .suggestions.ts, index.ts}
    select/                   Pressable 트리거 + 코어 Modal
      {Select.tsx, .types.ts, .styles.ts, .selection.ts, index.ts}
    segment-control/          controlled 전용 상호배타 선택
      {SegmentControl.tsx, .types.ts, .styles.ts, index.ts}
    index.ts                  공개 배럴 (위 컴포넌트 전부)
  utils/
    cx.ts                     deprecated — 공개 API였던 className 유틸. 다음 major에서 제거
    index.ts
  theme/
    ThemeProvider.tsx         RN context 기반 테마
    useTheme.ts               useContext 훅
    index.ts
  test/rn-test-harness.test.tsx   러너 자체를 검증하는 스모크
```

`*.test.tsx`는 같은 폴더. storybook 없음.

**`components/<name>/index.ts` 는 "공개 컴포넌트" 표시다.** `tools/scripts/generate-consumer-catalog`
의 테스트가 그 배럴의 export 가 전부 소비자 카탈로그에 실렸는지 검사한다. 그래서 내부
`ButtonBase`·`InputBase` 와 `FormControlContext`·`useFormControl` 에는 배럴이 없다 — 만드는 순간 공개 API 로 승격되거나 그 테스트가 깨진다.

RN 컴포넌트 테스트는 jsdom이 아니라 **jest + RN preset**에서 돈다 (`jest.config.cjs`).
`react-native`가 Flow 소스를 그대로 배포해서 vite/jsdom으로는 파싱되지 않기 때문이다.

## 작업 매트릭스

| 작업                    | 수정 파일                                                                              |
| ----------------------- | -------------------------------------------------------------------------------------- |
| 새 공개 컴포넌트        | `components/<name>/{<Name>.tsx, index.ts}` + `components/index.ts` (+ 카탈로그 등재)   |
| 새 내부 원시            | `components/<name>/` 에 배럴 **없이** 둔다 (ButtonBase 참고)                           |
| Button 계열 동작 변경   | `button-base/ButtonBase.tsx` (누름·접근성·터치 타깃 공통) 또는 각 `*.styles.ts`        |
| Input 계열 동작 변경    | `input-base/InputBase.tsx` (편집·포커스·접근성·장식 공통)                              |
| Input variant 시각 변경 | `input-base/InputBase.styles.ts` 의 `chromeSpec`/`surfaceFor` — variant 분기가 한 곳   |
| 합성 컴포넌트 동작 변경 | `text-field/TextField.tsx` (상태 없음 — 소유권은 FormControl·Input 에 있다)            |
| 제안/선택 목록 동작     | `search-field/SearchField.tsx` · `select/Select.tsx` (공유 프레임워크 없음, 각자 소유) |
| 컴포넌트 prop 변경      | 해당 `<Name>.tsx`의 props 정의 (ui-core contracts 변경 필요 시 거기 먼저)              |
| 토큰 사용               | `getColor(theme, 'path')` (JSX) — `useTheme()` 통해 theme 획득                         |
| 테마 동작 변경          | `theme/ThemeProvider.tsx` (`createTheme(...)` 정책)                                    |
| design-tokens 테마 추가 | `theme/ThemeProvider.tsx`의 `DEFAULT_TOKENS_BY_MODE`에 한 줄 (누락 시 typecheck 실패)  |

## 빌드 / 테스트

```bash
pnpm nx build @berrypjh/react-native-ui          # rollup(JS) + dts-bundle-generator(d.ts) + llm-catalog
pnpm nx test @berrypjh/react-native-ui           # jest + RN preset (jsdom 아님)
pnpm nx typecheck @berrypjh/react-native-ui      # tsc --build (lib + spec)
```

**build 성공이 typecheck 성공을 대신하지 않는다.** `build-types`는 `--no-check`로 돌아서
타입 에러를 잡지 못한다. 타입 수준 계약(계약 테스트·`@ts-expect-error`)은 typecheck에서만 깨진다.

빌드 산출물: `dist/{index.esm.js, index.d.ts, AGENTS.md, tokens.json, llm-catalog.json, README.md}`. d.ts는 `dts-bundle-generator`로 단일 파일, ui-core/design-tokens 타입을 inline. `llm-catalog.json`은 build 마지막 단계가 만든다 (`tools/scripts/generate-consumer-catalog`).

## Gotcha

- **dts-bundle-generator + composite**: build 시 loose `dist/src/**/*.d.ts`가 생기지만 project.json의 cleanup 단계가 정리. 새 빌드 단계 추가 시 cleanup 순서 유지.
- **ui-core 직접 import 금지**: 외부에 `@berrypjh/ui-core`를 import하라고 안내 X. react-native-ui가 캡슐화 — ui-core export는 react-native-ui index를 통해 패스스루.
- **테마 맵은 손으로 채운다**: `DEFAULT_TOKENS_BY_MODE`는 `satisfies Record<ThemeName, RNTokens>`다. design-tokens에 테마가 늘면 여기서 컴파일이 깨지는 것이 정상 — `Partial`이나 `Record<string, …>`로 넓혀 에러를 지우지 말 것. 빠진 테마는 `mode`로 선택 가능하고 그러면 `tokens`가 `undefined`가 되어 렌더에서 터진다.
- **`Native` namespace**: 정적 토큰 트리. RN-specific transforms(예: shadow → boxShadow object) 적용된 값. 런타임 테마 전환은 `ThemeProvider` + CSS 변수 대안인 context value 사용.
- **세 입력 variant 타입은 일부러 중복이다**: `PlainInputProps`·`FilledInputProps`·`BoxedInputProps`가 docstring 빼고 같은 목록을 반복한다. 공유 타입으로 묶어 실제로 재어 봤다 — 선언 번들은 2.9KB 줄지만 그 공유 타입이 **공개 심볼로 하나 늘어난다**(카탈로그 250 → 251). 소비자가 쓰지 않는 타입을 공개 API에 더하는 값이라 묶지 않는다. 셋은 각각 독립된 공개 API이고, 목록이 갈라지는 것은 각 테스트의 `Expect<Equal<keyof XProps, keyof BaseWithoutVariant>>` 가드가 막는다. (예전 주석은 "재사용하면 내부 타입이 끌려 올라간다"고 했는데 그건 사실이 아니다 — `InputContainerStyle`은 이미 공개 선언에 있다.)
- **demo-mobile typecheck**: composite project + dts-bundle-generator 조합으로 nx typecheck가 TS6305 발생 가능. 직접 `tsc --noEmit -p tsconfig.app.json`은 통과.

## 다운스트림 영향

- `apps/demo-mobile` — 모든 import는 `@berrypjh/react-native-ui` 단일.
- 컴포넌트 prop 변경 시 demo-mobile App.tsx도 동시 갱신.
- ui-core 토큰/타입 변경은 react-native-ui src/index.ts re-export 라인 동기화로 흡수.

## 변경 체크리스트

- [ ] RN 전용인가? (양 플랫폼이면 ui-core)
- [ ] ui-core를 직접 노출(소비자 import 안내)하지 않는가?
- [ ] accessibility 회귀 없는가? (role/label/hint/disabled/focus)
- [ ] 토큰 사용 — 하드코딩 색/spacing/radius 없는가?
- [ ] `components/index.ts` re-export 동기화했는가?
