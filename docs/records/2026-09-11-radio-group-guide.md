# 그룹 — 라디오는 native fieldset · legend 로 묶음

react-ui `RadioGroup` 을 만들며 컨트롤 묶음의 기준을 정함. 그룹 시맨틱은 ARIA 로 덧씌우지 않고 native `<fieldset>` · `<legend>` 에 맡김.

## 상황

- 라디오 버튼은 하나씩으로는 의미가 없고, 무엇을 고르는 그룹인지가 함께 전달돼야 함
- 같은 그룹의 라디오는 `name` 이 같아야 단일 선택과 키보드 동작이 맞음

## 판단

그룹은 native 로 묶고, 보이는 라벨이 없을 때만 ARIA 로 이름을 줌.

| 판단                          | 내용                                                                          |
| ----------------------------- | ----------------------------------------------------------------------------- |
| **fieldset · legend 가 정석** | 라디오 그룹에 가장 권장. legend 는 fieldset 의 첫 자식이고 페이지 안에서 유일 |
| **fieldset 중첩은 피함**      | 스크린 리더 사용자에게 혼란                                                   |
| **같은 `name`**               | 동작과 접근성 모두에 필요                                                     |
| **`role="group"` 은 대안**    | 모양을 건드리지 않고 논리적 묶음만 만들 때, 라벨 요소와 `aria-labelledby`     |

## 반영

- **native 묶음** — `RadioGroup` 이 `<fieldset>` 을 그리고, 보이는 라벨이 있으면 첫 자식 `<legend>` 로 둠. legend 가 그룹 이름이 됨
- **ARIA 를 덧씌우지 않음** — fieldset 의 native 시맨틱에 역할을 더하지 않음. 보이는 라벨이 없으면 legend 없이 aria 이름을 씀
- **같은 `name`** — 그룹의 `name` 을 모든 `Radio` 에 넘김. 단일 선택 · 방향키 · Tab 정지 · form reset 은 native radio 가 맡음
- **그룹 `disabled`** — native fieldset `disabled` 로 모든 선택지를 막음

## 검증

- `RadioGroup.test.tsx` — fieldset · legend 로 그리고 legend 가 그룹 이름, native fieldset 에 ARIA 역할을 덧씌우지 않음, 보이는 라벨이 없으면 aria 이름, 그룹 disabled

## 참고자료

- [Grouping Controls](https://www.w3.org/WAI/tutorials/forms/grouping/) — W3C WAI. 라디오 · 체크박스는 fieldset · legend 로 묶고, 모양을 건드리지 않을 때는 `role="group"`
