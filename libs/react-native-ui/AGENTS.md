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
    box/Box.tsx               유일 컴포넌트
    box/index.ts
    index.ts
  utils/
    cx.ts                     deprecated — 공개 API였던 className 유틸. 다음 major에서 제거
    index.ts
  theme/
    ThemeProvider.tsx         RN context 기반 테마
    useTheme.ts               useContext 훅
    index.ts
```

`*.test.tsx`는 같은 폴더 (현재 없음). storybook 없음.

RN 컴포넌트 테스트는 jsdom에서 돌지 않는다 — `react-native`가 트랜스파일되지 않은 소스를
배포해서 vite가 파싱하지 못한다. 테스트를 추가하려면 RN babel preset을 태운 러너가 먼저 필요하다.

## 작업 매트릭스

| 작업                    | 수정 파일                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------- |
| 새 컴포넌트             | `components/<name>/{<Name>.tsx, index.ts}` + `components/index.ts`                    |
| 컴포넌트 prop 변경      | 해당 `<Name>.tsx`의 props 정의 (ui-core contracts 변경 필요 시 거기 먼저)             |
| 토큰 사용               | `getColor(theme, 'path')` (JSX) — `useTheme()` 통해 theme 획득                        |
| 테마 동작 변경          | `theme/ThemeProvider.tsx` (`createTheme(...)` 정책)                                   |
| design-tokens 테마 추가 | `theme/ThemeProvider.tsx`의 `DEFAULT_TOKENS_BY_MODE`에 한 줄 (누락 시 typecheck 실패) |

## 빌드 / 테스트

```bash
pnpm nx build @berrypjh/react-native-ui          # rollup(JS) + dts-bundle-generator(d.ts) + llm-catalog
```

`test` target은 **없다** — 테스트 파일도 vitest 설정도 아직 없어서 `pnpm nx test @berrypjh/react-native-ui`는 실행되지 않는다. typecheck는 `tsc -p libs/react-native-ui/tsconfig.lib.json`으로 가능.

빌드 산출물: `dist/{index.esm.js, index.d.ts, AGENTS.md, tokens.json, llm-catalog.json, README.md}`. d.ts는 `dts-bundle-generator`로 단일 파일, ui-core/design-tokens 타입을 inline. `llm-catalog.json`은 build 마지막 단계가 만든다 (`tools/scripts/generate-consumer-catalog`).

## Gotcha

- **dts-bundle-generator + composite**: build 시 loose `dist/src/**/*.d.ts`가 생기지만 project.json의 cleanup 단계가 정리. 새 빌드 단계 추가 시 cleanup 순서 유지.
- **ui-core 직접 import 금지**: 외부에 `@berrypjh/ui-core`를 import하라고 안내 X. react-native-ui가 캡슐화 — ui-core export는 react-native-ui index를 통해 패스스루.
- **테마 맵은 손으로 채운다**: `DEFAULT_TOKENS_BY_MODE`는 `satisfies Record<ThemeName, RNTokens>`다. design-tokens에 테마가 늘면 여기서 컴파일이 깨지는 것이 정상 — `Partial`이나 `Record<string, …>`로 넓혀 에러를 지우지 말 것. 빠진 테마는 `mode`로 선택 가능하고 그러면 `tokens`가 `undefined`가 되어 렌더에서 터진다.
- **`Native` namespace**: 정적 토큰 트리. RN-specific transforms(예: shadow → boxShadow object) 적용된 값. 런타임 테마 전환은 `ThemeProvider` + CSS 변수 대안인 context value 사용.
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
