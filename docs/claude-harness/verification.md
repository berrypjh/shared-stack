# Claude Harness 검증

berry-dev와 shared-stack의 harness 설정을 확인하는 명령. 도입 순서는 [setup.md](./setup.md).

- **구성 검사**와 **native 동작 확인**을 따로 기록함. 구성 검사가 통과해도 Claude Code가 plugin을 로드했다는 뜻은 아님

## 구성 검사 (shared-stack, 저장소 root)

| 명령                                                  | 보는 것                                                                                 |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `pnpm harness:test`                                   | `tools/scripts/claude-harness/*.test.ts` — renderer · CLI · rule · guard · skill · 구조 |
| `pnpm harness:sync` 두 번                             | 두 번째가 `sync: up to date`이고 파일을 쓰지 않음                                       |
| `pnpm harness:check`                                  | `check: up to date`, exit 0. 1은 drift, 2는 설정 · 소유 오류                            |
| `claude plugin validate ./plugins/berry-dev --strict` | plugin manifest. 이 CLI 판은 skill 내용을 보고하지 않음(`contents`가 빔)                |
| `claude plugin validate . --strict`                   | marketplace manifest                                                                    |

## CI 도달 경로

- `tools/vitest.tools.config.mts`가 `tools/**/*.test.ts`를 모으므로 `tools/scripts/claude-harness/*.test.ts`가 `pnpm tools:check`에 들어감. `tools/tsconfig.json`이 `scripts/**/*.ts`를 include 해 타입 검사도 같이 됨
- `pr-check.yml`의 consumer-eval job이 모든 PR에서 `build:libs` → `tools:check` → `eval:consumer:smoke`를 실행. workflow와 `tools:check`는 고치지 않았음
- 커밋된 생성 rule의 drift는 `committed-generated.test.ts`가 CLI `check`로 잡음 — 별도 CI 단계가 필요 없음. 이 테스트는 `.claude/rules/_generated/**`가 커밋되어 있어야 통과함
- 이것은 content check 임. 어느 shared-stack 커밋을 쓰는지(source pin)는 소비 저장소의 setup · CI가 따로 확인

## 계약별 테스트

`tools/scripts/claude-harness/` 기준. 테스트 통과는 임시 디렉터리의 fixture에서 macOS · Node로 확인한 것이고, GitHub에서 받은 plugin · 다른 OS · Claude Code 안의 동작을 뜻하지 않음.

| 계약 ([contracts.md](./contracts.md))            | 테스트                                                                                                   |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| registry · renderer · byte 안정성                | `standards.test.ts`                                                                                      |
| sync · check · exit code                         | `standards-cli.test.ts` 사용법 · sync → check                                                            |
| 소유 판정(stale · modified · extra · 충돌)       | `standards-cli.test.ts` drift · stale 제거 · unknown                                                     |
| generated와 manifest 동시 조작                   | `standards-cli.test.ts` "파일과 manifest hash를 함께 조작해도"                                           |
| upstream 삭제 · 선택 해제 · paths · version 변경 | `standards-cli.test.ts` stale 제거 · 보존과 분리 · version                                               |
| local 파일 byte · mtime 보존                     | `standards-cli.test.ts` "모든 변경 경로에서" — rules · settings · profile · source pin · AGENTS · CLAUDE |
| 경로 탈출 · symlink                              | `standards-cli.test.ts` unknown · symlink · 경로 탈출                                                    |
| source pin과 content check 분리                  | `standards-cli.test.ts` "CLI는 source pin을 읽지 않는다", `committed-generated.test.ts`                  |
| plugin만 복사한 위치에서 실행                    | `standards-cli.test.ts`(node_modules 조상 없음), `guard.test.ts` 공백 경로                               |
| secret 정책 한 벌 · 포트 정책 보존 · 합성        | `guard.test.ts`                                                                                          |
| rule 본문 · 누출 · fixture 매핑                  | `standards-rules.test.ts`                                                                                |
| plugin 구조 · marketplace · manifest · skill     | `structure.test.ts`, `repo-verify.test.ts`, `frontend-quality.test.ts`                                   |
| 커밋된 생성 rule                                 | `committed-generated.test.ts`                                                                            |

## native 동작 확인 (사람이 실행)

AI 세션 안에서는 plugin을 새로 로드할 수 없음. 사용자 터미널에서:

```bash
claude --plugin-dir ./plugins/berry-dev
```

- skill — `/berry-dev:repo-verify` · `/berry-dev:frontend-quality`가 목록에 있음
- hook — `/hooks`에 plugin 출처의 `PreToolUse` · `Bash` 항목이 있음
- 차단 — 존재하지 않는 경로로 확인(`grep x /nonexistent/.env`). shared-stack은 local hook도 같은 사유로 막으므로, plugin hook이 막았는지는 `/hooks`의 출처로 구분

결과를 받기 전에는 native 동작을 미검증으로 보고함.

## 보존 확인

- `git diff -- .claude/settings.json` — permissions · `defaultMode` · hooks 변경 없음
- `git diff -- plugins/berry-commit .claude-plugin/marketplace.json` — berry-commit 항목과 구현 변경 없음(추가된 berry-dev 항목만)
- `git diff -- nx.json pnpm-workspace.yaml .github tools/scripts/release` — release · workspace 변경 없음
