# 필수 항목 — 보이는 표시와 프로그램 속성을 함께

react-ui `InputLabel` 에 필수 표시를 두며 필수 항목의 기준을 정함. 눈에는 기호로, 보조 기술에는 native `required` 로 알림.

## 상황

- 사용자는 입력을 시작하기 전에 어떤 항목이 필수인지 알아야 함
- 색만으로 표시하면 색각 이상 · 스크린 리더 사용자는 알 수 없음

## 판단

필수는 처음부터 보이게, 색이 아니라 기호 · 글자로, 프로그램으로도 알림.

| 판단                   | 내용                                                                      |
| ---------------------- | ------------------------------------------------------------------------- |
| **처음부터 보이게**    | 라벨에 표시하고, 폼 앞에 "`*` 는 필수" 안내                               |
| **색만으로 표시 금지** | 색과 함께 기호나 글자를 씀. 이미지 표시는 폼 모드에서 건너뛸 수 있어 피함 |
| **프로그램 속성**      | native `required`, 필요하면 `aria-required="true"`                        |

## 반영

- **보이는 표시** — `InputLabel` 이 `required` 면 라벨 뒤에 `*` 를 붙임. 이 기호는 `aria-hidden` 이라 낭독하지 않음
- **프로그램 속성** — `TextField` · `InputBase` 가 `required` 를 native `<input>` 에, `Radio` 가 native radio 에 넘김. `Select` 는 combobox 에 `aria-required` 를 붙임
- **같은 값** — `required` 를 `FormControl` 에 주면 `InputLabel` 이 그 값을 따름

폼 앞의 "`*` 는 필수" 안내는 폼을 조립하는 화면의 몫이라 컴포넌트에 없음.

## 검증

- `pnpm nx test @berrypjh/react-ui`

## 참고자료

- [Marking Required Fields in Forms](https://www.nngroup.com/articles/required-fields/) — Nielsen Norman Group. 필수 항목은 기호로 표시하고 폼 앞에서 그 뜻을 알림
