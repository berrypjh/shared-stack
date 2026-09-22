# react-ui 입력 상태 우선순위를 선언 순서에서 떼고 forced-colors 포커스를 복구

입력 · 라벨 · 헬퍼의 상태 규칙을 `:not()` 로 배타화해 `disabled > error > focused` 가 선언 순서나 특정도에 좌우되지 않게 함. forced-colors 에서 사라지던 box-shadow 포커스 링에 outline 을 더함.

## 증상

- disabled · error · focused 가 겹칠 때 어느 색이 이길지가 SCSS 선언 순서와 특정도에 달려 있어, 목표 순서가 보장되지 않음
- Windows 고대비(forced-colors) 모드에서 입력 · 버튼의 포커스 링이 보이지 않음
- `plain-input` 은 disabled 밑줄 색이 비어 있었음

## 원인

- 상태 규칙이 서로 배타적이지 않아 우선순위가 선언 순서와 특정도에 달려 있었음
- forced-colors 는 저자 색을 시스템 색으로 바꾸고 `box-shadow` 를 지움(CSS Color Adjust 1). 포커스를 box-shadow 로만 그린 규칙은 그 모드에서 통째로 사라짐

## 반영

- 입력 세 variant · `input-label` · `form-helper-text` SCSS — `:not()` 배타 규칙
- box-shadow 포커스 규칙마다 `@media (forced-colors: active)` outline, contained 버튼에 `ButtonBorder` 경계
- `libs/react-ui/test/componentStyles.ts` — SCSS 를 실제로 컴파일해 매칭되는 상태 규칙만 검사
- `libs/react-ui/AGENTS.md` Gotcha "forced-colors에서 `box-shadow`는 렌더되지 않는다"

## 검증

- `forcedColors.test.ts` — box-shadow 포커스 규칙에 forced-colors 대응이 있는지 규칙 자체를 검사. variant 를 더하면 목록 수정 없이 걸림
- `inputVariantStates.test.ts` · `InputLabel.test.tsx` · `FormHelperText.test.tsx` — 목표 순서는 RN 리졸버와 같음
- 실제 고대비 모드 렌더는 브라우저에서 눈으로 확인. 자동화된 forced-colors 렌더 테스트는 없음
