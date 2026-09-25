# @berrypjh/demo-mobile

`@berrypjh/react-native-ui`를 실제 앱으로 통합했을 때 무엇이 살아 있는지 확인하는 Expo · React Native 데모.

RN에는 Storybook에 해당하는 자리가 없어, 컴포넌트 상태를 눈으로 확인하는 유일한 곳이기도 하다.

## 실행

```bash
pnpm nx start @berrypjh/demo-mobile       # Expo 개발 서버 (QR 로 기기 연결, i/a 로 시뮬레이터)
pnpm nx build @berrypjh/demo-mobile       # expo export
pnpm nx typecheck @berrypjh/demo-mobile   # tsc (의존 패키지를 먼저 빌드한다)
```

**test target은 없다.** 컴포넌트 동작의 회귀는 `libs/react-native-ui`의 테스트가 잡고, 이 앱에서 확인하는 것은 통합 결과라 눈으로 본다.

## 구조

홈에서 섹션을 고르면 상세 화면 하나만 보여 준다. 상단 칩으로 등록된 테마를 모두 전환하고, Android 하드웨어 back은 상세에서 목록으로 돌아간다.

| 위치                                    | 내용                                                                            |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| `apps/demo-mobile/src/app/shell`        | 목록 · 상세 chrome, 데모 팔레트, 공용 배치                                      |
| `apps/demo-mobile/src/app/sections`     | 섹션 본문 하나씩                                                                |
| `apps/demo-mobile/src/app/shell/nav.ts` | 목록의 정답. 제목과 설명이 모여 있어 목록의 부제와 상세 헤더가 같은 문장을 쓴다 |

작업 규칙과 함정은 [.claude/rules/demo-mobile.md](../../.claude/rules/demo-mobile.md).
