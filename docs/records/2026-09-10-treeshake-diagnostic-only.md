# treeshake 검사는 진단 전용 — react-ui 단일 심볼 크기가 모두 같던 원인은 displayName

react-ui 에서 `cx` 만 import 해도 `TextField` 만큼 번들되던 원인을 `Component.displayName = '...'` 최상위 할당 21개로 확정. 고치는 것은 breaking 이라 미루고, treeshake 검사는 CI 게이트가 아닌 진단으로 둠.

## 상황

- `cx`(10줄 순수 함수)와 `TextField` 의 번들 크기가 바이트 단위로 같음(raw 34,244 vs 34,245)
- 기존 설명은 "단일 번들 구조라 베이스가 늘 들어감"이었는데, 그것으로는 순수 함수까지 같은 크기인 것이 설명되지 않음
- 이 상태로는 treeshake 비율에 안정적인 임계값을 세울 수 없음

## 판단

- **원인은 displayName** — 속성 할당은 번들러가 순수하다고 증명할 수 없어 그 컴포넌트를 통째로 붙잡음. 빌드된 `dist/index.esm.js` 에서 그 21줄만 지우면 `cx` 가 raw 34,245 → 1,150, gzip 10,697 → 481(−97%)
- **지금 고치지 않음** — displayName 을 없애거나 `process.env.NODE_ENV` 로 감싸면 소비자가 관찰하는 속성이 바뀌므로 breaking public. 저장소 안에서 읽는 곳은 0 이지만 외부 영향은 별도 판단
- **treeshake 는 진단, 회귀는 size-limit** — treeshake 검사는 실패로 종료하지 않고, 번들 회귀는 `.size-limit.cjs` 가 막음
- RN 은 displayName 을 쓰지 않아 단일 심볼 크기가 단조 증가함(getColor 63KB → TextField 83KB)

## 반영

- `tools/scripts/treeshake/check.ts` 헤더 — "진단 전용이다. CI 게이트가 아니다"와 displayName 원인
- `.size-limit.cjs` 주석을 displayName 설명과 실측치로 교체

## 검증

- `pnpm treeshake` — 실패 없이 측정치만 출력
- 닷새 뒤 [dist 를 모듈당 한 파일로 바꾼 뒤](2026-09-15-use-client-directive-in-dist.md) 단일 심볼 크기가 모듈별로 갈라짐(90 B ~ 3.37 KB). `.size-limit.cjs` 의 displayName 설명은 그때 preserveModules 기준 설명으로 바뀜
