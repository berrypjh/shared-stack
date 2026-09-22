# demo-mobile 번들에 react-native 가 두 벌 실려 ActivityIndicator 가 터지던 문제

metro 가 워크스페이스의 `react-native` 사본 둘을 모두 번들함. `react-native` 해석을 앱의 사본 하나로 고정하고 `projectRoot` 를 앱으로 되돌림.

## 증상

- demo-mobile dev 번들이 실패하거나, 실행 뒤 `AndroidProgressBar`(ActivityIndicator)에서 "View config getter callback ... must be a function"
- Expo QR 출력도 나오지 않음

## 원인

- 워크스페이스에 `react-native` 사본이 둘. 루트와 앱 · `libs/react-native-ui` 가 서로 다른 사본을 가리킴
- 처음에는 버전 차이(루트 정확 고정 vs peer `~` 범위를 `autoInstallPeers` 가 채움)로 봤지만, RN 0.85 업그레이드 뒤에는 버전이 같아도 peer 조합(`@babel/core` 등)이 다르면 pnpm 이 사본을 따로 깔아 같은 일이 생김(2026-09-16 주석 갱신)
- 네이티브 view config 는 한 사본에만 등록되므로 두 사본이 번들되면 다른 쪽에서 찾지 못함

## 반영

- `apps/demo-mobile/metro.config.js` — `resolveRequest` 에서 `react-native` · `react-native/*` 를 앱 기준(`resolveFromApp`)으로 해석, `projectRoot` 를 앱으로
- `start` target 을 `nx:run-commands` 로 바꿔 Expo QR 출력 복구
- 같은 커밋에서 색을 `shell/palette.ts` 로 모아 테마별 글자 대비 문제 정리

## 검증

- 자동 테스트 없음. demo-mobile 은 test target 이 없고 기기에서 눈으로 확인하는 앱
- AI 세션에서는 Expo 를 띄울 수 없어(포트 바인딩) 사용자 기기에서 확인
