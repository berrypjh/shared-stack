# Select — native select 대신 APG select-only combobox 로

react-ui `Select` 를 만들며 선택 컨트롤의 기준을 정함. 모양을 직접 그리기 위해 native `<select>` 가 아니라 WAI-ARIA 의 select-only combobox 패턴으로 구현함.

## 상황

- native `<select>` 는 접근성이 가장 안정적이지만 목록 모양을 바꿀 수 없음
- 커스텀으로 그리면 포커스 · 활성 항목 · 이름 · 필수 · 오류를 ARIA 로 직접 알려야 함

## 판단

모양은 직접 그리되, 동작은 APG 패턴을 그대로 따름.

| 판단                           | 내용                                                                                   |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| **첫 옵션을 라벨로 쓰지 않음** | "도시를 고르세요" 같은 옵션이 라벨을 대신하지 않음. 이름은 라벨이 줌                   |
| **포커스는 trigger 에**        | DOM 포커스는 `role="combobox"` 에 남고, 목록 안 위치는 `aria-activedescendant` 로 알림 |
| **옵션은 탭 순서 밖**          | `role="option"` 은 Tab 으로 가지 않음. Tab 은 목록을 닫고 다음 요소로                  |

## 반영

- **combobox** — trigger 에 `aria-labelledby` · `aria-describedby` · `aria-required` · `aria-invalid` 를 붙임
- **포커스 정책** — 선택 · Escape 뒤에도 포커스는 trigger 에 남음. 목록을 누를 때 mousedown 기본 동작을 막아 포커스를 빼앗지 않음. 바깥을 눌러 닫히면 포커스는 누른 곳을 따라감
- **placeholder** — 값이 없을 때 trigger 에 보이는 글자. 이름은 라벨이 줌

WAI 권고와 다르게 한 것 — `multiple` 을 지원함. 권고는 키보드만으로 비연속 다중 선택이 어렵다며 체크박스 그룹을 대안으로 듦. `optgroup` 같은 옵션 묶음은 없음.

## 검증

- `pnpm nx test @berrypjh/react-ui`

## 참고자료

- [Select-Only Combobox Example](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/) — WAI-ARIA APG. 포커스는 combobox 에 두고 `aria-activedescendant` 로 활성 옵션을 알림
- [Grouping Items in Select Controls](https://www.w3.org/WAI/tutorials/forms/select/) — W3C WAI. 긴 목록은 `optgroup` 으로 묶고, 첫 옵션을 라벨로 쓰지 않음
