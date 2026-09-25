# Claude Harness 계약

[architecture.md](./architecture.md)의 결정을 입력 · 기대 결과로 고정한다. 구현보다 먼저 쓰고, 테스트는 이 문서의 사례 id(`S-01` 등)를 이름에 쓴다. 문서와 테스트가 다르면 둘 중 하나가 틀린 것이다.

상태: 구현 전. 경로는 shared-stack 기준 `plugins/berry-dev/` 아래, 소비 저장소 기준 `<root>/` 아래다.

## 1. CLI

```bash
node <berry-dev-root>/scripts/standards.mjs <sync|check> --project <root>
```

| exit | 뜻                                                                               |
| ---- | -------------------------------------------------------------------------------- |
| 0    | sync: 끝남(바꾼 것이 없어도 0) · check: 디스크가 expected와 같음                 |
| 1    | check 전용: drift — sync하면 고쳐지는 차이                                       |
| 2    | 사용법 · 설정 · source · IO · 소유(ownership) 오류 — sync는 아무것도 쓰지 않았다 |

- sync는 1을 내지 않는다
- 여러 문제가 함께 있으면 가장 큰 값을 낸다(2 > 1 > 0)
- check의 exit는 "지금 sync 하면"과 같다: sync할 일 없음 → 0, sync가 성공하며 바꿈 → 1, sync가 거부 → 2
- 결과 목록은 stdout, 오류 사유는 stderr. 경로는 `<root>` 기준 상대 경로로 쓰고 절대 경로를 찍지 않는다
- `--project`는 필수. 없는 디렉터리 · 모르는 subcommand · 모르는 옵션은 2
- source 위치는 `new URL('../standards/', import.meta.url)` 하나. 환경 변수 · 캐시 탐색 · network가 없다
- import는 `node:` 내장 모듈만

## 2. source (plugin 안)

### `standards/manifest.json`

```json
{
  "schemaVersion": 1,
  "rules": {
    "<id>": { "core": true, "description": "한 줄 설명" }
  }
}
```

- id: `^[a-z0-9]+(?:-[a-z0-9]+)*$`. 본문은 정확히 `standards/rules/<id>.md` — 파일 경로를 manifest에 적지 않는다
- `core`는 boolean, `description`은 빈 문자열이 아닌 문자열. 다른 필드는 오류
- `standards/rules/`의 `.md` 파일과 manifest의 id는 1:1이다. 등록 안 된 파일 · 파일 없는 id는 오류
- rule 본문에는 frontmatter가 없다. frontmatter는 생성 단계가 쓴다
- source의 어느 경로든 symlink면 오류
- source 오류는 exit 2 (sync · check 모두)

### 버전

- `pluginVersion`은 `.claude-plugin/plugin.json`의 `version` 한 곳에서 읽는다. 시작 값 `0.1.0`
- `plugins/berry-dev`에 `package.json`이 없다. marketplace 항목에 `version`을 쓰지 않는다

## 3. 설정 (`<root>/.claude/standards.json`)

```json
{
  "schemaVersion": 1,
  "rules": {
    "<core-id>": true,
    "<optional-id>": { "paths": ["apps/web/**"] }
  }
}
```

| 입력                                       | 결과                              |
| ------------------------------------------ | --------------------------------- |
| 파일 없음 · symlink · JSON 아님            | 2                                 |
| `schemaVersion`이 1이 아님                 | 2                                 |
| 최상위에 `schemaVersion` · `rules` 외 필드 | 2                                 |
| manifest에 없는 id                         | 2 (`unknown rule id`)             |
| core id에 `true`가 아닌 값                 | 2 — core는 경로를 좁히지 않는다   |
| optional id에 `true`                       | 2 — optional은 `paths`로만 고른다 |
| `paths`가 없음 · 빈 배열 · 빈 문자열 포함  | 2                                 |
| `paths` 외 필드(`body` · `content` 등)     | 2 — 본문 override 금지            |
| core id가 config에 없음                    | 정상 — core는 항상 생성된다       |
| optional id가 config에 없음                | 정상 — 생성하지 않는다            |

- config digest는 파싱한 값을 키 정렬 · 공백 없는 JSON으로 바꾼 뒤의 sha256이다. 들여쓰기 · 키 순서만 바뀌면 drift가 아니다

## 4. 생성물 (`<root>/.claude/rules/_generated/`)

### 파일

- rule 하나에 `<id>.md` 하나. 그 밖에는 `manifest.json`만 있다
- optional rule:

  ```markdown
  ---
  paths:
    - 'apps/web/**'
  ---

  <!-- berry-dev standards: <id>. 이 파일을 고치지 말고 .claude/standards.json 또는 source 를 고친다. -->

  <본문>
  ```

- core rule은 frontmatter 없이 주석 줄부터 시작한다
- 본문에 plugin version을 넣지 않는다 — version만 바뀐 경우 drift는 manifest 한 파일에서만 난다
- 줄바꿈 LF, 파일 끝 개행 하나. 같은 입력이면 byte 단위로 같다

### `manifest.json` (생성 manifest)

```json
{
  "schemaVersion": 1,
  "generator": "berry-dev/standards",
  "pluginVersion": "0.1.0",
  "sourceDigest": "sha256:<hex>",
  "configDigest": "sha256:<hex>",
  "files": {
    "<id>.md": "sha256:<hex>"
  }
}
```

- `sourceDigest` — `standards/manifest.json`과 모든 `standards/rules/<id>.md`의 (상대 경로, 내용 sha256) 쌍을 경로 순으로 정렬해 한 줄씩 이은 문자열의 sha256
- `files` — 생성한 `.md`의 내용 sha256. 키는 `^[a-z0-9]+(?:-[a-z0-9]+)*\.md$`만 허용
- 시각 · 호스트 · 절대 경로를 넣지 않는다. 키 정렬, 2칸 들여쓰기, 끝 개행
- check는 expected를 이 파일에서 읽지 않는다. 이 파일은 "sync가 무엇을 썼는가"(소유 판정)에만 쓴다

## 5. 소유 판정

sync는 먼저 전부 판정하고, 거부 사유가 하나라도 있으면 **아무것도 쓰지 않고** 2로 끝난다. 용어: `recorded` = 기존 생성 manifest의 `files`, `expected` = source + config로 계산한 결과.

| 디스크 상태                                                               | 이름     | sync               | check |
| ------------------------------------------------------------------------- | -------- | ------------------ | ----- |
| 파일이 expected와 같음                                                    | 일치     | 그대로 (쓰지 않음) | 0     |
| expected에 있는데 디스크에 없음                                           | missing  | 만든다             | 1     |
| recorded와 hash가 같고 expected와 다름 (source · config가 바뀜)           | outdated | 새 내용으로 바꾼다 | 1     |
| recorded와 hash가 같고 expected에 없음                                    | stale    | 지운다             | 1     |
| recorded에 있지만 hash가 다르고 expected 와도 다름                        | modified | 거부               | 2     |
| recorded에 없는 파일 · 디렉터리 (expected와 이름이 겹쳐도)                | unknown  | 거부               | 2     |
| `_generated`나 그 조상(`.claude` · `.claude/rules`) · 안의 항목이 symlink | symlink  | 거부               | 2     |
| 생성 manifest가 JSON 아님 · schema 위반 · 허용 안 된 키                   | manifest | 거부               | 2     |
| 생성 manifest만 expected와 다름 (예: plugin version만 바뀜)               | outdated | manifest를 바꾼다  | 1     |
| `_generated`가 없음                                                       | 처음     | 만든다             | 1     |
| `_generated`에 파일이 있는데 생성 manifest가 없음                         | unknown  | 거부               | 2     |

- modified의 hash가 우연히 expected와 같으면 "일치"로 본다(내용이 맞으면 누가 썼는지 묻지 않는다)
- 생성 manifest를 조작해 hash를 바꾸면 해당 파일은 modified가 된다 → 2. sync는 조작된 manifest를 근거로 지우지 않는다
- 쓰기는 같은 디렉터리의 임시 파일 → rename. 생성 manifest는 마지막에 쓴다
- 중간에 멈춘 흔적(임시 파일 · 반쯤 바뀐 파일)은 다음 실행에서 unknown · modified로 2가 된다. 복구는 `_generated/` 삭제 후 sync
- `_generated` 밖의 경로는 읽지도 지우지도 않는다(config 한 파일만 읽는다)

### 경로

- 쓰는 경로는 `<realpath(root)>/.claude/rules/_generated/<id>.md`와 `.../manifest.json` 뿐이다
- id · 파일 키 정규식이 `/` · `..` · `\` · 절대 경로를 막는다. 정규식을 통과하지 못한 값은 경로로 만들지 않고 2
- `.claude` · `.claude/rules`가 없으면 sync가 만든다(`_generated` 조상 디렉터리만). check는 만들지 않는다

### idempotency

- sync 직후 check는 0
- sync를 두 번 하면 두 번째는 아무 파일도 쓰지 않는다 — 내용 · mtime이 그대로다
- check는 몇 번을 해도 디스크가 바뀌지 않는다 — 파일 · 디렉터리 · 임시 파일 · lock을 만들지 않는다

## 6. provenance (`<root>/.claude/harness-source.json`)

```json
{
  "schemaVersion": 1,
  "repository": "https://github.com/berrypjh/shared-stack",
  "commit": "<40자 소문자 hex>",
  "plugin": "berry-dev",
  "version": "0.1.0"
}
```

- 소비 저장소가 소유한다. `standards.mjs`는 이 파일을 읽지 않는다
- 소비 저장소의 setup · CI가 확인한다: `commit`이 `^[0-9a-f]{40}$` · checkout 한 source의 `git rev-parse HEAD`와 같음 · 그 source의 `plugin.json` `version`과 같음. 짧은 SHA · branch · tag는 거부
- 순서: provenance 확인 → `check`. 둘은 따로 실패한다

## 7. secret hook

### 정책 (`scripts/secret-policy.mjs`, 순수 함수)

- 공개 이름: `BYPASS` · `SECRET_BASENAME` · `SAFE_BASENAME` · `tokenize` · `findSecretPath` · `findSecretReason(command)` (사유 또는 null)
- 이 정의는 한 벌이다. shared-stack의 local hook은 import만 하고 사본을 두지 않는다

- `tokenize(command)` — ``/[\s;|&<>()'"`,=]+/``로 나눈다(현재 shared-stack 판 그대로)
- secret basename `^\.env(\.|$)` 또는 `\.(key|p8|p12|jks|mobileprovision)$`, 단 `\.(example|sample|template)$`은 제외
- 우회 수단(`BYPASS`): 셸 리다이렉트(fd 숫자 뒤 · `>&` 제외) · `node|bun|deno -e|--eval` · `python|ruby|perl -c|-e` · `xxd base64 od strings dd tee cp mv grep rg awk`
- 판정: secret 경로와 우회 수단이 **함께** 있을 때만 deny. 원본 명령을 본다(따옴표를 지우지 않는다)

### adapter (`scripts/guard-secrets.mjs`) 와 local hook 의 공통 계약

| 입력 (stdin)                                  | stdout          | exit |
| --------------------------------------------- | --------------- | ---- |
| 통과할 `tool_input.command`                   | 비어 있음       | 0    |
| 막을 `tool_input.command`                     | deny JSON 한 개 | 0    |
| JSON 아님 · `command` 없음 · 문자열 아님      | 비어 있음       | 0    |
| adapter만: `tool_name`이 `Bash`가 아님 · 없음 | 비어 있음       | 0    |

- 통과에 `allow`를 내지 않는다. 빈 출력이어야 다른 권한 판정이 그대로 돈다
- 사례표와 결과는 `tools/scripts/claude-harness/guard.test.ts`. local hook 판정은 통합 전 동작을 고정한 것이다

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "<경로 · 수단 · 대신 할 일>"
  }
}
```

- hook 자체 오류는 통과(exit 0). exit 2로 막지 않는다
- local `.claude/hooks/guard-bash.mjs`는 `PORT_BOUND`를 먼저 보고, secret은 정책 함수를 import 해 판정한다(전환 1단계)
- `PORT_BOUND`는 따옴표 안 문자열을 지운 뒤 본다 — local 계약이고 plugin에 없다

## 8. plugin 구조

- `.claude-plugin/plugin.json`: `name`은 `berry-dev`, `version`은 semver
- `.claude-plugin/marketplace.json`에 `berry-dev` 항목이 있고 `source`는 `./plugins/berry-dev`, `version` 필드 없음
- `hooks/hooks.json`: `PreToolUse` · matcher `Bash` · exec form `command: "node"`, `args: ["${CLAUDE_PLUGIN_ROOT}/scripts/guard-secrets.mjs"]` · `timeout: 10`(초)
- `skills/<name>/SKILL.md`가 정확히 2개, frontmatter `name`이 폴더 이름과 같고 `description`이 있다
- skill 본문은 저장소 사실(경로 · 명령 · 프로젝트 이름)을 적지 않고 `.claude/harness.profile.md`를 가리킨다. profile이 없으면 없다고 보고하고 추측하지 않는다
- 없어야 하는 것: `package.json` · `node_modules` · `dist` · `.mcp.json` · `project.json` · `settings.json`의 permissions
- 모든 `.mjs`의 import가 `node:` 또는 plugin 안 상대 경로

## 9. 테스트 사례

테스트는 `node --test`로 돈다. 소비 저장소 fixture는 테스트가 `os.tmpdir()` 아래에 만들고 지운다 — 저장소에 제품 코드 fixture를 커밋하지 않는다. source도 필요하면 임시 디렉터리에 만든 가짜 `standards/`를 쓴다.

### sync · check

| id   | 입력                                                                                                                     | 기대                                                         |
| ---- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| S-01 | 빈 fixture + core 1 · optional 1(`paths` 있음) config → sync                                                             | exit 0, `_generated/`에 `.md` 2개 + manifest, 이어서 check 0 |
| S-02 | S-01 뒤 sync 한 번 더                                                                                                    | exit 0, 모든 파일 내용 · mtime 동일                          |
| S-03 | S-01 뒤 check를 두 번                                                                                                    | 두 번 모두 0, 실행 전후 트리(경로 · 크기 · mtime) 동일       |
| S-04 | S-01 뒤 source 본문 한 줄 변경 → check → sync → check                                                                    | 1 → 0 → 0, 바뀐 파일만 다시 씀                               |
| S-05 | S-01 뒤 optional id를 config에서 제거 → check → sync                                                                     | 1 → 0, 그 `.md`가 지워짐(stale)                              |
| S-06 | S-01 뒤 생성 `.md`를 손으로 수정 → check → sync                                                                          | 2 → 2, 파일 내용 그대로                                      |
| S-07 | S-01 뒤 생성 manifest의 hash 하나를 바꿈 → sync                                                                          | 2, 아무것도 지우거나 쓰지 않음                               |
| S-08 | S-01 뒤 생성 manifest를 JSON 아닌 내용으로 → check · sync                                                                | 둘 다 2                                                      |
| S-09 | S-01 뒤 `_generated/notes.md` 추가 → check · sync                                                                        | 둘 다 2, `notes.md` 그대로                                   |
| S-10 | 첫 sync 전 `_generated/<core-id>.md`가 이미 있음(unknown 충돌)                                                           | 2, 그 파일 그대로                                            |
| S-11 | `_generated`가 다른 디렉터리를 가리키는 symlink                                                                          | 2, 대상 디렉터리 변화 없음                                   |
| S-12 | `_generated/<id>.md`가 symlink                                                                                           | 2                                                            |
| S-13 | `.claude/standards.json`이 symlink                                                                                       | 2                                                            |
| S-14 | config: 모르는 id · 빈 `paths` · optional에 `true` · core에 `{paths}` · `body` 필드                                      | 각각 2, `_generated`가 생기지 않음                           |
| S-15 | config 없음 · `schemaVersion: 2`                                                                                         | 각각 2                                                       |
| S-16 | source manifest에 `../x` 형태 id · 등록 안 된 rule 파일 · 파일 없는 id                                                   | 각각 2                                                       |
| S-17 | local 파일(`.claude/rules/local.md` · `.claude/settings.json` · `CLAUDE.md`)이 있는 fixture → sync → 제거 시나리오(S-05) | local 파일 byte · mtime 동일                                 |
| S-18 | config 들여쓰기 · 키 순서만 변경 → check                                                                                 | 0                                                            |
| S-19 | `plugin.json` version만 변경 → check → sync                                                                              | 1 → 0, `.md`는 다시 쓰지 않고 manifest만 바뀜                |
| S-20 | 두 번 실행한 sync 결과를 다른 임시 디렉터리에서 같은 입력으로 다시 만듦                                                  | 두 결과가 byte 단위로 같음                                   |
| S-21 | `--project` 없음 · 없는 경로 · 모르는 subcommand                                                                         | 각각 2                                                       |
| S-22 | stdout · stderr에 fixture의 절대 경로가 없음                                                                             | 통과                                                         |

### hook 계약

| id   | 입력                                                   | 기대                                                                    |
| ---- | ------------------------------------------------------ | ----------------------------------------------------------------------- |
| H-01 | 통과 명령                                              | stdout 비어 있음, exit 0                                                |
| H-02 | 막는 명령                                              | JSON 한 개, `hookEventName` · `permissionDecision: deny` · 사유, exit 0 |
| H-03 | stdin이 JSON 아님                                      | stdout 비어 있음, exit 0                                                |
| H-04 | `tool_input` 없음 · `command`가 숫자                   | stdout 비어 있음, exit 0                                                |
| H-05 | 같은 사례표를 plugin adapter와 local hook 둘 다에 실행 | secret 판정이 같음                                                      |
| H-06 | local hook의 정책 import가 해석됨                      | local hook을 실제로 실행해 secret 사례가 deny                           |

H-06이 필요한 이유: 정적 import가 실패하면 hook은 오류로 끝나고 Claude Code는 통과시킨다 — 보호가 조용히 빠진다.

### tokenizer · 정책 회귀

현재 shared-stack hook을 실제로 실행해 확인한 판정(2026-09-24). `<env>`는 `.env`를 뜻한다.

| id   | 명령                                                      | 기대                                                             |
| ---- | --------------------------------------------------------- | ---------------------------------------------------------------- |
| T-01 | `cat <env>`                                               | 통과 — 우회 수단 없음(Read deny 영역)                            |
| T-02 | `cat <env> > out.txt`                                     | deny (리다이렉트)                                                |
| T-03 | `cat <env> 2>/dev/null` · `cat <env> 2>&1`                | 통과 — fd 리다이렉트는 우회 수단이 아님                          |
| T-04 | `node -e "require('fs').readFileSync('<env>')"`           | deny (eval, 따옴표 안까지 봄)                                    |
| T-05 | `python3 -c "open('<env>')"`                              | deny                                                             |
| T-06 | `grep KEY <env>.local`                                    | deny                                                             |
| T-07 | `base64 apps/api/<env>.production`                        | deny (하위 경로의 basename)                                      |
| T-08 | `cp <env> /tmp/x`                                         | deny                                                             |
| T-09 | `cat <env>.example \| grep KEY` · `grep KEY <env>.sample` | 통과 (안전 접미사)                                               |
| T-10 | `tool --file=<env> \| tee x`                              | deny — `=`에서 자름(snapdone 판은 놓침)                          |
| T-11 | `grep x a,<env>`                                          | deny — `,`에서 자름(snapdone 판은 놓침)                          |
| T-12 | ``grep x `echo <env>` ``                                  | deny — 백틱에서 자름                                             |
| T-13 | `grep x certs/server.key`                                 | deny                                                             |
| T-14 | `grep x server.pem`                                       | 통과 — `.pem`은 현재 목록에 없음(현 동작 고정, 확장은 별도 결정) |
| T-15 | `ls <env>` · `echo hi > /tmp/out`                         | 통과 — 한 조건만 있음                                            |

`PORT_BOUND`(local) 회귀는 local hook 테스트에 둔다: `pnpm nx serve @berrypjh/devhub` · `npx playwright test`는 deny, `echo "pnpm nx serve x"` · `grep -r "nx e2e" docs`는 통과.

### plugin 구조

| id   | 확인                                                                   |
| ---- | ---------------------------------------------------------------------- |
| P-01 | `plugin.json`의 `name` · semver `version`, 버전이 다른 곳에 없음       |
| P-02 | marketplace 항목의 `source` · `version` 없음                           |
| P-03 | `hooks.json`의 matcher · `${CLAUDE_PLUGIN_ROOT}` 경로 · 대상 파일 존재 |
| P-04 | skill 2개, `name` = 폴더, `description` 있음                           |
| P-05 | source manifest ↔ `standards/rules/*.md` 1:1                          |
| P-06 | 금지 파일 없음(`package.json` · `.mcp.json` · `dist` · `project.json`) |
| P-07 | `.mjs` import가 `node:` 또는 plugin 안 상대 경로                       |

`claude plugin validate ./plugins/berry-dev`는 사람이 실행한다(CI에 Claude Code CLI가 있다고 가정하지 않는다).
