# design-tokens 를 ui-core 뒤로 감춤

react-ui · react-native-ui · 앱이 `@berrypjh/design-tokens` 를 직접 import 하던 것을 끊고, design-tokens 는 ui-core 만 알게 함. 토큰을 없애는 것이 아니라 노출 범위를 줄이는 작업.

## 상황

- 구조는 `design-tokens → ui-core → react-ui · react-native-ui` 로 계층적이었지만 사용은 그렇지 않았음. react-ui · react-native-ui · 앱이 모두 design-tokens 를 직접 씀
  - react-ui 는 2026-01-30 부터, react-native-ui 는 2026-02-10 부터 `package.json` 에 design-tokens 의존
  - demo-web 도 토큰 카탈로그 화면 등에서 직접 import
- 처음에는 문제없이 동작하고 구조도 단순해 보였음. 작업을 이어 가며 두 문제가 드러남
  - **변경 전파** — design-tokens 의 카테고리 · 테마 구조를 조금만 바꿔도 직접 import 하던 다운스트림이 함께 흔들림. 토큰 패키지 내부 구조가 너무 많은 곳에 노출됨
  - **사용자 인지 부담** — 버튼 · 입력 컴포넌트를 쓰려고 design-tokens 의 namespace 구조까지 알아야 함. 사용자는 react-ui 를 쓰는 것이지 토큰 시스템 전체를 배우려는 것이 아님

## 판단

- **design-tokens 는 ui-core 만 앎** — 그 아래 패키지는 design-tokens 를 직접 보지 않음
- **ui-core 는 경계면** — 토큰을 흡수하고 필요한 값 · 타입만 플랫폼 UI 패키지에 줌. 공통 타입 몇 개를 모은 패키지가 아니라 design-tokens 내부 구조를 감추고 다운스트림에 안정적인 계약을 주는 자리
- 토큰은 여전히 시스템의 기반. 다만 모든 패키지가 그 내부 구조를 알 필요는 없음. design-tokens 의 변화는 ui-core 안에서 흡수하고 다운스트림은 더 작고 안정적인 인터페이스만 봄

## 검증

- 지금 경계 규칙은 AGENTS.md 의 Package boundary 와 `.claude/rules/ui-core.md`
