# 입력 컨트롤 — native 입력 위에 포커스 표시와 탭 순서를 지킴

react-ui `InputBase` 를 만들며 입력 컨트롤의 기준을 정함. 커스텀 입력을 새로 만들지 않고 native `<input>` 위에 모양만 입힘.

## 상황

- 입력 variant(boxed · filled · plain)와 TextField · SearchField 가 모두 이 컴포넌트 위에 섬
- 커스텀 · 서드파티 컨트롤은 포커스 · 키보드 · 낭독을 직접 맞춰야 해서 접근성 위험이 큼

## 판단

native 컨트롤을 쓰고, 포커스와 탭 순서는 브라우저 규칙을 따름.

| 판단                            | 내용                                                                          |
| ------------------------------- | ----------------------------------------------------------------------------- |
| **native 컨트롤 우선**          | 포커스 · 키보드 · 폼 동작을 브라우저에서 그대로 받음                          |
| **포커스 표시가 분명함**        | 기본 포커스 표시를 지우면 대신할 것을 둠                                      |
| **탭 순서를 조작하지 않음**     | `tabindex` 는 `0` · `-1` 만                                                   |
| **읽기만 할 입력은 `readonly`** | `disabled` 는 스크린 리더가 읽지 않는 경우가 많음. 읽히게 두고 편집만 막을 때 |

## 반영

- **native 입력** — `id` · `name` · `placeholder` · `required` · `disabled` · `readOnly` · `autoComplete` · `inputMode` 와 `aria-label` · `aria-labelledby` · `aria-describedby` · `aria-invalid` 를 native `<input>` 에 그대로 넘김
- **`readOnly`** — native 속성으로 넘기고 모양 클래스를 따로 둠
- **포커스 표시** — box-shadow 포커스 링에 고대비 모드용 outline 을 함께 둠([forced-colors 기록](2026-09-10-react-ui-forced-colors-and-state-priority.md))
- **`tabindex`** — 컴포넌트가 직접 쓰는 값은 `0` · `-1` 뿐

## 검증

- `forcedColors.test.ts` — box-shadow 포커스 규칙에 forced-colors 대응이 있는지 검사
- `pnpm nx test @berrypjh/react-ui`

## 참고자료

- [Forms Tutorial](https://www.w3.org/WAI/tutorials/forms/) — W3C WAI. native 폼 컨트롤을 쓰면 키보드 접근성 상당 부분이 해결됨
