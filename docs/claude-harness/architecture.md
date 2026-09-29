# Claude Harness 아키텍처

여러 저장소가 같은 Claude Code 규칙 · 절차 · secret 보호를 쓰도록 `plugins/berry-dev` 한 곳에서 배포. 이 문서는 **누가 무엇을 소유하는지, 어떻게 배포되는지, 실패하면 어떻게 되는지**를 정함. 입력과 기대 결과는 [contracts.md](./contracts.md)가 정함.

상태: 구현됨. 아래 경로는 모두 `plugins/berry-dev/**`에 있음.

## 배경

- 두 저장소(shared-stack · snapdone)가 `.claude/hooks/guard-bash.mjs`를 따로 복사해 쓰고, 이미 갈라짐 — `tokenize`가 다르고(shared-stack은 따옴표 · 쉼표 · `=` · 백틱에서도 자름) `PORT_BOUND`도 다름
- shared-stack의 guard는 자동 테스트가 없음([기록](../records/2026-09-15-bash-guard-hook.md)). snapdone에는 hook 프로세스를 실제로 실행하는 테스트가 있음(`tools/scripts/guard-bash.test.mjs`)
- plugin은 CLAUDE.md · rules · permissions를 배포할 수 없음(공식 plugins-reference). 그래서 rules는 plugin이 직접 싣지 못하고, 소비 저장소의 `.claude/rules/`에 파일로 있어야 로드됨
- `.claude/rules/`는 하위 디렉터리까지 재귀로 읽힘(공식 memory 문서)
- plugin 캐시는 `version`이 같으면 갱신되지 않음 — 설치된 berry-commit `0.1.0` 캐시가 저장소의 `src` · `dist`와 다름(실측)

## 결정

### 1. 정본은 plugin 안 한 곳

```text
plugins/berry-dev/
  .claude-plugin/plugin.json     name · version (버전의 유일한 출처, 시작 0.1.0)
  standards/manifest.json        rule registry — id · 파일 · core 여부
  standards/rules/<id>.md        rule 본문 (정본)
  scripts/standards.mjs          sync · check CLI (Node 내장 모듈만)
  hooks/hooks.json               PreToolUse Bash → scripts/guard-secrets.mjs (exec form)
  scripts/secret-policy.mjs      순수 정책 — 입력 문자열 → 판정. I/O 없음
  scripts/guard-secrets.mjs      adapter — stdin JSON → 정책 → stdout deny JSON
  skills/<name>/SKILL.md         generic 절차 skill 2개
  README.md
```

- **rule 본문** — `standards/rules`에만 있음. 소비 저장소 · 문서 · skill에 본문을 복사하지 않음
- **두지 않는 것** — `package.json` · `node_modules` · `dist` · `.mcp.json`. 새 dependency · package · MCP · Nx project 없음
- **Nx 밖** — `plugins/berry-dev`는 Nx project가 아님(`project.json` 없음). 검증은 shared-stack의 `tools/scripts/claude-harness` vitest(`pnpm harness:test`)

### 2. 배포는 plugin asset + standalone CLI

- **plugin** — marketplace(`.claude-plugin/marketplace.json`)로 배포. hook · skill은 plugin이 활성이면 바로 동작
- **rules** — plugin이 로드할 수 없으므로 CLI가 소비 저장소에 파일을 씀

  ```bash
  node <berry-dev-root>/scripts/standards.mjs sync  --project <root>
  node <berry-dev-root>/scripts/standards.mjs check --project <root>
  ```

- **source 위치** — CLI는 **자기 파일 위치(`import.meta.url`)에서** `../standards/`를 찾음. 환경 변수 · plugin 캐시 탐색 · network · postinstall · 자동 sync(SessionStart hook 등) 없음. `<berry-dev-root>`는 부르는 사람이 정함
- **버전** — npm fixed release(`nx.json` `release.projects`)에 넣지 않음. 버전은 `plugin.json` 한 곳이고 marketplace 항목에 `version`을 쓰지 않음. 내용이 바뀌면 `plugin.json`의 `version`을 올림 — 올리지 않으면 설치된 캐시가 갱신되지 않음

### 3. 소유 경계

| 경로 (소비 저장소 기준)                | 소유               | 쓰는 주체              |
| -------------------------------------- | ------------------ | ---------------------- |
| `.claude/rules/_generated/**`          | **berry-dev sync** | `standards.mjs sync`   |
| `.claude/standards.json`               | 프로젝트           | 사람                   |
| `.claude/harness-source.json`          | 프로젝트           | 사람 (setup · CI 검증) |
| `.claude/harness.profile.md`           | 프로젝트           | 사람                   |
| `.claude/rules/*.md` (`_generated` 밖) | 프로젝트           | 사람                   |
| `.claude/settings.json` · permissions  | 프로젝트           | 사람                   |
| `.claude/hooks/*` (`PORT_BOUND` 등)    | 프로젝트           | 사람                   |

- **sync 범위** — 쓰고 지우는 곳은 `.claude/rules/_generated/` 아래 **파일**뿐. 그 밖은 읽기만 하거나(config) 건드리지 않음
- **예외 상황** — 로컬 수정 · 모르는 파일 · symlink를 이유로 소유 범위를 넓히지 않음. 덮어쓰거나 지우지 않고 exit 2로 멈춤
- **복구** — `_generated/` 안에는 프로젝트 파일이 없으므로 언제나 "`_generated/`를 지우고 sync"

### 4. 설정은 선택만 한다

`.claude/standards.json`은 어떤 rule을 어디에 적용할지만 고름. 본문을 바꾸는 필드 없음(아래 id는 예시).

```json
{
  "schemaVersion": 1,
  "rules": {
    "verification": true,
    "docs-style": { "paths": ["docs/**/*.md"] }
  }
}
```

- **core rule** — 값이 `true`이고 항상 생성됨(config에 없어도). 경로 제한 없음
- **나머지 rule** — `{ "paths": [...] }`로 고름. 적은 것만 생성되고, `paths`가 생성 파일의 frontmatter가 됨
- **exit 2** — 빈 `paths` · 모르는 id · 모르는 필드(본문 override 포함) · 잘못된 값 형태
- **프로젝트 고유 규칙** — `_generated` 밖 `.claude/rules/*.md`에 씀

### 5. check 는 다시 계산하고 아무것도 쓰지 않는다

- **expected** — source(`standards/`) + config로 계산한 `_generated/` 전체(생성 manifest 포함)
- **생성 manifest** — `_generated/manifest.json`. plugin version · source digest · config digest · 파일별 hash를 담음. check는 expected를 manifest에서 읽지 않음 — manifest는 "sync가 무엇을 썼는가"(소유 판정)에만 씀
- **결과** — "지금 sync를 하면 무엇이 되는가"와 같음: 할 일 없음 0 · 고칠 수 있음 1 · sync가 거부함 2
- **쓰기 없음** — check는 파일 · 디렉터리 · 임시 파일 · lock을 만들지 않음

### 6. 내용 drift 와 Git provenance 는 따로 본다

- **내용 drift** — `standards.mjs check`. source와 config로 계산한 결과가 디스크와 같은가. Git을 모름
- **provenance** — 소비 저장소의 `.claude/harness-source.json`이 가리키는 shared-stack **full SHA(40자)**에서 온 source로 check 했는가. 소비 저장소의 setup 스크립트 · CI가 확인(checkout 한 source의 `git rev-parse HEAD`와 `plugin.json` version 대조). CLI는 이 파일을 읽지 않음
- **분리** — 둘을 한 명령에 섞지 않음. drift가 없어도 source가 다른 커밋일 수 있고, 반대도 가능

### 7. 절차는 generic, 저장소 사실은 profile

- **skill 2개** — 저장소를 모르는 절차만 적음(무엇을 먼저 보고 어디까지 올리는가 · 못 한 것을 어떻게 보고하는가)
- **저장소 사실** — 검증 명령 · affected 매핑 · 실행할 수 없는 명령. 프로젝트의 `.claude/harness.profile.md`에 사람 말로 둠
- **실행 DSL 없음** — 명령 schema · 조건식을 만들지 않음. skill은 profile을 읽고 따르며, profile이 없으면 없다고 말하고 추측하지 않음

### 8. secret 보호는 정책과 adapter 로 나눈다

- `secret-policy.mjs` — `tokenize` · secret 경로 판정 · `BYPASS` 판정. 순수 함수, I/O 없음
- `guard-secrets.mjs` — stdin/stdout 계약과 "hook 오류는 통과(exit 0)"만 가짐
- **local에 남는 것** — `PORT_BOUND` · permissions(deny · ask) · 제품 정책. 저장소마다 다름
- **공용 `tokenize`** — shared-stack 판 기준(더 엄격함). snapdone 판과의 차이는 회귀 테스트로 고정

## 전환 순서 (secret 보호가 비는 순간이 없게)

1. `secret-policy.mjs`를 만들고, shared-stack의 `.claude/hooks/guard-bash.mjs`가 그 함수를 **import** 해 씀. 동작은 그대로이고, 같은 테스트가 local hook과 plugin adapter 둘 다를 실행
2. plugin hook 추가. project hook과 plugin hook은 둘 다 실행되고 deny가 이김(공식 hooks 문서) — 겹쳐도 안전
3. `enabledPlugins`에 `berry-dev@berrypjh`를 넣고, plugin hook이 **실제로** deny 하는지 확인(대화형 세션, 사용자 실행)
4. 3이 확인된 뒤에만 local hook에서 secret 판정을 뺌. local에는 `PORT_BOUND`만 남음

- **3을 건너뛰지 않는 이유** — hook은 오류가 나면 통과시키므로, plugin이 로드되지 않아도 증상이 없음
- **소비 저장소(snapdone)** — 3이 그 저장소에서 확인될 때까지 자기 local guard 유지

## 적용 경로

### maintainer (shared-stack)

1. `standards/rules` · `manifest.json` · skill · hook 수정
2. `pnpm harness:test`로 plugin 테스트 실행(`pnpm tools:check`에도 포함)
3. `plugin.json`의 `version` 상향
4. main에 병합 → 그 커밋의 full SHA가 소비 저장소가 고정할 값

shared-stack 자신도 소비자로서 `node plugins/berry-dev/scripts/standards.mjs sync --project .`를 씀. 이 경우 source는 작업 트리이고 `harness-source.json`이 없음.

### consumer (snapdone 등)

1. `.claude/harness-source.json`에 shared-stack full SHA 기록
2. 그 SHA의 shared-stack을 받아(setup · CI) `standards.mjs sync --project .`
3. `.claude/rules/_generated/**` 커밋 — 리뷰 대상이고, plugin 없이도 rules가 로드됨
4. CI는 provenance 확인 → `standards.mjs check --project .` 순서로 봄

## 알려진 제약

- **`.gitignore`** — shared-stack의 `.gitignore`가 `**/_generated/`를 무시함. 커밋하려면 `!.claude/rules/_generated/` 예외가 필요
- **prettier** — lint-staged의 prettier가 생성 markdown을 다시 쓰면 check가 drift를 냄. `.prettierignore`에 `_generated`를 넣음
- **devhub 카탈로그** — devhub의 `catalog.spec.ts`는 `plugins/*` 폴더와 그 README의 등록을 요구함. `plugins/berry-dev`를 만들 때 devhub 데이터도 고침
- **CI 연결** — CI에 plugin 테스트를 연결하려면 workflow 수정이 필요함. 별도 승인 대상
- **`claude plugin validate`** — 사람이 부름. CI에 Claude Code CLI가 있다고 가정하지 않음
