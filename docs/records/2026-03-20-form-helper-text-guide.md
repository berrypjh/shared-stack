# 안내문 — 필드 안내는 도움말 텍스트로 두고 입력에 이음

react-ui `FormHelperText` 를 만들며 폼 안내문의 기준을 정함. 필드별 안내는 라벨에 욱여넣지 않고 별도 텍스트로 두어 입력의 설명으로 연결함.

## 상황

- 스크린 리더가 폼 모드로 바뀌면 입력 주변의 글이 잘 전달되지 않음
- 형식 · 필수 여부 같은 안내를 라벨에 모두 넣으면 라벨이 길어지고, placeholder 에 넣으면 입력하는 순간 사라짐

## 판단

안내는 폼 앞과 필드 옆 두 자리에 두고, 필드 안내는 코드로 입력에 이음.

| 판단                           | 내용                                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------------------- |
| **전체 안내는 폼 앞**          | 필수 표시 규칙 · 시간 제한 · 커스텀 컨트롤 조작법. 색만으로 지시하지 않음(예: "빨간색이 필수") |
| **필드 안내는 별도 텍스트**    | 도움말 텍스트를 두고 `aria-describedby` 로 입력에 연결. 라벨이 너무 길어지지 않게              |
| **placeholder 는 안내가 아님** | 사라지고 대비가 낮고 낭독이 불안정                                                             |

## 반영

- **`FormHelperText`** — 필드 옆 도움말을 `<p>` 로 그림
- **입력에 연결** — `TextField` 가 helper text 에 id 를 주고 입력의 `aria-describedby` 에 붙임. 래퍼가 아니라 입력에 붙여야 설명이 전달됨

폼 앞의 전체 안내는 폼을 조립하는 화면의 몫이라 컴포넌트에 없음.

## 검증

- `TextField.test.tsx` — helperText 가 입력의 accessible description 이 되고, `id` 를 기반으로 helper text id 가 이어짐

## 참고자료

- [Form Instructions](https://www.w3.org/WAI/tutorials/forms/instructions/) — W3C WAI. 폼 앞의 전체 안내와 필드별 안내, `aria-describedby` 연결
- [Understanding SC 3.3.2: Labels or Instructions](https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html) — W3C WAI. 입력이 필요한 곳에는 라벨이나 안내를 둠
