# 공유 prop 계약을 ui-core 로 모음

두 플랫폼 패키지가 따로 갖던 prop 타입을 ui-core 한 곳으로 모음. design-tokens 직접 import 를 끊은 흐름은 [별도 기록](2026-04-22-design-tokens-behind-ui-core.md).

## 상황

- `BoxProps` · `ButtonProps` 같은 prop 타입이 두 패키지에 각각 있었음
- 두 플랫폼은 렌더링만 다르고 사용자가 보는 prop API 는 같아야 함. 디자인 시스템이 있는 이유에 가까움
- 가장 모호했던 것은 ThemeProvider
  - 웹은 CSS 변수와 `data-theme` 셀렉터로 끝나 토큰 객체를 런타임에 들고 다니지 않음
  - RN 은 CSS 가 없어 토큰 객체를 context 로 내려야 함
  - 구현은 다른데 둘 다 `mode` 하나만 받아야 함. 그 타입을 한쪽 플랫폼 패키지에 두면 반대쪽이 그 패키지를 끌고 오고, design-tokens 에 두면 토큰 패키지가 React 런타임 가정을 알게 됨

## 판단

- **ui-core 는 플랫폼 독립적인 것을 모으는 자리**
  - **토큰 타입** — 모든 플랫폼이 같은 타입으로 토큰을 참조함
  - **공유 prop 계약** — web · native 컴포넌트의 공개 API 를 한 곳에서 정의함
  - **플랫폼 중립 유틸** — DOM · RN API 에 묶이지 않는 순수 함수만
- **ThemeProvider 의 `mode` 타입도 ui-core** — 두 플랫폼의 ThemeProvider 가 ui-core 의 `ThemeName` 으로 `mode` 를 받고, 구현은 각자 가짐
- **두는 기준**
  - **플랫폼 독립적인가** — web · native 렌더링 가정, DOM API, RN 전용 API 가 없으면 ui-core 에 둘 수 있음
  - **한 플랫폼 · 한 컴포넌트만 쓰는가** — 그렇다면 ui-core 가 아니라 그 패키지에 둠
  - 이 기준은 2026-09-07 에 "두 렌더러가 실제로 구현하는가"로 좁혀짐([기록](2026-09-07-ui-core-contract-ownership.md))

## 검증

- 지금 ui-core 경계는 `.claude/rules/ui-core.md` 와 AGENTS.md 의 Package boundary
