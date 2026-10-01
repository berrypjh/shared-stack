# 폼 접근성 기준 — 예측 가능하게, 키보드로, 문제를 구체적으로

W3C WAI 폼 튜토리얼을 기준으로 폼 접근성 원칙을 정리하고, react-ui 폼 컴포넌트가 컨트롤 단위에서 이를 어떻게 따르는지 대조함.

## 상황

- FormControl 을 만들며 폼 컴포넌트를 쌓기 시작함. 이후 InputLabel · FormHelperText · InputBase → TextField · Select · SearchField → Checkbox · Radio · Switch 순으로 더해짐
- 폼은 컨트롤 하나가 아니라 레이블 · 설명 · 오류 · 묶음 · 순서가 함께 맞아야 보조 기술 사용자가 무엇이 일어날지 예측할 수 있음

## 판단

폼은 예측 가능하게, 키보드만으로 다룰 수 있게, 문제는 구체적으로 알림.

| 원칙                  | 내용                                                                                                                                                                                                           |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **논리적 · 간결하게** | 무엇이 일어날지 예측 가능. 관련 컨트롤은 `fieldset` 으로 묶고 간격 · 정렬을 일관되게. 긴 폼은 단계로 나누고 필수 · 핵심 항목을 앞에. 필수만 받는 짧은 폼과 선택 정보를 나눠 입력 부담을 낮춤                   |
| **키보드**            | 기본 HTML 컨트롤을 씀. `tabindex` 는 `0` · `-1` 만. Tab 순서는 시각 순서와 같게. 체크박스 · 버튼은 Space · Enter 로 조작                                                                                       |
| **일관성과 피드백**   | 레이블 위치 · 문구 · 검증 방식을 전반에 같게. 오류는 어느 필드가 · 무엇이 · 어떻게 고치는지 구체적으로, 가능하면 그 필드로 가는 링크. 성공도 알림. 입력 형식은 관대하게, 고위험 작업은 제출 전 미리보기 · 취소 |

## 반영

컴포넌트는 컨트롤 단위의 원칙을 맡음.

| 원칙                 | react-ui                                                                                                                                                                                                                                |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **기본 HTML 컨트롤** | Checkbox · Switch 는 native `<input type="checkbox">`(Switch 는 `role="switch"`). Radio 는 같은 `name` 의 native radio 가 단일 선택 · 방향키 · Tab 정지를 맡음                                                                          |
| **묶음**             | RadioGroup 은 native `<fieldset>` · `<legend>` 로 묶고, legend 가 그룹 이름이 됨. 그룹 `disabled` 도 fieldset 이 모든 선택지에 전함                                                                                                     |
| **레이블 연결**      | TextField 가 `useId` 로 id 를 만들어 InputLabel 의 `htmlFor` 로 잇음                                                                                                                                                                    |
| **설명 · 오류 연결** | helper text id 를 래퍼가 아니라 입력의 `aria-describedby` 에 붙임. `error` 는 `aria-invalid` 로 알리고 소비자 값이 이김. radio 역할은 ARIA 1.2 가 `aria-invalid` 를 지원하지 않아, RadioGroup 은 오류 설명을 `aria-describedby` 로 이음 |
| **`tabindex`**       | 컴포넌트가 직접 쓰는 값은 `0` · `-1` 뿐이고, 그 밖에는 소비자 값을 그대로 넘김                                                                                                                                                          |
| **Space · Enter**    | native 컨트롤은 브라우저 기본 동작. 버튼 흉내 호스트는 [button-role-guide 기록](2026-03-11-button-role-guide.md)                                                                                                                        |

단계형 폼 · 오류 요약 링크 · 성공 알림 · 제출 전 미리보기는 컴포넌트에 없음.

## 검증

- `TextField.test.tsx` — label 이 입력의 accessible name, helperText 가 입력의 accessible description
- `RadioGroup.test.tsx` — fieldset · legend 로 그리고 legend 가 그룹 이름, 그룹 disabled 가 모든 선택지를 막음, error 설명을 `aria-describedby` 로 이음
- `pnpm nx test @berrypjh/react-ui`

## 참고자료

- [Forms Tutorial](https://www.w3.org/WAI/tutorials/forms/) — W3C WAI. 레이블 · 묶음 · 지시 · 검증 · 알림 · 다단계 폼으로 나눠 접근 가능한 폼을 만드는 방법
