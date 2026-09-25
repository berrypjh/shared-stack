---
name: frontend-quality
description: 화면 · UI 컴포넌트 변경을 역할(소비 앱 · UI 라이브러리)과 플랫폼에 맞게 검수한다. 재사용, 네 가지 상태, 접근성, 토큰, 문구와 긴 문자열을 확인하고 코드로만 본 것과 실제로 확인한 것을 나눠 보고한다.
when_to_use: Use after adding or changing UI code (screens, components, styles) and before reporting it as done, or when deciding whether to reuse an existing component or add a new one.
argument-hint: '[files|dir] (생략하면 git 변경분의 UI 파일)'
---

# frontend-quality

화면이 **동작하는지**는 `repo-verify` 가 본다. 여기서는 **이 저장소 · 이 역할 · 이 플랫폼에 맞는지**를 본다.
무엇이 옳은지는 rule(`.claude/rules/**`)과 가까운 `AGENTS.md` 가 정하고, 이 skill 은 확인하는 순서만 정한다.
저장소 사실(셸 · 화면 폭 · 터치 크기 · locale · 완료 문구 정책 · 실행 수단)은 profile 에 있다.

## 1. 범위 · 역할 · 플랫폼 · locale

- 저장소 root 를 `git rev-parse --show-toplevel` 로 정하고 `<root>/.claude/harness.profile.md` 의 UI 절을 읽는다.
  이 skill 이 있는 plugin 위치는 저장소 root 가 아니다. profile 이 없으면 아래를 직접 판정하고 추정이라고 보고한다
- 검수할 파일을 정한다. 인자가 없으면 `git status --porcelain` 의 UI 파일 중 이번 작업에서 바꾼 것이다
- **역할** — 파일이 속한 가장 가까운 `package.json` 과 profile 로 정한다
  - consumer — 설치된 UI 패키지를 가져다 쓰는 앱 코드
  - maintainer — UI 패키지 자신의 source
  - 둘 다 아니면 일반 UI 코드로 보고 저장소 rule 만 따른다
- **플랫폼** — 설치된 의존과 import 로 정한다(web · React Native). 요구와 설치 상태가 어긋나면 추측하지 않고 묻는다
- **locale** — profile 이 정한 locale 을 따른다. 정해지지 않았으면 한국어를 강제하지 않는다

## 2. 재사용 — 역할마다 다르다

### consumer

- 설치된 패키지의 `agents` export 로 사용 규칙과 함정을 먼저 읽는다
- 설치된 bin 을 **그 앱 패키지 안에서** 실행한다. 레지스트리의 다른 버전을 받아 올 수 있는 실행(bare `npx <package>`)은 쓰지 않는다
- 필요한 것만 좁혀 조회한다 — `find <query>` → `api <Symbol>` → `token <path|prefix>`. 카탈로그 · 토큰 파일 전체를 읽지 않는다
- 있는 컴포넌트를 조합한다. 조회 결과가 비어도 패키지 source 를 복사하거나 비슷한 primitive 를 로컬에 만들지 않는다 — 없다고 보고하고 패키지 쪽 작업으로 넘긴다

### maintainer

- 가장 가까운 패키지 `AGENTS.md` 를 따른다. consumer 제약(설치 bin 조회 · primitive 금지)은 여기 적용하지 않는다
- 자기 source · 테스트 · 공개 export 를 탐색해 이미 있는 구현과 유틸을 찾는다
- 새 primitive 를 추가할 수 있다. 추가하면 패키지 규칙이 요구하는 공개 export · 테스트 · 문서 · 스토리를 함께 갱신한다
- 공개 API 를 바꾸면 사용처를 검색한다

## 3. 상태

loading · empty · error · disabled 를 각각 확인한다. 성공 경로만 보고 끝내지 않는다.

- error — 무엇이 잘못됐고 어떻게 하면 되는지 말하는가
- empty — 다음 행동으로 이어지는가, 그냥 비어 있는가
- disabled — 시각 표시와 함께 보조 기술에도 비활성으로 알리는가

## 4. 플랫폼 · 접근성

web 과 React Native 는 확인 방법이 다르다. [references/platform-checks.md](references/platform-checks.md) 를 따른다.

## 5. 토큰

- 색 · 간격 · 모서리 · 타이포는 UI 패키지의 토큰에서 온다. consumer 는 설치된 패키지 조회로, maintainer 는 패키지 규칙이 정한 출처로 확인한다
- 새 raw 값이 있으면 왜 토큰으로 안 되는지 묻는다. 토큰에 정말 없으면 로컬 값 대신 패키지 쪽 요청으로 남긴다
- 검색 결과는 후보일 뿐이다. 걸린 줄을 읽고 판단한다 — 검색에 안 걸렸다고 준수를 확정하지 않는다

## 6. 문구와 긴 문자열

- 문구 정책(어미 · 형식 · 완료 문장)은 profile 과 생성 rule 에서 읽는다. 없는 정책을 지어내지 않는다
- 버튼 · 탭 · 제목 · 표 머리글에 **실제로 긴 문자열을 넣어 본다**(스토리 · 테스트 · 렌더). 읽어서만 판단하지 않는다
- 셸 · 화면 폭 · 터치 크기 기준은 profile 에서 읽는다. 없으면 기준 없음으로 보고한다

## 7. 확인 방식을 나눈다

| 방식      | 예                                            | 확정할 수 있는 것       |
| --------- | --------------------------------------------- | ----------------------- |
| 코드 판독 | 요소 · 속성 · 토큰 사용을 읽음, 검색          | 후보와 명백한 위반      |
| 자동 검사 | 단위 · 컴포넌트 테스트, 접근성 규칙 검사      | 그 테스트가 다루는 계약 |
| 실제 확인 | 렌더된 화면, 키보드 이동, 스크린 리더, 실기기 | 사용자가 겪는 동작      |

코드 판독과 자동 검사만으로 접근성 · 시각 품질을 통과로 쓰지 않는다. 실제 확인이 필요하고 이 환경에서 할 수 없으면
사용자에게 요청하고 미검증으로 남긴다.

## 보고

```text
범위: <파일 · 디렉터리> — 역할: <consumer | maintainer | 일반> — 플랫폼: <web | RN> — locale: <profile 값 | 정해지지 않음>
profile: <읽음 | 없음 — 추정한 부분>

## 고친 것
- <항목> — <무엇을 어떻게>

## 유지한 것
- <항목> — <그대로 두는 이유>

## 코드로만 확인한 것
- <항목>

## 실제로 실행한 것
- <명령 · 도구> — <결과>

## 미검증
- <항목> — <왜 못 했는지, 누가 어떻게 확인하면 되는지>
```

`코드로만 확인한 것` 과 `미검증` 을 비워 두지 않는다.
