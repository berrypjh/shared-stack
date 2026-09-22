# RN ThemeProvider 가 새로 등록된 테마 넷을 몰라 렌더에서 터지던 문제

`DEFAULT_TOKENS_BY_MODE` 에 amber · ember · frost · midnight 가 빠져 있었음. `satisfies Record<ThemeName, RNTokens>` 로 바꿔 테마가 늘면 typecheck 가 먼저 깨지게 함.

## 증상

- RN 앱에서 `mode="amber"` 처럼 새 테마를 고르면 `tokens` 가 `undefined` 가 되어 첫 렌더에서 예외
- 웹은 같은 테마가 정상 — CSS 변수는 테마 레지스트리에서 생성되기 때문

## 원인

- design-tokens 는 테마 레지스트리에 7개를 등록했지만 RN `ThemeProvider` 의 모드 → 토큰 표는 손으로 적은 3개뿐
- 표의 타입이 넓어서(`Record<string, …>` 성격) 빠진 키가 컴파일에서 드러나지 않음

## 반영

- `libs/react-native-ui/src/theme/ThemeProvider.tsx` — 표에 넷을 추가하고 `satisfies Record<ThemeName, RNTokens>` 로 고정. docstring 에 "넓혀서 에러를 지우지 말 것"
- 같은 커밋에서 RN 공개 표면을 RN 으로 좁힘 — `Web` · `cx` 는 deprecated, `ThemeDef` 제거

## 검증

- design-tokens 에 테마를 하나 더하면 `pnpm nx typecheck @berrypjh/react-native-ui` 가 실패함
- `ThemeProvider.test.tsx` — 레지스트리 이름마다 `Native` namespace 가 있는지 확인
