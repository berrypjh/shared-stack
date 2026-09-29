# berry-dev

여러 저장소가 같은 Claude Code 작업 규칙을 쓰도록 **standards rule 원본과 sync · check CLI**를 배포하는 plugin.

- **책임** — standards 배포, 검증 절차, secret guard 셋뿐
- **plugin을 켜면 더해지는 것** — secret guard hook, `/berry-dev:repo-verify` · `/berry-dev:frontend-quality`
- **standards rule** — plugin이 직접 로드하지 않음. 아래 CLI로 소비 저장소에 씀
- **설계 · 계약** — shared-stack 저장소의 `docs/claude-harness/`

## repo-verify

- **영향 범위** — 바뀐 파일에서 영향받는 프로젝트와 target을 저장소 도구(Nx가 있으면 설치된 nx)로 확인
- **실행 순서** — 가장 싼 검사부터 위로
- **보고** — passed · failed · not-run · unsupported · timeout
- **저장소 사실** — 작업 중인 저장소의 `.claude/harness.profile.md`(`examples/harness.profile.md` 참고). profile이 없으면 추정한 부분을 따로 보고

## frontend-quality

- **역할 판정** — 바뀐 UI 파일마다 먼저 결정
- **consumer** — 설치된 UI 패키지를 쓰는 앱. 설치된 bin으로 좁혀 조회하고 재사용
- **maintainer** — UI 패키지 자신. 그 패키지의 `AGENTS.md` · source · 테스트를 따름
- **확인 항목** — 상태 · 접근성 · 토큰 · 긴 문자열
- **보고** — 코드로만 본 것과 실제로 확인한 것을 나눔
- **정책 출처** — locale · 셸 · 화면 폭 · 터치 크기는 profile의 UI 절
- **역할 분담** — 무엇이 옳은지는 rule(`berry-consumer` · `ko-ui` 등), skill은 확인 순서만

## secret guard

- **등록** — `PreToolUse` · `Bash`에 `scripts/guard-secrets.mjs`를 exec form(`node` + args)으로
- **deny 조건** — secret 경로(`.env*` · `*.key` · `*.p8` · `*.p12` · `*.jks` · `*.mobileprovision`, 단 `.example` · `.sample` · `.template` 제외)와 우회 수단(리다이렉트 · 인터프리터 eval · `grep` · `base64` · `cp` 등)이 **함께** 있을 때만
- **판정 구현** — `scripts/secret-policy.mjs` 한 벌. shared-stack의 project hook도 같은 함수를 import
- **출력** — 막을 때만 deny JSON, 통과는 빈 출력. 입력이 깨졌거나 hook이 실패하면 통과
- **한계** — 명령 문자열을 단순 토큰으로 볼 뿐 셸 parser도 OS sandbox도 아님. 변수 · 치환 · 인코딩으로 우회 가능
- **범위 밖** — 실행 제약(포트 등) · permissions는 저장소마다 달라 project 설정에 둠

## rule 적용

plugin은 rule을 직접 로드할 수 없음. CLI가 소비 저장소의 `.claude/rules/_generated/`에 파일을 씀.

```bash
node <shared-stack>/plugins/berry-dev/scripts/standards.mjs sync  --project <consumer>
node <shared-stack>/plugins/berry-dev/scripts/standards.mjs check --project <consumer>
```

- **`<shared-stack>`** — 소비 저장소가 고정한 커밋의 checkout. CLI는 자기 위치에서 `standards/`를 읽음
- **plugin cache 경로** — `~/.claude/plugins/cache/…`는 버전마다 바뀜. 스크립트 · 문서에 적지 않음
- **exit code** — 0 성공, 1 drift(check), 2 설정 · IO · 소유 오류
- **`.claude/rules/`** — 소비 저장소 setup이 만듦
- **쓰는 곳** — `.claude/rules/_generated/` 뿐. 손으로 고친 생성 파일 · 모르는 파일 · symlink를 만나면 멈춤

## 소비 저장소 입력 (`examples/`)

복사한 뒤 사람이 검토해서 고치는 파일. sync는 이 파일들을 쓰거나 읽지 않음.

| 예시                          | 복사할 곳                               | 내용                                                            |
| ----------------------------- | --------------------------------------- | --------------------------------------------------------------- |
| `standards.consumer.json`     | `.claude/standards.json`                | 쓸 optional rule과 경로                                         |
| `harness.profile.md`          | `.claude/harness.profile.md`            | 검증 명령 · 실행 제약 · 표기 값 같은 저장소 사실                |
| `permissions.review.json`     | `.claude/settings.json`의 `permissions` | 최소 deny · ask 후보. 그대로 붙이지 않는다                      |
| `harness-source.example.json` | `.claude/harness-source.json`           | 고정한 shared-stack full SHA · version. 추측한 값을 적지 않는다 |

- **도입 순서 · CI** — shared-stack 저장소의 `docs/claude-harness/setup.md`(source 고정 → local 파일 → sync · check → `--plugin-dir` 로드 → hook 전환)
- **permissions** — plugin이 주입할 수 없음(plugin `settings.json`은 permissions를 받지 않음). 프로젝트가 고름

## 개발

```bash
claude --plugin-dir ./plugins/berry-dev                # 이 세션에만 제자리 로드
claude plugin validate ./plugins/berry-dev --strict
pnpm tools:check                                        # standards · CLI · 구조 테스트 포함
```

- **버전** — `.claude-plugin/plugin.json`의 `version` 한 곳. 내용이 바뀌면 올림 — 같으면 설치된 cache가 갱신되지 않음
- **실행 의존성** — Node 내장 모듈과 plugin 안 파일뿐

### 두지 않는 것

- **`package.json`** — marketplace 설치 때 의존성 설치가 자동으로 돎. 설치할 의존성도, npm 배포도 없음
- **`exports` · `dist` · build** — 다른 패키지가 import하지 않음. 변환 없는 ESM을 그대로 실행
- **`bin/`** — plugin의 `bin/`은 Bash tool PATH에 더해짐. CLI는 경로를 적어 명시적으로 부름
- **`settings.json` · `.mcp.json` · agent · SessionStart hook** — 책임 밖
