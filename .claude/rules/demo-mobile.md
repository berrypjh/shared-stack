---
paths:
  - 'apps/demo-mobile/**'
---

# demo-mobile (`apps/demo-mobile`)

`@berrypjh/react-native-ui`를 **실제 앱으로 통합했을 때** 무엇이 살아 있는지 확인하는 Expo + React Native 앱이다. RN에는 Storybook이 없어 컴포넌트 상태를 눈으로 확인하는 유일한 자리이기도 하다. 화면은 **목록 → 상세**다.

## 규칙

- **그룹은 컴포넌트의 종류로 나눈다.** 원본은 `shell/nav.ts`의 `NAV`다. demo-web과 묶음을 억지로 맞추지 않는다
- **제목 · 설명은 `shell/nav.ts` 한 곳에 둔다.** 목록의 부제와 상세 헤더가 같은 문장이어야 한다
- **색은 `shell/palette.ts`에서 가져온다.** 리터럴 색은 테마를 바꾸면 글자가 배경에 묻힌다. 예외는 테마와 무관한 이미지 내용(`AvatarSection`의 SVG)뿐이다
- **배치는 `shell/layout.tsx`의 `Column` · `Row`로 세운다.** `Stack`을 직접 쓰는 섹션은 그 관계 자체를 보여 주는 `StackSection` · `DividerSection`뿐이다
- **입력마다 `accessibilityLabel`을 준다.** RN에서 보이는 라벨은 입력의 접근 가능한 이름이 아니다

### 섹션 추가

`shell/nav.ts`의 `SectionKey` + `NAV` 항목 → `sections/<Name>Section.tsx` → `App.tsx`의 `SECTIONS`.

## 검증

```bash
pnpm nx typecheck @berrypjh/demo-mobile
pnpm nx build @berrypjh/demo-mobile       # 로컬 expo export
```

테스트가 없다. 회귀는 `libs/react-native-ui`의 테스트가 잡고, 여기서는 기기 · 시뮬레이터에서 눈으로 본다(`start`는 AI 세션에서 실행할 수 없다). 그래서 타입이 검사 역할을 맡는다.

## Gotcha

- **`SECTIONS`의 `Record<SectionKey, ...>`와 `itemFor`의 throw를 없애지 않는다.** 목록에는 보이는데 열면 빈 화면인 상태를 둘이 막는다
- **typecheck는 raw `tsc`가 아니라 `nx typecheck`로 돌린다.** `@berrypjh/react-native-ui` 선언은 lib의 typecheck가 `out-tsc`에 만든다. raw `tsc`만 돌리면 낡은 선언을 읽거나 TS6305로 실패한다
- **Android back은 상세에서만 가로챈다.** 홈에서 가로채면 앱 종료 동작이 사라진다
- **화면을 바꿀 때 `ScrollView`를 새로 만든다**(`key`). 재사용하면 목록의 스크롤 위치가 상세에 남는다
- **`borderWidth`에는 색을 함께 준다.** RN 기본값이 검정이다
