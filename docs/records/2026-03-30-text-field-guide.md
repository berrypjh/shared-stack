# 텍스트 입력 — 라벨 · 안내 · 필수를 한 컴포넌트에서 잇고 표준 동작을 씀

react-ui `TextField` 를 만들며 텍스트 입력의 기준을 정함. FormControl · InputLabel · 입력 · FormHelperText 를 한 번에 세우고, 입력 형식과 필수는 native 속성에 맡김.

## 상황

- 소비자가 라벨 · 입력 · 도움말을 따로 조립하면 `htmlFor` · `aria-describedby` 연결을 빠뜨리기 쉬움
- 모바일에서는 입력 type 에 따라 키보드가 달라짐

## 판단

표준 입력 동작을 쓰고, 연결은 컴포넌트가 책임짐.

| 판단                                    | 내용                                                    |
| --------------------------------------- | ------------------------------------------------------- |
| **필수는 표시 + `required`**            | 보이는 표시와 native `required` 로 표준 동작을 씀       |
| **편집 금지는 `readonly`**              | `disabled` 대신                                         |
| **알맞은 입력 type**                    | email · number · password 등. 모바일 키보드도 따라 바뀜 |
| **placeholder 로 라벨을 대신하지 않음** | 사라지고 대비가 낮음                                    |

## 반영

- **연결** — `useId` 로 id 를 만들어 라벨 `htmlFor`, helper text 의 `aria-describedby` 를 입력에 이음
- **native 속성** — `required` · `placeholder` · `type`(기본 `text`) 을 입력에 넘김
- **placeholder 와 라벨 분리** — 입력의 이름은 `label` 이 주고, `placeholder` 는 입력에만 감

인라인 검증 문구의 변화를 `aria-live` 로 알리는 기능은 없음.

## 검증

- `TextField.test.tsx` — label 이 accessible name, helperText 가 accessible description, `id` 로 label · helper 연결

## 참고자료

- [Validating Input](https://www.w3.org/WAI/tutorials/forms/validation/) — W3C WAI. `required` · 입력 type 같은 HTML 표준 검증과 알림
