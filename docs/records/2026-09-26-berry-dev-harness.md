# Claude harness를 berry-dev plugin 한 곳에서 배포

여러 저장소가 같은 Claude Code 규칙 · 절차 · secret 보호를 쓰도록 `plugins/berry-dev` 한 곳에서 배포. 누가 무엇을 소유하는지, 어떻게 배포되는지, 실패하면 어떻게 되는지를 정함.

## 상황

- **갈라진 guard** — shared-stack · snapdone이 `.claude/hooks/guard-bash.mjs`를 따로 복사해 쓰고, 이미 갈라짐. `tokenize`가 다르고(shared-stack은 따옴표 · 쉼표 · `=` · 백틱에서도 자름) `PORT_BOUND`도 다름
- **테스트 없음** — shared-stack의 guard는 자동 테스트가 없음([기록](2026-09-15-bash-guard-hook.md)). snapdone에는 hook 프로세스를 실제로 실행하는 테스트가 있음
- **plugin의 한계** — plugin은 CLAUDE.md · rules · permissions를 배포할 수 없음(공식 plugins-reference). rules는 소비 저장소의 `.claude/rules/`에 파일로 있어야 로드되고, 하위 디렉터리까지 재귀로 읽힘(공식 memory 문서)
- **캐시** — plugin 캐시는 `version`이 같으면 갱신되지 않음. 설치된 berry-commit `0.1.0` 캐시가 저장소의 `src` · `dist`와 다름(실측)

## 판단

- **정본은 plugin 안 한 곳** — rule 본문은 `standards/rules`에만. 소비 저장소 · 문서 · skill에 복사하지 않음. `package.json` · `dist` · `.mcp.json` · Nx project 없음
- **배포는 plugin asset + standalone CLI** — hook · skill은 marketplace plugin으로. rules는 plugin이 로드할 수 없어 `standards.mjs sync`가 소비 저장소에 파일로 씀. CLI는 자기 파일 위치에서 `standards/`를 찾고 환경 변수 · 캐시 탐색 · network · 자동 sync가 없음
- **버전은 `plugin.json` 한 곳** — npm fixed release에 넣지 않고 marketplace 항목에도 `version`을 쓰지 않음. 올리지 않으면 설치된 캐시가 갱신되지 않음
- **소유 경계** — sync가 쓰고 지우는 곳은 `.claude/rules/_generated/` 아래 파일뿐. `standards.json` · `harness-source.json` · `harness.profile.md` · 나머지 rule · settings · hook은 프로젝트 소유. 로컬 수정 · 모르는 파일 · symlink를 만나면 범위를 넓히지 않고 exit 2로 멈춤. 복구는 언제나 "`_generated/`를 지우고 sync"
- **설정은 선택만** — `.claude/standards.json`은 어떤 rule을 어디에 적용할지만 고름. core는 항상 생성, 나머지는 `paths`로 고르고 그것이 생성 파일의 frontmatter. 본문 override 같은 모르는 필드는 exit 2
- **check는 다시 계산하고 쓰지 않음** — source + config로 expected를 계산해 디스크와 비교. 생성 manifest는 소유 판정에만 씀. 결과는 할 일 없음 0 · 고칠 수 있음 1 · sync가 거부함 2
- **drift와 provenance 분리** — 내용 drift는 `check`, 어느 shared-stack full SHA에서 왔는지는 소비 저장소의 setup · CI가 `harness-source.json`으로 확인. 한 명령에 섞지 않음
- **절차는 generic, 저장소 사실은 profile** — skill은 저장소를 모르는 절차만. 검증 명령 · 실행할 수 없는 명령은 프로젝트의 `harness.profile.md`에 사람 말로. 실행 DSL을 만들지 않음
- **secret 보호는 정책과 adapter로** — `secret-policy.mjs`는 순수 판정, `guard-secrets.mjs`는 stdin/stdout과 "hook 오류는 통과"만. `PORT_BOUND` · permissions는 저장소마다 달라 local에 남김. 공용 `tokenize`는 더 엄격한 shared-stack 판
- **전환 순서** — secret 보호가 비는 순간이 없게: local hook이 공용 정책을 import → plugin hook 추가(둘 다 실행되고 deny가 이김) → plugin hook이 실제로 deny 하는지 사람이 확인 → 그 뒤에만 local에서 secret 판정 제거. hook은 오류가 나면 통과시켜 plugin이 로드되지 않아도 증상이 없으므로 확인을 건너뛰지 않음

## 반영

- `plugins/berry-dev/` — `standards/` · `scripts/standards.mjs` · `scripts/secret-policy.mjs` · `scripts/guard-secrets.mjs` · `hooks/hooks.json` · `skills/`
- `.claude/hooks/guard-bash.mjs` — secret 판정은 `secret-policy.mjs`를 import, `PORT_BOUND`만 local
- `.claude/rules/_generated/` — `pnpm harness:sync`로 생성해 커밋. `.gitignore` 예외와 `.prettierignore` 추가(prettier가 다시 쓰면 check가 drift를 냄)
- `.claude/standards.json` · `.claude/harness.profile.md` — shared-stack이 고른 rule과 저장소 사실
- 이 결정은 처음에 `docs/claude-harness/architecture.md`로 적었고, 2026-09-30 이 기록으로 옮김. 도입 순서와 CLI 계약은 `plugins/berry-dev/README.md`, 계약의 정본은 테스트

## 검증

- `tools/scripts/claude-harness/*.test.ts` — sync · check 계약, 생성 rule, hook 계약(local hook과 plugin adapter 둘 다), plugin 구조. `pnpm harness:test` · `pnpm tools:check`가 실행
- `pnpm harness:check` — 커밋된 생성 rule이 원본과 같은지
- CI 연결은 workflow 수정이라 별도 승인 대상. `claude plugin validate`는 사람이 부름
