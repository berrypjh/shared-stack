# 라디오 · 체크박스 — native 입력을 라벨로 감싸 오른쪽에 글자를 둠

react-ui `Checkbox` · `Radio` 를 만들며 선택 컨트롤의 기준을 정함. 커스텀으로 그리지 않고 native `<input>` 을 그대로 쓰고 모양만 입힘.

## 상황

- 커스텀 라디오 · 체크박스는 키보드 · 선택 상태 · 낭독을 직접 맞춰야 함
- 클릭 영역이 작으면 누르기 어려움

## 판단

native 입력을 쓰고, 라벨로 감싸 누를 자리를 넓힘.

| 판단                                 | 내용                                                                            |
| ------------------------------------ | ------------------------------------------------------------------------------- |
| **라디오는 묶음 + 같은 `name`**      | fieldset(또는 `role="group"`)과 같은 `name` 이 필요                             |
| **라벨은 오른쪽**                    | 라벨을 눌러도 토글                                                              |
| **맥락이 바뀌면 안내**               | 체크박스가 다른 컨트롤을 보이거나 켜면 안내문을 두고 `aria-describedby` 로 이음 |
| **작은 타겟은 키우되 동작은 그대로** | 크기 · 간격을 키워도 키보드 포함 기본 동작은 유지                               |

## 반영

- **native 입력** — `Checkbox` 는 `<input type="checkbox">`, `Radio` 는 `<input type="radio">`. 상태 모양은 `:checked` · `:indeterminate` · `:disabled` · `:focus-visible` 같은 native 선택자가 정함
- **라벨로 감쌈** — `<label>` 이 입력을 감싸고 글자를 입력 뒤에 둠. 라벨이 오른쪽에 서고 라벨을 눌러도 토글됨
- **라디오 묶음** — `RadioGroup` 이 fieldset 과 같은 `name` 을 줌([그룹 기록](2026-09-11-radio-group-guide.md))
- **오류** — `Checkbox` 는 `aria-invalid`. radio 역할은 ARIA 1.2 가 `aria-invalid` 를 지원하지 않아, `RadioGroup` 이 오류 설명을 `aria-describedby` 로 이음

맥락이 바뀌는 체크박스의 안내문은 쓰는 화면의 몫이라 컴포넌트에 없음.

## 검증

- `pnpm nx test @berrypjh/react-ui`

## 참고자료

- [Radio Group Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/) — WAI-ARIA APG. 라디오 그룹의 이름과 방향키 · Tab 동작
