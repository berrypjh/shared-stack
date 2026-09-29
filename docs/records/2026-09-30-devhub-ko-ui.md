# DevHub 화면 문구에 ko-ui 채택, 어미는 명사형

`apps/devhub/src`에 berry-dev `ko-ui` rule 적용. 어미는 docs 문서와 같은 명사형 · 개조식. devhub-ui와 demo 앱은 제외.

## 상황

- **이전 판단** — shared-stack은 `ko-ui` 미채택. 문서화된 UI 문체 정책이 없어 채택을 프로젝트 판단으로 남김([standards-sources](../claude-harness/standards-sources.md))
- **DevHub 문구** — 카탈로그 데이터 · 빈 이유는 "~한다" · "~없다", 안내 · 상태는 "~합니다"로 섞여 있음
- **docs와의 차이** — `docs/**` · 플러그인 README는 이미 `docs-ko`(명사형). DevHub는 그 문서들을 보여 주는 화면인데 문체가 다름

## 판단

- **docs-ko 경로 확장은 부적합** — `docs-ko`는 한국어 markdown만 대상으로 하고 코드를 제외. DevHub 문구는 `.ts` · `.tsx` 문자열
- **ko-ui로 채택** — 화면 문구용 rule. 어미 값은 profile이 정하므로 profile에 명사형을 적으면 docs와 같은 문체
- **devhub-ui 제외** — 배포되는 라이브러리이고 문구 대부분이 받은 prop 그대로 보임
- **문구 전환 범위** — 문자열 · JSX 텍스트의 문장 끝만. 사용자가 할 일은 `~ 필요`
- **바꾸지 않는 문구** — 매니페스트 · 수집기 원문을 대조하거나 그대로 보이는 값, 예외 메시지 · 테스트 이름, devhub-ui 기본 문구(`복사했습니다` 등, 앱에서 바꿀 prop 없음)

## 반영

- `.claude/standards.json` — `"ko-ui": { "paths": ["apps/devhub/src/**"] }`, `pnpm harness:sync`로 `.claude/rules/_generated/ko-ui.md` 생성
- `.claude/harness.profile.md` — "locale 과 제품 정책"에 devhub 어미(명사형) · 날짜 · 숫자 · 줄바꿈 값
- `.claude/rules/devhub.md` — 흐름 문구를 "~한다"로 정한 줄 삭제
- `apps/devhub/src` · `apps/devhub-e2e/src` — 문구 약 400곳을 명사형으로. TypeScript 파서로 문자열 · JSX 텍스트만 골라 바꾸고 기대값을 같이 고침
- `docs/claude-harness` — `setup.md` · `standards-sources.md`의 채택 현황

## 검증

- `pnpm harness:check` 최신, `tools/scripts/claude-harness` 테스트가 생성 rule 목록(`ko-ui.md` 포함)과 경로 대조
- 기록 등록은 devhub `catalog.spec.ts`가 대조
- devhub · devhub-e2e test · typecheck · lint · build 통과. e2e 실행은 못 함(포트 바인딩이 막힘)
