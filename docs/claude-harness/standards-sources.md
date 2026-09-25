# Claude Harness standards 추출 근거

`plugins/berry-dev/standards/rules/`의 문장마다 어디서 왔는지와 적용 범위를 적는다. 공용 rule에는 **두 저장소 이상에서 실제로 쓰는 문장**만 둔다. 한 곳에만 있는 세부 값 · 제품 정책은 그 프로젝트에 남긴다.

- 기준 커밋 — shared-stack 작업 트리(`db5db95` 기준), snapdone `252381a`
- snapdone 원문은 이 저장소에 없어 경로만 적음. `.claude/rules/api.md`는 미커밋 변경이 있어 HEAD 판을 읽음
- 읽은 snapdone 원문 — `AGENTS.md` · `.claude/rules/{ko-ui,docs,libs}.md` 전체, `{web,mobile}.md`의 공용 UI 조회 절과 관련 줄, `{api,devhub,e2e}.md`의 절 제목과 굵은 항목(추출 대상 아님 판단용)

## core (항상 적용)

| 문장                                                          | shared-stack                                                                                                                                  | snapdone                                                                                                      |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 고치기 전에 읽고, 있는 구현을 재사용                          | [AGENTS.md](../../AGENTS.md) "Check nearby code and docs before guessing" · "Prefer modifying existing patterns"                              | `AGENTS.md` Working Principles "수정 전 관련 코드를 읽는다" · "기존 architecture와 convention을 먼저 재사용"  |
| 가장 작은 변경 · 단계별 검증 · 관계없는 변경 섞지 않음        | [AGENTS.md](../../AGENTS.md) "Make the smallest valid change first" · "Avoid broad refactors"                                                 | `AGENTS.md` "작게 · 점진적으로" · "관계없는 refactor를 하지 않는다"                                           |
| 새 추상화는 두 번째 사용처가 실제로 있을 때                   | [libs/ui-core/AGENTS.md](../../libs/ui-core/AGENTS.md) "계약은 '쓸 수 있다'가 아니라 '쓰고 있다'로 들어온다"                                  | `AGENTS.md` "새 Nx library는 두 번째 사용처가 실제로 나타났을 때"                                             |
| 미커밋 변경 보존 · 되돌리기 어려운 명령은 확인                | [.claude/settings.json](../../.claude/settings.json) `ask`의 reset · checkout · clean · stash                                                 | `AGENTS.md` "사용자의 미커밋 변경을 보존한다" · Git Safety                                                    |
| 의존성 검토 순서 · 사용자 확인 · 임의 버전 상향 금지          | [AGENTS.md](../../AGENTS.md) "Prefer existing dependencies" · "Add new dependencies only when clearly justified", settings `ask`의 `pnpm add` | `AGENTS.md` Dependency 절 1~4 · "버전은 임의로 올리지 않는다"                                                 |
| 실행하지 않은 검사를 통과로 쓰지 않음 · TODO로 완료 선언 금지 | [apps/devhub/AGENTS.md](../../apps/devhub/AGENTS.md) "실행하지 않은 것 · 지원하지 않는 것을 성공으로 보이지 않는다"                           | `AGENTS.md` Validation "검증하지 않은 것을 검증했다고 말하지 않는다" · "TODO만 남기고 완료를 선언하지 않는다" |

프로젝트에 남긴 것 — 근본 원인 우선 · 방어적 코드 · 주석 · 이모지 규칙(snapdone `AGENTS.md`에만 있고 shared-stack은 개인 설정에만 있음), Nx target 이름 확인 방법, 커밋 plugin 사용법.

## cross-runtime-pure (선택)

| 문장                                                       | shared-stack                                                                                                                      | snapdone                                                         |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| DOM · RN · browser · native API, CSS를 두지 않음           | [libs/ui-core/AGENTS.md](../../libs/ui-core/AGENTS.md) "DOM · RN 타입과 API ... 쓰지 않는다"                                      | `.claude/rules/libs.md` "들어가면 안 되는 것"                    |
| UI 프레임워크 import를 두지 않음, 상태는 렌더러가 쥔다     | 같은 문서 "React import(context · hook 포함)를 쓰지 않는다" · "테마 context는 각 렌더러가 쥔다"                                   | `libs.md` 태그 표 `type:lib` 금지 import(react · react-native …) |
| 경계 검사(lint · 테스트)를 따르고 우회하지 않음            | 같은 문서 "`boundary.test.ts`가 소스를 훑어 실패시킨다"                                                                           | `libs.md` "위 규칙은 ESLint가 강제한다"                          |
| 두 사용처가 실제로 같은 의미로 쓸 때만 올림                | 같은 문서 계약 설계 절, [libs/react-ui/AGENTS.md](../../libs/react-ui/AGENTS.md) "양 플랫폼이 실제로 같은 의미로 쓸 때만 ui-core" | `libs.md` "만들 시점 — 두 번째 사용처가 실제로 나타났을 때"      |
| 순수 함수 · 같은 이름은 근거가 아님                        | ui-core "순수 함수라는 것은 소유 근거가 아니다" · "이름이 같다 … 근거가 되지 않는다"                                              | `libs.md` "'나중에 쓸 것 같아서' 미리 만들지 않는다"             |
| 한쪽 전용 키 · 유틸은 그쪽에 둠 · 계약 변경 전 사용처 검색 | ui-core "한쪽 렌더러만 쓰는 계약 · 유틸은 그 렌더러 패키지에" · "바꾸기 전에 다운스트림 사용처를 grep"                            | `libs.md` "한 앱에서만 쓰는 동안에는 그 앱 안에 둔다"            |

- 적용 — 여러 런타임이 함께 쓰는 계약 · 로직 경로. shared-stack은 `libs/ui-core/src/**`, snapdone은 `libs/**`
- 제외 — `libs/react-ui` · `libs/react-native-ui` · `libs/devhub-ui` · 앱. 모든 lib에 React/RN 금지를 걸지 않는다
- 프로젝트에 남긴 것 — snapdone의 lib 모양(빌드 없는 소스 패키지 · `transpilePackages` · 태그 표), ko-KR formatter 목록, ui-core의 계약별 승격 표

## berry-consumer (선택)

| 문장                                                               | shared-stack                                                                                                                                                                                                                        | snapdone                                                                         |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| UI 패키지는 공개 패키지 · `exports`로만, private · 내부 경로 금지  | [libs/react-ui/AGENTS.consumer.md](../../libs/react-ui/AGENTS.consumer.md) 찾는 순서 2, [apps/demo-web/AGENTS.md](../../apps/demo-web/AGENTS.md) · [apps/quality-lab/AGENTS.md](../../apps/quality-lab/AGENTS.md) "소비자처럼 쓴다" | `.claude/rules/web.md` "private … `/src` · 내부 `dist` 경로를 import하지 않는다" |
| 조회 순서 — 플랫폼 → agents → bin의 find · api · token → 공개 타입 | AGENTS.consumer 찾는 순서 1~6, bin 이름은 `libs/react-ui/package.json` · `libs/react-native-ui/package.json`의 `bin`                                                                                                                | `web.md` · `mobile.md` 공용 UI API 조회 1~6                                      |
| 목록을 복제하지 않음 · 전체 파일을 컨텍스트에 넣지 않음            | AGENTS.consumer "이 문서는 심볼 목록을 중복 관리하지 않는다" · "파일 전체를 컨텍스트에 넣지 않는다"                                                                                                                                 | `AGENTS.md` "공용 UI 컴포넌트 · 토큰은 설치된 패키지의 공개 CLI로 조회"          |
| 설치된 버전의 bin · 레지스트리 latest 실행 금지                    | 없음 — 아래 "남은 차이"                                                                                                                                                                                                             | `web.md` "bare `npx @berrypjh/react-ui`는 쓰지 않는다"                           |
| 비어 있어도 복사 · 로컬 재구현 금지 · 패키지 작업으로 분리         | [apps/demo-web/AGENTS.md](../../apps/demo-web/AGENTS.md) "라이브러리를 고치지 않는다. … 그 패키지에서 한다"                                                                                                                         | `web.md` "source를 읽거나 복사할 사유가 아니다 … upstream에 요청"                |
| 구현 읽기는 명시적 upstream 조사 때의 마지막 단계                  | AGENTS.consumer 찾는 순서 7 "구현 · 디버깅 질문에만"                                                                                                                                                                                | `web.md` 같은 줄                                                                 |

- 적용 — 패키지를 소비하는 앱 코드. shared-stack은 `apps/{demo-web,demo-mobile,quality-lab}/src/**`, snapdone은 web · mobile 앱 소스
- 제외 — `libs/**`(maintainer). maintainer 작업은 각 패키지 `AGENTS.md`를 따른다
- `canUseSourceFallback`([levels.ts](../../tools/consumer-retrieval/levels.ts))는 바꾸지 않음. 그 함수는 eval harness의 retrieval 측정 정책이고 "L2 not-found" 분기도 L4를 허용한다. 이 rule은 AGENTS.consumer 7단계와 같게 명시적 조사로 한정한다
- 프로젝트에 남긴 것 — 버전 고정(overrides) · peer 범위, `pnpm --dir <app> exec` 같은 실행 경로, 로컬 primitive 금지와 앱 소유 목록, 테마 소유 방식, Tailwind · CSS 연결

남은 차이 — shared-stack의 AGENTS.consumer 예시는 `npx @berrypjh/react-ui …`이다. 설치된 패키지가 있으면 로컬 bin을 쓰지만, 없는 위치에서는 레지스트리에서 받아 온다. 공개 문서라 이번에 고치지 않았다.

## ko-ui (선택)

| 문장                                       | shared-stack                                                                                                                                               | snapdone                                                |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 어미 · 형식은 한 가지, 값은 profile        | 없음(한국어 UI는 있으나 문체 정책 문서 없음)                                                                                                               | `.claude/rules/ko-ui.md` 언어 절                        |
| 내부 코드 · 용어를 화면에 그대로 내지 않음 | [apps/devhub/AGENTS.md](../../apps/devhub/AGENTS.md) 파일 절 "labels(어휘 → 글자)", [quality-lab labels.ts](../../apps/quality-lab/src/app/data/labels.ts) | `ko-ui.md` "영어 AI 개발 용어를 화면에 노출하지 않는다" |
| 긴 문자열 · 줄바꿈 · 말줄임 확인           | [libs/devhub-ui/src/styles.css](../../libs/devhub-ui/src/styles.css) `word-break: keep-all`                                                                | `ko-ui.md` 한국어 길이 절                               |

- 적용 — 프로젝트가 고른 한국어 화면 경로. snapdone은 web · mobile 화면. shared-stack fixture는 **채택하지 않음**(문서화된 UI 문체 정책이 없어 채택은 프로젝트 판단)
- 제외 — 개발자용 식별자 · 로그 · 테스트 이름, 다른 locale
- profile에 남긴 것 — 어미 선택, 날짜 · 금액 · 전화번호 예시 형식, 최소 터치 타깃 · line-height · 최소 화면 폭 값, `keep-all` 같은 구현
- 프로젝트에 남긴 것 — 완료 문장 정책 · 과정 보고 금지 · 되돌리기 규칙 · 네 가지 상태 설계 · 플랫폼별 접근성(제품 정책이거나 한 곳에만 있음)

## docs-ko (선택)

| 문장                                            | shared-stack                                                                              | snapdone                                         |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------ |
| 개조식 · 명사형 기본                            | [apps/devhub/AGENTS.md](../../apps/devhub/AGENTS.md) 기록 절 "문체는 개조식 · 명사형이다" | `.claude/rules/docs.md` 도입 · 종결 절           |
| 제목 체언 종결 · `- **주제** — 설명` 목록       | [docs/records](../records/2026-09-15-bash-guard-hook.md) 제목과 판단 절 목록              | `docs.md` 제목 · 목록 절                         |
| 두 문체를 섞지 않음, 고쳐 쓰지 않는 문서는 유지 | devhub 기록 절 "나중에 고쳐 쓰지 않는다"                                                  | `docs.md` "한 문서 안에서 두 문체를 섞지 않는다" |
| 코드 · 인용 · 링크 · 구조 보존                  | devhub "깨진 문서 링크는 숨기지 않는다"(링크를 테스트가 대조)                             | `docs.md` 바꾸지 않는 것 절                      |

- 적용 — 프로젝트가 고른 한국어 문서. shared-stack fixture는 `docs/records/**/*.md`
- 제외 — 고르지 않은 문서(shared-stack의 `docs/quality-lab` · README · AGENTS), 영어 문서, 코드 주석
- 프로젝트에 남긴 것 — 기록 파일 이름 · 네 절 구성 · 등록 규칙(devhub), 나쁨 · 좋음 예문, 전환 진행 상태

## shared-stack 적용 fixture

`tools/scripts/claude-harness/fixtures/shared-stack.standards.json` — 실제 적용이 아니라 매핑 검증용이다. `standards-rules.test.ts`가 pure는 ui-core 소스에만, consumer는 앱 소비 경로에만 걸리고 둘이 겹치지 않는지 본다.
