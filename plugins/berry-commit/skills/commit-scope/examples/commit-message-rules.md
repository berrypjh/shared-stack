# commit-scope message rules

## 기본 형식

- title: `type(scope): 설명`
- type은 영어 그대로 사용
- scope는 MCP가 감지한 값을 그대로 사용
- 설명은 한국어
- body는 선택 사항이며 최대 3줄

## 권장 type 선택 기준

type 목록은 `@berrypjh/commitlint-config`가 강제한다. 아래 11종 외에는 commit이 차단된다.

- `feat`: 사용자 관점의 새 기능 추가
- `fix`: 버그 수정
- `refactor`: 동작 변화 없이 구조 개선
- `docs`: 문서 수정
- `design`: 시각적 디자인 / 스타일 토큰 변경
- `style`: 포맷/스타일만 수정
- `test`: 테스트 추가/수정
- `chore`: 설정, 스크립트, 유지보수성 변경
- `build`: 빌드 관련 변경
- `ci`: CI/CD 관련 변경
- `revert`: 이전 commit revert

## 길이 제한 (commitlint hard limit)

위반하면 commit이 차단된다. 메시지를 제안할 때 미리 맞춰서 작성한다.

| 위치             | 제한                                    | 출처                                                |
| ---------------- | --------------------------------------- | --------------------------------------------------- |
| title (header)   | 100자 이내                              | `header-max-length` (config-conventional 기본)      |
| footer 각 줄     | 100자 이내                              | `footer-max-line-length` (config-conventional 기본) |
| body 각 줄       | 제한 없음 (가독성 위해 100자 이내 권장) | `body-max-line-length: 0` (공유 config override)    |
| header `!:` 표기 | 금지 — `feat!:` 사용 X                  | 공유 config의 custom rule `no-header-bang`          |
| type/scope case  | lower-case 필수                         | config-conventional 기본                            |

특히 BREAKING CHANGE footer 본문은 한 줄에 길게 쓰면 commitlint가 차단한다. 한국어 한 글자도 1자로 카운트되므로 마이그레이션 가이드 본문은 적절히 줄바꿈해야 한다.

## 제목 작성 규칙

- 짧고 명확하게
- 무엇이 바뀌었는지 바로 드러나게
- 과장하지 않기
- diff에 없는 목적을 상상해서 쓰지 않기

좋은 예:

- `feat(web): 이미지 업로드 진입 화면 추가`
- `fix(react-ui): ButtonBase 비네이티브 키보드 클릭 처리 수정`
- `refactor(ui-core): form control 상태 계산 로직 분리`
- `docs(root): AGENTS 문서 구조 정리`

아쉬운 예:

- `feat(web): 전체 리뉴얼`
- `fix(react-ui): 여러 문제 해결`
- `chore(root): 이것저것 수정`

## 본문 작성 규칙

- 최대 3줄
- 왜 바꿨는지 또는 어떻게 바꿨는지 간단히 설명
- rename / delete / copy / 공통화 / 구조 분리 성격이 있으면 언급
- bullet 형식 또는 짧은 문장 형식 모두 가능

좋은 예:

- `- 버튼 로딩 상태 접근성 속성을 정리함`
- `- 비네이티브 버튼의 Enter/Space 키 동작을 분리함`
- `- 공통 타입을 별도 파일로 이동해 재사용성을 높임`

## rename / refactor 처리 기준

다음 성격이면 body에 가능하면 언급한다.

- 파일 이동
- 이름 변경
- 공통 함수 추출
- 책임 분리
- 폴더 재구성
- 타입 정리

예:
title

- `refactor(react-ui): button 관련 유틸과 타입 정의 분리`

body

- `- Button 구현에서 타입/유틸 책임을 파일별로 분리함`
- `- 기존 동작은 유지하면서 가독성과 재사용성을 높임`

## 보수적 판단 원칙

애매하면:

- `feat`보다 `refactor`
- `fix`보다 `chore`
- 장담보다 사실 요약

## 금지

- staged 되지 않은 작업 언급
- 미래 계획 언급
- "최적화", "개선", "정리"만 있고 대상이 없는 제목
- scope 임의 변경

## BREAKING CHANGE 표기 (`/commit-scope major` 사용 시에만)

- 평소에는 절대 추가하지 않는다. 사용자가 `major` 인자로 명시적으로 요청하고, **scope가 published library일 때만** 처리한다.
- published library scope = `nx.json`의 `release.projects`에 있고 `package.json`에 `private: true`가 없는 프로젝트의 scope. 그 외(`root` · `apps/*` · `tools/*`)는 `major` 인자가 있어도 일반 흐름으로 commit한다.
- title은 일반 conventional commit 그대로 사용한다. `feat!:`, `fix!:` 등 헤더 `!` 표기는 commitlint가 차단하므로 사용하지 않는다.
- body 마지막 단락에 빈 줄 한 행을 둔 뒤 `BREAKING CHANGE: <마이그레이션 가이드>` footer를 작성한다.
- footer 본문은 사용자가 제공한 텍스트를 그대로 사용한다. 모델이 추측해서 작성하지 않는다.

좋은 예:

```
feat(react-ui): ThemeProvider API 정리

기존 mode prop을 제거하고 theme prop으로 통합한다.

BREAKING CHANGE: ThemeProvider의 mode prop이 theme prop으로 이름 변경됨.
기존 사용처는 theme={mode}로 마이그레이션 필요.
```
