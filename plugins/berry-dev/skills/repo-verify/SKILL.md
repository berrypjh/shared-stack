---
name: repo-verify
description: 바뀐 파일에서 실제로 영향받는 프로젝트와 target 을 확인하고, 가장 싼 검사부터 필요한 만큼만 올려 검증한 뒤, 돌리지 못한 것까지 상태별로 보고한다.
when_to_use: Use after changing code or config in a repository, before reporting the work as done, or when unsure which projects a change affects and how far to escalate lint, typecheck, test and build.
argument-hint: '[files|project] (생략하면 git 변경분)'
---

# repo-verify

목적은 전부 돌리는 것이 아니라 **이 변경에 필요한 만큼만 돌리고, 돌리지 않은 것을 정직하게 보고하는 것**이다.
저장소 고유 사실(명령 · 경로 밖 검사 · 실행 제약)은 이 skill 에 없고 profile 에 있다.

## 1. 저장소와 profile

- 작업 중인 저장소의 root 를 `git rev-parse --show-toplevel` 로 정한다. 이 skill 파일이나 plugin 이 있는 위치는 저장소 root 가 아니다
- `<root>/.claude/harness.profile.md` 의 검증 절을 읽는다
- profile 이 없으면 아래 discovery 로 진행하고, 보고에 "profile 없음 — 추정한 부분"을 따로 적는다

## 2. 무엇이 바뀌었나

```bash
git status --porcelain
git diff --stat
```

- 이번 작업에서 내가 바꾼 파일과, 시작 전부터 있던 사용자 변경을 구분한다. 검증 범위는 내 변경이다
- 사용자 변경을 되돌리거나 정리해서 검사를 통과시키지 않는다

## 3. 어떤 프로젝트 · target 인가

짐작하지 말고 저장소 도구에 묻는다.

- Nx workspace(`nx.json`)면 **설치된** nx 를 프로젝트 패키지 매니저로 부른다(`pnpm exec nx` · `npx --no-install nx` · `yarn nx`)

  ```bash
  nx show projects --affected --files=<바뀐 파일, 쉼표 구분>
  nx show project <이름> --json
  ```

- target 이름과 실제 명령은 `nx show project` 결과로 확인한다. 문서의 target 표를 사실로 믿지 않는다
- Nx 가 없으면 root 와 바뀐 패키지의 `package.json` scripts 를 읽는다. 도구를 새로 설치하지 않는다
- affected 목록은 파일이 속한 프로젝트 기준이다. 목록이 비었거나 root 프로젝트만 나와도, profile 이 적은
  **프로젝트 밖 경로의 검사**(도구 · 설정 · hook · plugin)가 해당하는지 확인한다
- `nx affected -t <target>` 은 그 target 이 없는 프로젝트를 조용히 건너뛴다. "no tasks" 는 통과가 아니라 not-run 이다

## 4. 실행 전에 읽는다

- build · release · submit · deploy 같은 target 은 실행 전에 명령을 읽는다. 로컬 산출물인지, 클라우드 빌드 · 배포 · 게시인지 확인한다
- 클라우드 빌드 · 배포 · 게시 · 비용이 드는 명령은 검증 목적으로 실행하지 않는다. 필요하면 사용자에게 묻는다
- profile 이 "이 환경에서 실행할 수 없다"고 적은 명령(포트를 여는 서버 · e2e 등)은 돌리지 않고 사용자에게 실행을 요청한다

## 5. 가장 싼 것부터

변경 크기에 맞춰 멈출 지점을 정한다. 앞 단계가 실패하면 뒤 단계로 가지 않는다.

1. 바뀐 파일을 다루는 가장 작은 테스트 · 정적 검사(파일 · 프로젝트 하나)
2. 영향받은 프로젝트의 lint · typecheck
3. 영향받은 프로젝트의 test
4. 산출물 · 설정 · 의존을 바꿨을 때만 로컬 build
5. 런타임 · e2e 는 구조 · 라우팅 · 통합 계약을 바꿨을 때만, 그리고 실행할 수 있을 때만

- 검사가 다른 산출물(예: 빌드된 패키지)에 기대면 profile 이 적은 의존 순서를 따른다
- 실패하면 출력 그대로 보고한다. 통과시키려고 테스트를 건너뛰거나 기대값 · 설정을 바꾸지 않는다
- 전체 build · 전체 e2e 를 습관적으로 돌리지 않는다. 전역 설정을 바꿔 전부가 영향받을 때만 넓힌다

## 6. 보고

상태는 다섯 가지만 쓴다. 실행하지 않은 것을 passed 로 쓰지 않는다.

| 상태        | 뜻                                                                |
| ----------- | ----------------------------------------------------------------- |
| passed      | 실행했고 성공했다                                                 |
| failed      | 실행했고 실패했다                                                 |
| not-run     | 실행할 수 있지만 돌리지 않았다(불필요 · 앞 단계 실패 · no tasks)  |
| unsupported | 이 환경 · 도구로는 돌릴 수 없다(포트 · 클라우드 · 실행기 없음 등) |
| timeout     | 시간 안에 끝나지 않았다                                           |

```text
영향: <프로젝트 목록> — 근거: <실행한 affected · show project 명령>
profile: <읽음 | 없음 — 추정한 부분>

- <명령> — <범위> — <상태> — <증거: 요약한 출력 · 실패 메시지>
```

not-run · unsupported 칸을 비워 두지 않는다. 돌리지 않은 것을 적지 않으면 전부 돌린 것처럼 읽힌다.
