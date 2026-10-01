# design-tokens 를 빌드 도구 패키지로 분리

토큰 원본과 변환기를 `ui-core` 에 합치지 않고 별도 패키지 `@berrypjh/design-tokens` 로 둠. 같은 날 Style Dictionary 파이프라인이 함께 들어옴.

## 상황

- 토큰을 정의하고 변환하려면 Style Dictionary 와 `@tokens-studio/sd-transforms` 가 필요함(`8fc4b3b`)
- 둘은 런타임 의존성이 아니라 build 시점에만 쓰는 비교적 무거운 도구

## 판단

- **ui-core 에 합치지 않음** — 합치면 토큰 JSON 하나만 고쳐도 ui-core 전체가 다시 build 되고, CI 캐시가 깨지는 범위와 변경 영향이 불필요하게 넓어짐
- **컴포넌트 패키지가 아니라 빌드 도구 패키지** — 토큰 원본을 여러 플랫폼 산출물로 바꾸는 변환기. 컴포넌트 패키지와 한 상자에 두면 토큰 정의와 UI 구현의 경계가 흐려짐

## 참고자료

- [sd-transforms](https://github.com/tokens-studio/sd-transforms) — Tokens Studio. Tokens Studio 에서 내보낸 토큰을 Style Dictionary 로 다루는 transform 모음(전처리 · 수식 · 색 변형 · 플랫폼별 transform)
- [Architecture](https://styledictionary.com/info/architecture/) — Style Dictionary. transform 은 토큰 값을 바꾸는 단계, format 은 끝난 토큰을 파일 형태로 내는 단계로 나뉨
