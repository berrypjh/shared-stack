# berry-dev

여러 저장소가 같은 Claude Code 작업 규칙을 쓰도록 **standards rule 원본과 sync · check CLI**를 배포한다. 책임은 standards 배포, 검증 절차, secret guard 셋으로 한정한다. 설계와 계약은 shared-stack 저장소의 `docs/claude-harness/`에 있다.

## 지금 있는 것 · 아직 없는 것

| 구성                                    | 상태         |
| --------------------------------------- | ------------ |
| `standards/` — rule 원본과 registry     | 있음         |
| `scripts/standards.mjs` — sync · check  | 있음         |
| `examples/` — 소비 저장소가 복사할 입력 | 있음         |
| secret guard hook (`hooks/hooks.json`)  | 있음         |
| `skills/repo-verify` — 검증 절차        | 있음         |
| `skills/frontend-quality` — UI 검수     | 있음         |
| marketplace 등록 (`berrypjh`)           | 있음         |
| 프로젝트 `enabledPlugins` · hook 전환   | 활성 확인 뒤 |

plugin을 켜면 더해지는 것은 secret guard와 `/berry-dev:repo-verify` · `/berry-dev:frontend-quality`다.

## repo-verify

바뀐 파일에서 영향받는 프로젝트와 target을 저장소 도구(Nx가 있으면 설치된 nx)로 확인하고, 가장 싼 검사부터 올려 passed · failed · not-run · unsupported · timeout으로 보고한다. 저장소 사실은 작업 중인 저장소의 `.claude/harness.profile.md`에서 읽는다(`examples/harness.profile.md` 참고). profile이 없으면 추정한 부분을 따로 보고한다.

## frontend-quality

바뀐 UI 파일마다 역할을 먼저 정한다 — 설치된 UI 패키지를 쓰는 앱(consumer)은 설치된 bin으로 좁혀 조회하고 재사용하며, UI 패키지 자신(maintainer)은 그 패키지의 `AGENTS.md` · source · 테스트를 따른다. 상태 · 접근성 · 토큰 · 긴 문자열을 보고, 코드로만 본 것과 실제로 확인한 것을 나눠 보고한다. locale · 셸 · 화면 폭 · 터치 크기 정책은 profile의 UI 절에서 읽는다. 무엇이 옳은지는 rule(`berry-consumer` · `ko-ui` 등)이 정하고, skill은 확인 순서만 정한다.

## secret guard

`PreToolUse` · `Bash`에 `scripts/guard-secrets.mjs`를 exec form(`node` + args)으로 등록한다. secret 경로 (`.env*` · `*.key` · `*.p8` · `*.p12` · `*.jks` · `*.mobileprovision`, 단 `.example` · `.sample` · `.template` 제외)와 우회 수단(리다이렉트 · 인터프리터 eval · `grep` · `base64` · `cp` 등)이 **함께** 있을 때만 deny한다.

- 판정은 `scripts/secret-policy.mjs` 한 벌이다. shared-stack의 project hook도 같은 함수를 import한다
- 막을 때만 deny JSON을 쓰고, 통과는 빈 출력이다. 입력이 깨졌거나 hook이 실패하면 통과시킨다
- 명령 문자열을 단순 토큰으로 볼 뿐 셸 parser도 OS sandbox도 아니다. 변수 · 치환 · 인코딩으로 우회할 수 있다
- 실행 제약(포트 등) · permissions는 저장소마다 달라 여기 없다. project 설정에 둔다

## rule 적용

plugin은 rule을 직접 로드할 수 없다. CLI가 소비 저장소의 `.claude/rules/_generated/`에 파일을 쓴다.

```bash
node <shared-stack>/plugins/berry-dev/scripts/standards.mjs sync  --project <consumer>
node <shared-stack>/plugins/berry-dev/scripts/standards.mjs check --project <consumer>
```

- `<shared-stack>`은 소비 저장소가 고정한 커밋의 checkout이다. CLI는 자기 위치에서 `standards/`를 읽는다
- plugin cache 안의 경로(`~/.claude/plugins/cache/…`)는 버전마다 바뀐다. 스크립트 · 문서에 적지 않는다
- exit 0 성공, 1 drift(check), 2 설정 · IO · 소유 오류. `.claude/rules/`는 소비 저장소 setup이 만든다
- 쓰는 곳은 `.claude/rules/_generated/` 뿐이다. 손으로 고친 생성 파일 · 모르는 파일 · symlink를 만나면 멈춘다

## 소비 저장소 입력 (`examples/`)

복사한 뒤 사람이 검토해서 고친다. sync는 이 파일들을 쓰거나 읽지 않는다.

| 예시                          | 복사할 곳                               | 내용                                                            |
| ----------------------------- | --------------------------------------- | --------------------------------------------------------------- |
| `standards.consumer.json`     | `.claude/standards.json`                | 쓸 optional rule과 경로                                         |
| `harness.profile.md`          | `.claude/harness.profile.md`            | 검증 명령 · 실행 제약 · 표기 값 같은 저장소 사실                |
| `permissions.review.json`     | `.claude/settings.json`의 `permissions` | 최소 deny · ask 후보. 그대로 붙이지 않는다                      |
| `harness-source.example.json` | `.claude/harness-source.json`           | 고정한 shared-stack full SHA · version. 추측한 값을 적지 않는다 |

도입 순서(source 고정 → local 파일 → sync · check → `--plugin-dir` 로드 → hook 전환)와 CI는 shared-stack 저장소의 `docs/claude-harness/setup.md`에 있다.

permissions는 plugin이 주입할 수 없다(plugin `settings.json`은 permissions를 받지 않는다). 프로젝트가 고른다.

## 개발

```bash
claude --plugin-dir ./plugins/berry-dev                # 이 세션에만 제자리 로드
claude plugin validate ./plugins/berry-dev --strict
pnpm tools:check                                        # standards · CLI · 구조 테스트 포함
```

- 버전은 `.claude-plugin/plugin.json`의 `version` 한 곳이다. 내용이 바뀌면 올린다 — 같으면 설치된 cache가 갱신되지 않는다
- 실행은 Node 내장 모듈과 plugin 안 파일뿐이다

### 두지 않는 것

- `package.json` — marketplace 설치 때 의존성 설치가 자동으로 돈다. 설치할 의존성도, npm 배포도 없다
- `exports` · `dist` · build — 다른 패키지가 import하지 않고, 변환 없는 ESM을 그대로 실행한다
- `bin/` — plugin의 `bin/`은 Bash tool PATH에 더해진다. CLI는 경로를 적어 명시적으로 부른다
- `settings.json` · `.mcp.json` · agent · SessionStart hook — 책임 밖이다
