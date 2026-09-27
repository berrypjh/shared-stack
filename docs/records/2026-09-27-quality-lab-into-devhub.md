# quality-lab 화면을 DevHub 평가로 옮기고 앱을 삭제

품질 수집 결과를 보여 주던 `apps/quality-lab` 의 10개 화면을 DevHub 의 "평가"(`/evaluation/...`) 하위 화면으로 옮김. 수집기 · 계약 · export 흐름은 그대로 두고 화면만 DevHub 로 합친 뒤 quality-lab 앱과 e2e, 그 이름에서 온 흔적을 모두 삭제.

## 상황

- 저장소 탐색(DevHub)과 품질 결과 보기(quality-lab)가 셸 · 탐색기 · 테마 · 상세 칸을 따로 가진 두 앱이었음
- 규칙은 둘을 일부러 나눠 둠 — DevHub 는 "quality-lab 측정값을 싣지 않는다". 사용자가 이 결정을 뒤집고 평가를 DevHub 안으로 옮기기로 함
- 사용자가 고른 방식: 전체 화면을 한 화면씩 옮김 · 다 옮길 때까지 병행 후 삭제 · 데이터는 실행 시점 fetch

## 판단

- **화면만 옮기고 이름은 정리** — 수집기(`tools/scripts/observability`) · 계약(`observability-contracts`)의 동작은 그대로. 앱 이름에서 온 수집 체계 이름 quality-lab 은 코드 이름에 맞춰 "품질 관측"(observability)으로 — 저장소 `tmp/observability`, 문서 `docs/observability`
- **실행 시점 fetch 유지** — 수집할 때마다 다시 build 하지 않도록 공개 JSON 을 `public/observability` 에서 받아 계약으로 검증. 문서처럼 build 시점에 묶지 않음
- **하위 메뉴는 탐색기 섹션** — 평가 섹션 제목이 개요, 묶음은 품질 · AI · 디자인 · 접근성 · 실행. 화면 목록은 `lib/evaluation/screens.ts` 한 곳. 고른 실행(`?run=`)은 화면을 옮겨도 이어 감 — devhub-ui 탐색기가 query 붙은 주소를 경로로 현재 항목 판정
- **라이브러리화** — 저장소를 모르는 `BarChart` · `DataTable` 은 devhub-ui 로. 상태 안내 · 실행 선택 · 상세 칸은 평가 어휘에 묶여 앱에 둠
- **계약의 axe 출처는 devhub 하나** — `quality-lab` 출처 값은 뺌. 그 값을 가진 로컬 실행(`local-a11y-01`)은 삭제된 앱을 검사한 결과라 공개 index 에서 뺌
- **옮기면서 고친 결함** — eval 수집 명령의 `--from` 누락, `not-run` import 라벨 누락, agent-input 의 틀린 이유, verification not-run 이유, 요약을 받기 전 "그런 실행이 없다"는 단정, 개요 카드의 대안 실행 고정값, 조사가 틀린 상태 문장, 실행 비교에서 기준을 바꾸면 화면이 죽던 문제(이전 비교를 새 id 로 읽음 — 원본에도 있던 버그)

## 반영

- `apps/devhub` — `app/evaluation-*-page.tsx` 10개, `components/evaluation/`(틀 · client provider · 실행 선택 · 상태 안내 · 상세 칸 · 화면별 부품), `lib/evaluation/`(client · query · status · 화면별 순수 로직 · probes), `test/evaluation/` fixture · 렌더 도우미, `public/observability`(기본 publicDir)
- `libs/devhub-ui` — `BarChart` · `DataTable` export, 탐색기 현재 항목의 경로 판정, 클립보드가 없는 문맥의 복사 실패 처리
- `libs/observability-contracts` — `ACCESSIBILITY_SOURCE_SCOPES` · `AXE_SCOPES` 의 `quality-lab` 을 `devhub` 로
- `tools/scripts/observability` — export 경로 `apps/devhub/public/observability`, audit 대상을 DevHub 평가 화면(4400)으로, 등록 명령 · test source · a11y UI test 를 devhub 로, 저장소 · import 경로를 `tmp/observability` 로(Storybook test-runner 포함)
- `apps/devhub-e2e` — 평가 하위 메뉴 · 실행 비교 · 브라우저 세션 e2e 와 계약 fixture
- 카탈로그 · 아키텍처 배치 · 품질 흐름 · 문서 · 규칙 · 하네스 consumer 경로를 새 구조로. `apps/quality-lab` · `apps/quality-lab-e2e` · 두 앱의 rule · build 캐시 삭제, `docs/quality-lab` → `docs/observability`(이전 기록의 링크 주소만 새 경로로)

## 검증

- devhub test 910개 중 908개 통과. 실패 2개는 이 작업 전부터 있던 카탈로그 미등록(`plugins/berry-dev` · `tools/scripts/claude-harness` 와 그 문서)
- devhub · devhub-ui · observability-contracts 의 typecheck · lint · build 통과, devhub-e2e typecheck · lint 통과. build 결과물에 `observability/` 가 복사됨
- tools typecheck 와 tools vitest 999개 통과, 계약 test 265개 통과, 하네스 rule `check: up to date`
- 원본과 이식본을 화면 묶음별로 줄 단위 대조하는 검토 두 번. 기능 누락 없음, 찾은 결함은 위 목록대로 고치고 재현 테스트를 더함
- 실행하지 못함 — dev 서버 · e2e(이 환경은 포트 바인딩이 막힘)
- 남긴 것 — 로컬 공개 실행 6개의 `lint.quality-lab` 같은 옛 측정값. 그 시점 저장소를 잰 사실이라 고치지 않음. 다시 수집하면 사라짐
