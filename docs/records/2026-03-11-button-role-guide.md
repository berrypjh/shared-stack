# Button 은 역할대로 — 이동은 링크, 실행은 버튼

react-ui `ButtonBase` 를 만들며 버튼 접근성 기준을 정함. 무엇을 그리느냐가 아니라 무엇을 하느냐로 요소와 역할을 고르고, 버튼 흉내를 내는 요소는 버튼이 하는 일을 모두 갖춤.

## 상황

- 버튼 하나가 `<button>` · `<a>` · 임의 요소(polymorphic)로 그려질 수 있어야 함
- 겉모양이 버튼이라도 역할 · 포커스 · 키보드가 어긋나면 보조 기술 사용자에게는 다른 것이 됨

## 판단

겉모양이 아니라 하는 일로 요소와 역할을 고름.

- **페이지 이동이면 링크, 작업 실행이면 버튼** — 역할을 분명히 함
- **링크를 버튼처럼 써야만 하면 셋을 모두 갖춤** — `role="button"`, `tabindex="0"`, Enter · Space 키 처리(기본 동작 막기 포함)
- **pseudo-button(`div` · `span` 등)은 가능하면 피함** — 불가피하면 포커스 · 키보드 · 역할을 모두 맞춤

## 반영

`ButtonBase` 가 무엇으로 그려지느냐에 따라 역할과 키보드 처리를 나눔(`ButtonBase.utils.ts` · `ButtonBase.tsx`).

| 호스트                                            | 그리는 요소 · 역할                     | 키보드                                                                         |
| ------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------ |
| `href` 가 있고 `component` 없음                   | `<a>`, role 없음                       | 링크 기본 동작 그대로                                                          |
| `component` 가 없거나 `'button'`                  | native `<button>`                      | 브라우저 기본 동작                                                             |
| 그 밖의 호스트(`component="a"` 에 `href` 없음 등) | `role="button"` · `tabIndex=0` 을 붙임 | Enter 는 keydown, Space 는 keyup 에서 click. keydown 의 Space 는 스크롤을 막음 |
| 그 밖의 호스트 + `href` · `to`                    | 링크로 보고 role 을 붙이지 않음        | 링크 기본 동작 그대로                                                          |

- **disabled** — 호스트와 상관없이 `tabIndex=-1`. native 버튼은 `disabled` 속성, non-native 는 `aria-disabled` 와 클릭 · 키보드 활성화 차단
- **polymorphic** — `component` prop 으로 호스트를 바꿈

## 검증

- `ButtonBase.test.tsx` 가 확인함 — `href` 면 role 없는 `A`, `href` 없는 `component="a"` 는 `button` 역할, Enter · Space 활성화, disabled 의 `tabIndex=-1`

## 참고자료

- [Building Accessible Buttons with ARIA: A11y Support Series](https://www.deque.com/blog/accessible-aria-buttons/) — Deque Blog. `role="button"` 위젯과 함께 쓰는 `aria-pressed` · `aria-expanded` · `aria-disabled` 의 스크린 리더 · 브라우저 지원
- [Button versus Link](https://a11y-101.com/design/button-vs-link) — A11y 101. 링크는 이동, 버튼은 동작. 버튼은 Enter · Space, 링크는 Enter 로 활성화되고 스크린 리더가 둘을 다르게 읽음
- [Button Examples](https://www.w3.org/WAI/ARIA/apg/patterns/button/examples/button/) — WAI-ARIA APG. non-native 버튼은 `role="button"` · `tabindex="0"` 과 Enter · Space 를 처리하는 JavaScript 가 필요
