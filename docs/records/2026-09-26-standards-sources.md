# 공용 standards rule은 두 저장소 이상이 쓰는 문장만

`plugins/berry-dev/standards/rules/`의 문장마다 출처를 대조해, 두 저장소(shared-stack · snapdone) 이상에서 실제로 쓰는 문장만 공용 rule에 둠. 한 곳에만 있는 세부 값 · 제품 정책은 그 프로젝트에 남김.

## 상황

- **읽은 snapdone 원문** — `AGENTS.md` · `.claude/rules/{ko-ui,docs,libs}.md` 전체, `{web,mobile}.md`의 공용 UI 조회 절, `{api,devhub,e2e}.md`의 절 제목과 굵은 항목(추출 대상 아님 판단용). 이 저장소에 없어 경로만 적음
- **문제** — 같은 원칙이 두 저장소에 다른 말로 있고, 어느 문장이 공용이고 어느 것이 프로젝트 값인지 구분이 없음

## 판단

두 저장소 이상이 실제로 쓰는 문장만 공용 rule 로 — 한 곳에만 있는 값 · 정책은 그 프로젝트에 남김.

| rule                   | 두 저장소가 같이 말하는 것                                                                                                                               | 프로젝트에 남긴 것                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **core**               | 고치기 전에 읽고 재사용, 가장 작은 변경, 새 추상화는 두 번째 사용처가 있을 때, 미커밋 변경 보존, 의존성 검토 순서, 실행하지 않은 검사를 통과로 쓰지 않음 | 근본 원인 우선 · 주석 · 이모지 규칙, Nx target 확인법, 커밋 plugin 사용법    |
| **cross-runtime-pure** | DOM · RN · CSS 와 UI 프레임워크 import 를 두지 않음, 경계 검사를 우회하지 않음, 두 사용처가 같은 의미로 쓸 때만 올림, 한쪽 전용은 그쪽에                 | 적용은 여러 런타임이 함께 쓰는 경로(shared-stack 은 `libs/ui-core/src/**`)만 |
| **berry-consumer**     | 공개 `exports` 로만 import, 플랫폼 → agents → bin → 공개 타입 순 조회, 목록 복제 금지, 비어 있어도 복사 · 재구현 금지, 구현 읽기는 마지막 단계           | `canUseSourceFallback`(eval 의 측정 정책)                                    |
| **ko-ui**              | 어미 · 형식은 한 가지이고 값은 profile, 내부 용어를 화면에 내지 않음, 글자 폭 · 줄 높이 때문에 줄바꿈 확인                                               | 완료 문장 · 접근성 같은 제품 정책                                            |
| **docs-ko**            | 개조식 · 명사형, 제목 체언 종결, `- **주제** — 설명` 목록, 두 문체를 섞지 않음, 코드 · 인용 · 링크 · 구조 보존                                           | 기록 파일 이름 · 절 구성 · 등록 규칙                                         |

- **출처** — core 는 shared-stack `AGENTS.md` · `.claude/settings.json` · path rule 과 snapdone `AGENTS.md`, cross-runtime-pure 는 shared-stack `ui-core` rule 과 snapdone `libs.md`, berry-consumer 는 `AGENTS.consumer.md` 찾는 순서와 snapdone `web.md` · `mobile.md` 공용 UI 조회. 설치된 버전의 bin 만 쓰는 문장은 snapdone 에만 있지만 포함
- **ko-ui 는 외부 기준으로 고침** — 어미 통일은 제품 전체 단위, 한국어는 글자 수가 줄지만 폭 · 줄 높이가 커짐, 숫자 날짜 마침표는 국립국어원 문장 부호 규정, 어절 보존 시 긴 영문이 넘칠 수 있음
- **작성 방식** — 검증할 수 있게 구체적으로, 이유와 함께. 예시에 값(어미 · 숫자 · 구현 이름)을 넣지 않음 — 값은 profile 몫. 검수 절차는 `frontend-quality` skill 과 겹치지 않게 뺌
- **검증 사본을 두지 않음** — 예전의 같은 내용 fixture 는 실제 설정이 바뀌어도 사본 기준으로 통과해, 실제 설정이 검사받지 않았음

## 반영

- **`plugins/berry-dev/standards/rules/`** — core · cross-runtime-pure · berry-consumer · ko-ui · docs-ko
- **`.claude/standards.json`** — shared-stack이 고른 rule과 경로. 채택 판단은 rule마다 따로

## 검증

- `tools/scripts/claude-harness/standards-rules.test.ts` — pure는 ui-core 소스에만, consumer는 앱 소비 경로에만 걸리고 둘이 겹치지 않는지, 예시에 값이 들어가지 않는지
- `tools/scripts/claude-harness/committed-generated.test.ts` — 커밋된 생성 rule이 실제 설정으로 다시 만든 결과와 같은지
