# 평가에서 CI 가 주는 test · 검증 결과와 브라우저 세션을 제거

DevHub 평가의 테스트 · 검증 · 브라우저 세션 화면과, 그 화면만을 위해 모으던 데이터를 수집기 · 계약까지 삭제. 평가는 이 저장소가 따로 재는 것(번들 크기 · AI 평가 · 접근성 · 디자인 시스템 · 패키지 표면)과 실행 비교만 보임.

## 상황

- 평가의 테스트 · 검증 화면은 test · lint · typecheck · build 결과를 다시 보여 줌. 같은 결과를 PR 마다 CI(`pr-check.yml`)가 이미 알려 줌
- 브라우저 세션 화면은 저장소 측정이 아니라 지금 탭의 브라우저 API 를 읽음. 실행 기록 · 비교와 섞이지 않는 따로 선 화면
- DevHub 규칙은 명령 · CI 결과를 옮겨 적지 않음 — 옮겨 적으면 원본과 어긋남

## 판단

- **남기는 기준** — CI 가 통과 · 실패만 주는 것 너머로 평가가 더하는 값이 있는가. 번들은 실제 크기 · 여유 · baseline 변화 · tree-shaking 진단, 접근성은 DevHub 화면 audit · token 대비 · CSS 검사 · 수동 확인을 출처별로 모음
- **데이터까지 삭제** — 화면만 빼면 수집기가 아무도 보지 않는 test · 검증 결과를 계속 모음. 수집 · 등록 명령 · 계약 필드까지 걷어냄
- **남긴 어휘** — `VERIFICATION_KINDS` · 검증 상태는 AI 평가 trace 가 쓰므로 `eval.ts` 로 옮겨 남김. vitest report 해석은 접근성 수집이 쓰므로 남김
- **schema version 유지** — 계약 버전은 1 그대로. 이전에 export 한 실행은 새 계약을 통과하지 못해 다시 수집해야 함

## 반영

- `apps/devhub` — 세 화면 · 부품 · 순수 로직 · probe · 테스트 삭제. 화면 목록의 `source` 구분, 상세 칸의 브라우저 분기, 개요의 테스트 카드, 실행 상세의 test 표, test · 검증 실패 링크, 주소 query `status` · `q`, 쓰이지 않게 된 라벨 · 부품 삭제
- `libs/observability-contracts` — `test-summary` · `browser` 모듈, run 의 `tests`, 요약의 `sections.tests` · `testCases`, 관측 domain `test` · `verification` · `browser` 삭제
- `tools/scripts/observability` — test · check 수집기와 normalizer, jest · playwright adapter, 등록 명령 13개 삭제. core profile 은 bundle · context 만. audit 대상 route 7개
- `apps/devhub-e2e` — 브라우저 세션 e2e 삭제, 좁은 폭 검사 대상을 평가 번들로

## 검증

- devhub test 838개 중 836개 통과. 실패 2개는 이 작업 전부터 있던 카탈로그 미등록(`plugins/berry-dev` · `tools/scripts/claude-harness` 와 그 문서)
- devhub · devhub-ui · observability-contracts · devhub-e2e 의 typecheck · lint · build 통과
- 계약 test 223개, tools typecheck 와 tools vitest 947개 통과
- 실행하지 못함 — dev 서버 · e2e(포트 바인딩이 막힘). 로컬 공개 실행 9개는 새 계약을 통과하지 못해 다시 수집해야 함
