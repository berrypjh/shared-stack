# 숨긴 라벨 — 화면에서만 숨기고 접근성 트리에는 남김

react-ui `VisuallyHidden` 을 만들며 숨긴 라벨의 기준을 정함. 시각 사용자에게는 문맥으로 충분하지만 보조 기술 사용자에게는 이름이 필요한 자리에 씀.

## 상황

- 검색 입력 + 검색 버튼, 아이콘만 있는 버튼처럼 눈으로는 목적이 분명해도 스크린 리더에는 이름이 없는 컨트롤이 있음
- `display: none` · `visibility: hidden` · `aria-hidden` 은 보조 기술에서도 지움 — 숨기는 것이 아니라 없애는 것

## 판단

시각에서만 숨기고, 이름은 실제 텍스트로 줌.

| 판단                       | 내용                                                                           |
| -------------------------- | ------------------------------------------------------------------------------ |
| **sr-only 로 숨김**        | 화면에서만 숨기고 스크린 리더에는 읽힘                                         |
| **ARIA 라벨은 대안**       | `aria-label` 은 값이 곧 이름, `aria-labelledby` 는 이름이 될 요소의 id 를 참조 |
| **`title` 은 라벨이 아님** | 보조 기술이 라벨로 안정적으로 읽지 않음. 툴팁으로만                            |

## 반영

- **`VisuallyHidden`** — 1px 로 잘라내는 클리핑 패턴. `display: none` · `visibility: hidden` · `aria-hidden` 을 쓰지 않음
- **같은 패턴** — `FormControl` 의 `hiddenLabel`, `Table` 의 `hiddenCaption` 에 이미 있던 방식을 소비자가 쓸 수 있게 꺼냄
- **텍스트로 이름** — `aria-label` 대신 이것을 쓰면 실제 텍스트 노드라서 브라우저 번역 · 글자 선택 · 페이지 내 검색에 걸림. 대표 사용처는 아이콘만 있는 컨트롤

## 검증

- `pnpm nx test @berrypjh/react-ui`

## 참고자료

- [Invisible Content Just for Screen Reader Users](https://webaim.org/techniques/css/invisiblecontent/) — WebAIM. 화면에서만 숨기고 스크린 리더에는 읽히는 CSS 기법
- [Labeling Controls](https://www.w3.org/WAI/tutorials/forms/labels/) — W3C WAI. 문맥으로 목적이 분명할 때의 숨긴 라벨과 `aria-label` · `aria-labelledby`
