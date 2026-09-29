# 평가에서 접근성 · 디자인 시스템을 제거하고 번들 · AI 평가만 남김

DevHub 평가의 접근성 · 디자인 시스템 화면과, 그 화면만을 위해 모으던 수집기 · 계약까지 삭제. 평가는 번들(size-limit · tree-shaking)과 AI 평가(consumer eval · 컨텍스트 토큰)만 보임.

## 상황

- **접근성 평가의 대상** — 라이브러리가 아니라 DevHub 평가 화면 자신을 axe 로 검사(`pnpm quality`). 라이브러리 접근성은 CI 의 Storybook test-runner(`pr-check.yml` a11y job)가, DevHub 화면은 `apps/devhub-e2e/src/a11y.spec.ts` 가 이미 같은 WCAG 기준으로 봄
- **디자인 시스템 평가의 내용** — 대비 기준 · 테마 · 상태 매트릭스 · component 토큰을 다시 보여 줌. 대비 · pressed 어휘는 design-tokens `contrast.test.ts` 가 CI 에서 강제
- **이전 판단** — [2026-09-27 기록](2026-09-27-evaluation-custom-only.md)은 CI 가 이미 알려 주는 결과를 평가에 싣지 않기로 함

## 판단

- **남기는 기준** — 이 저장소만 재는 값인가. 번들은 실제 크기 · 여유 · tree-shaking 진단, AI 평가는 consumer eval 과 컨텍스트 토큰
- **데이터까지 삭제** — 화면만 빼면 수집기가 아무도 보지 않는 결과를 계속 모음. 수집기 · 등록 명령 · 계약 필드까지 걷어냄
- **접근성 검사는 e2e 로** — `pnpm quality` 가 보던 평가 화면을 `a11y.spec.ts` 가 주입 데이터로 함께 검사
- **schema version 유지** — 계약 버전은 1 그대로. 이전에 export 한 실행은 새 계약을 통과하지 못해 다시 수집해야 함

## 반영

- `libs/observability-contracts` — `accessibility` · `design-system` 모듈, run 의 두 필드, 요약 절, 관측 domain `a11y`, profile `a11y` 삭제. profile 은 static · core · eval
- `tools/scripts/observability` — `quality.ts` · axe 감사 · axe adapter · design-system 수집기 · state evidence 삭제, 등록 명령 `a11y.storybook` 삭제. 루트 script `quality` 삭제
- `apps/devhub` — 두 화면 · 부품 · 순수 로직 · test helper 삭제. 평가 화면은 개요 · 번들 · AI 평가
- `apps/devhub-e2e` — 평가 메뉴 3개로, `a11y.spec.ts` 에 평가 화면 3개 추가
- `docs/observability` — 6개 문서를 사용법 · 아키텍처 · metric 3개로 합침

## 검증

- 계약 test 161개, tools typecheck 와 tools vitest 870개, devhub typecheck · lint · build 와 vitest 791개 통과. devhub-e2e typecheck 통과
- 새 계약으로 static · core(size-limit · treeshake import) · eval 수집 성공
- 실행하지 못함 — e2e(포트 바인딩이 막힘)
