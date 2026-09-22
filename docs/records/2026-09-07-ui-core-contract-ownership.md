# ui-core 에는 두 렌더러가 실제로 구현하는 계약만 두도록 소유권 축소

web 전용 계약(`field` · `menu-item`)과 `utils` 를 ui-core 에서 react-ui 로 옮김. ui-core 에는 웹과 RN 이 같은 불변식을 실제로 구현하는 계약만 남기고, 경계를 테스트로 고정.

## 상황

- ui-core 는 "플랫폼 무관 공유 계층"인데 RN 구현이 없는 계약과 DOM 전제 유틸(`cx`, 폼 값 변환)이 섞여 있었음
- react-ui 는 RN 전용 재export(`Native` · `getColor` · `createTheme` · `RNTokens`)까지 공개 표면에 싣고 있었음
- 무엇이 "공유"인지 코드로 판정할 방법이 없어, 한쪽에만 있는 키도 공유 계약에 올라가던 상태

## 판단

- **공유 계약의 조건은 "두 렌더러가 같은 불변식을 실제로 구현함"** — 계획이나 이름이 같다는 것만으로는 올리지 않음
- **한쪽에만 있는 것은 그쪽이 소유** — RN 구현이 없는 `menu-item`, 한쪽에만 있는 키(`required` · `margin` · `hiddenLabel` · `edge` · `loading`)는 react-ui `src/types/`
- **RN 구현이 생기기 전에는 ui-core 로 올리지 않음**
- **react-ui 공개 표면은 web 으로 좁힘** — RN 전용 재export 는 `src/deprecated.ts` 로 분리하고 다음 major 에 제거. `ThemeDef` 는 제거
- **ui-core `getToken` 은 없는 경로에서 throw** — `undefined` 를 돌려주면 오타가 화면까지 조용히 감

## 반영

- `libs/ui-core` — `field` · `menu-item` · `utils` 삭제, `boundary.test.ts` · `packageSurface.test.ts` · Web/RN parity 테스트 추가, typecheck 가 spec 까지 검사
- `libs/react-ui` — 계약과 `cx` 를 넘겨받고 폼 유틸은 `Select` · `SearchField` 폴더로 분산, `src/deprecated.ts`
- `libs/react-ui/AGENTS.md` 절대 원칙 "시맨틱 계약의 소유자"

## 검증

- `pnpm nx test @berrypjh/ui-core` — 계약 경계 · 공개 표면 · 토큰 parity
- 이후 Button · Field · Divider · Stack 계열은 RN 구현과 함께 ui-core 계약으로 올라감(2026-09-07 ~ 12 커밋들)
