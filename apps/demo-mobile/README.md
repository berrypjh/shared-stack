# @berrypjh/demo-mobile

`@berrypjh/react-native-ui` 를 실제 앱으로 통합했을 때 무엇이 살아 있는지 확인하는 Expo /
React Native 데모입니다. RN 에는 Storybook 에 해당하는 자리가 없어서, 컴포넌트 상태를 눈으로
확인하는 유일한 곳이기도 합니다.

## 실행

```bash
pnpm nx start @berrypjh/demo-mobile       # Expo 개발 서버 (QR 로 기기 연결, i/a 로 시뮬레이터)
pnpm nx build @berrypjh/demo-mobile       # expo export
pnpm nx typecheck @berrypjh/demo-mobile   # tsc (의존 패키지를 먼저 빌드합니다)
```

테스트 타깃은 없습니다. 컴포넌트 동작의 회귀는 `libs/react-native-ui` 의 테스트가 잡고, 이
앱에서 확인하는 것은 통합 결과라서 눈으로 봅니다.

## 구조

홈에서 섹션 목록을 고르면 상세 화면 하나만 보여 줍니다. 상단 칩으로 등록된 테마를 모두 전환할
수 있고, Android 하드웨어 back 은 상세에서 목록으로 돌아갑니다.

`src/app/shell` 이 목록·상세 chrome 과 데모 팔레트·공용 배치를, `src/app/sections` 가 섹션
본문 하나씩을 가집니다. 목록의 정답은 `src/app/shell/nav.ts` 입니다 — 제목과 설명이 거기 모여
있어서 목록의 부제와 상세 헤더가 같은 문장을 씁니다.

작업 규칙·함정은 `AGENTS.md` 에 있습니다.
