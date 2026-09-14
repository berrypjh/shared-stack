# demo-mobile

## 왜 있나

`@berrypjh/react-native-ui` 를 **실제 앱으로 통합했을 때** 무엇이 살아 있는지 확인하는 도구다.
react-ui 쪽의 Storybook 에 해당하는 것이 RN 에는 없으므로, 이 앱이 컴포넌트 상태를 눈으로
확인하는 유일한 자리이기도 하다.

화면은 **목록 → 상세**다. 섹션을 한 스크롤에 쌓으면 원하는 컴포넌트를 찾을 수 없다.

그룹은 컴포넌트의 **종류**로 나눈다 — Input / Action / Layout / Identity / Foundation.
demo-web 은 같은 나눔이 아니다(검증 / Foundation / 컴포넌트 / Layout). 그쪽은 Storybook 이
컴포넌트 전체를 담당해서 사이드바가 작업 단위로 갈리고, 여기는 컴포넌트 전체가 이 목록에
올라오기 때문에 종류별 묶음이 찾기 쉽다. **두 앱의 묶음을 억지로 맞추지 않는다.**

---

## 절대 원칙

- **라이브러리를 고치지 않는다.** `libs/react-native-ui` 수정이 필요하면 그 패키지에서 한다.
- **소비자처럼 쓴다.** import 는 `@berrypjh/react-native-ui` 하나. `@berrypjh/ui-core`·
  `@berrypjh/design-tokens` 를 직접 import 하지 않는다 — 소비자에게 그 경로가 없다.
- **색을 하드코딩하지 않는다.** 모든 색은 `shell/palette.ts` 에서 온다. 실제로 예전 데모에는
  `#0f172a`·`#fff` 리터럴과 color 가 아예 없는 `Text` 가 섞여 있어서, 테마를 바꾸면 글자가
  배경에 묻혔다.
- **제목·설명은 `shell/nav.ts` 한 곳에 있다.** 목록의 부제와 상세 헤더가 같은 문장이어야
  한다. 화면마다 따로 적으면 한쪽만 고치는 드리프트가 생긴다.
- **접근성은 데모에서도 지킨다.** RN 에서 보이는 라벨은 입력의 접근 가능한 이름이 아니다 —
  입력마다 `accessibilityLabel` 을 준다.

---

## 파일

```
index.js                   Expo 진입점
app.json / eas.json        Expo · EAS 설정
metro.config.js            Metro (모노레포 경로 해석)
src/app/
  App.tsx                  테마 상태 · 목록/상세 전환 · SECTIONS 매핑
  shell/
    nav.ts                 정보 구조 — SectionKey · NAV(제목+설명) · itemFor
    NavList.tsx            홈 목록 (그룹 제목 + 항목 행)
    DetailBar.tsx          상세 뒤로가기 바
    Section.tsx            제목·설명이 붙은 카드형 구역
    ThemeToggle.tsx        등록된 테마 전체를 나열하는 칩 목록
    palette.ts             데모 색의 단일 출처 (useTheme 기반)
    layout.tsx             섹션 공용 배치 — Column · Row. 라이브러리 Stack 으로 세운다
  sections/
    {Name}Section.tsx      섹션 본문 하나
```

---

## 작업 매트릭스

| 작업           | 수정 파일                                                                                       |
| -------------- | ----------------------------------------------------------------------------------------------- |
| 섹션 추가      | `shell/nav.ts` 의 `SectionKey` + `NAV` → `sections/{Name}Section.tsx` → `App.tsx` 의 `SECTIONS` |
| 정보 구조 변경 | `shell/nav.ts`                                                                                  |
| 데모 색 추가   | `shell/palette.ts` (화면에서 리터럴을 쓰지 않는다)                                              |
| 공용 레이아웃  | `shell/layout.tsx` (`StyleSheet` 에 gap·flexDirection 리터럴을 두지 않는다)                     |

---

## 검증

```bash
pnpm nx typecheck @berrypjh/demo-mobile   # tsc (의존 패키지를 먼저 빌드한다)
pnpm nx start @berrypjh/demo-mobile       # 기기·시뮬레이터에서 눈으로 확인
pnpm nx build @berrypjh/demo-mobile       # expo export
```

테스트 파일도 `test` 타깃도 없다. 컴포넌트 동작의 회귀는 `libs/react-native-ui` 의 테스트가
잡고, 여기서 확인하는 것은 통합 결과라서 눈으로 본다. 그래서 **타입이 검사 역할을 크게 맡는다**
— `SECTIONS` 의 `Record` 와 `itemFor` 의 throw(아래 Gotcha)를 없애지 말 것.

---

## Gotcha

- **`SECTIONS` 는 `Record<SectionKey, ...>` 다.** `SectionKey` 에 키를 더하면 여기서 컴파일
  에러가 난다 — 목록에는 보이는데 열면 빈 화면인 상태를 타입이 막는다.
- **`itemFor` 는 없는 키에 throw 한다.** `NAV` 가 `SectionKey` 를 모두 덮는지는 타입이 아니라
  이 단언이 지킨다.
- **raw `tsc` 로 돌리면 컴포넌트를 못 찾는다.** project reference 가 `react-native-ui` 의 빌드
  산출물을 보기 때문이다. `nx typecheck` 는 `^build` 를 먼저 돌리므로 그쪽을 쓴다.
- **Android back 은 상세에서만 가로챈다.** 홈에서는 구독하지 않아 앱 종료 동작이 그대로 남는다.
- **화면을 바꿀 때 `ScrollView` 를 새로 만든다** (`key`). 재사용하면 목록에서 내려둔 스크롤
  위치가 상세에 그대로 남아 중간부터 보인다.
- **`Stack` 과 `Box` 는 책임이 다르다.** `Box` 는 면·여백·모서리, `Stack` 은 1차원 배치다.
  둘 다 필요하면 겹쳐 쓴다.
- **배치는 `shell/layout.tsx` 의 `Column`·`Row` 로 세운다.** 예전에는 `StyleSheet` 가 gap
  리터럴(12 · 10)을 들고 있어서, 라이브러리에 `Stack` 이 생긴 뒤에도 데모의 배치만 토큰 밖에
  남아 있었다. 섹션에서 직접 `Stack` 을 쓰는 것은 **Stack 자체를 보여 주는 곳**(`StackSection`)
  뿐이다.
- **`borderWidth` 만 주면 테두리가 검정이 된다.** RN 기본값이다. 색은 반드시 팔레트에서 함께
  준다 — `palette.ts` 가 있는 이유가 이 부류의 실수다.
