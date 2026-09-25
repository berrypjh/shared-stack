# Claude Harness 도입

berry-dev를 저장소에 들이는 순서. 설계는 [architecture.md](./architecture.md), 입력 · 기대 결과는 [contracts.md](./contracts.md), 검증 명령은 [verification.md](./verification.md).

- 재현성의 근거는 **고정한 shared-stack full SHA의 checkout** 하나다. plugin cache 경로와 움직이는 `main` HEAD는 근거가 아님
- plugin을 설치하거나 켰다고 가정하지 않음. 켜진 것은 `/hooks` · skill 목록으로 확인한 뒤에만 켜졌다고 씀
- permissions · `defaultMode` · 실행 제약(`PORT_BOUND`)은 프로젝트가 정함. berry-dev는 주입하지 않음

## 소비 저장소

### 1. source 고정

- berry-dev가 들어 있는 shared-stack 커밋을 고르고 full SHA(40자)를 확인 — `git rev-parse HEAD` 또는 `git ls-remote`
- 그 SHA를 checkout 한 경로를 정함(예: 저장소 옆 checkout, CI 작업 디렉터리). 이 경로는 소비 저장소가 정하는 값
- 그 checkout의 `plugins/berry-dev/.claude-plugin/plugin.json` `version`을 읽음

### 2. local 파일 작성

모두 소비 저장소 소유. 예시는 checkout의 `plugins/berry-dev/examples/`에 있고, 복사한 뒤 검토해서 고침.

| 파일                             | 출발점                        | 내용                                                       |
| -------------------------------- | ----------------------------- | ---------------------------------------------------------- |
| `.claude/harness-source.json`    | `harness-source.example.json` | 1에서 확인한 full SHA · version. 추측한 값을 적지 않음     |
| `.claude/standards.json`         | `standards.consumer.json`     | core 외에 채택할 rule과 경로                               |
| `.claude/harness.profile.md`     | `harness.profile.md`          | 검증 명령 · 실행 제약 · UI 정책 같은 저장소 사실           |
| `.claude/rules/`                 | —                             | 빈 디렉터리 생성. sync는 만들지 않음                       |
| `package.json` scripts           | —                             | `harness:sync` · `harness:check` — checkout 경로의 CLI     |
| `.gitignore` · `.prettierignore` | —                             | `_generated`를 무시하는 규칙이 있으면 예외, formatter 제외 |

```json
{
  "harness:sync": "node <checkout>/plugins/berry-dev/scripts/standards.mjs sync --project .",
  "harness:check": "node <checkout>/plugins/berry-dev/scripts/standards.mjs check --project ."
}
```

permissions는 `permissions.review.json`을 읽고 필요한 것만 `.claude/settings.json`에 옮김. 파일을 합치는 자동 도구는 없음.

### 3. sync · check

```bash
pnpm harness:sync      # .claude/rules/_generated/ 에만 씀
git diff               # 생성 rule 을 읽고 검토
pnpm harness:check     # 0 이어야 함
```

생성 rule · config · profile · `harness-source.json`을 함께 커밋.

### 4. 같은 source 로 plugin 로드

```bash
claude --plugin-dir <checkout>/plugins/berry-dev
```

- 세션 안에서 `/berry-dev:repo-verify` · `/berry-dev:frontend-quality`가 보이는지 확인
- `/hooks`에 plugin의 `PreToolUse` · `Bash` hook이 보이는지 확인
- 차단 확인은 **존재하지 않는** secret 경로로만 함(예: `grep x /nonexistent/.env`). hook이 꺼져 있어도 아무것도 읽지 않음

### 5. hook 전환

4에서 plugin hook이 보이고 차단까지 확인된 뒤에만, local hook의 secret 판정을 뺌. `PORT_BOUND` 같은 실행 제약은 local에 남김. 확인 전에는 기존 local 보호를 그대로 둠.

### marketplace 로 설치할 때

```text
/plugin marketplace add berrypjh/shared-stack
/plugin install berry-dev@berrypjh
```

- 설치 후 `claude plugin list`로 설치된 version을 보고 `harness-source.json`의 version과 대조
- marketplace 설치는 설치 시점 marketplace의 내용을 받음. version이 같아도 SHA가 같다는 보장은 없음 — rule 생성과 CI는 1의 checkout을 씀
- 프로젝트 `.claude/settings.json`의 `enabledPlugins`에 넣는 것은 berry-dev가 원격 기본 브랜치에 있고 설치가 확인된 뒤의 프로젝트 결정

### CI

- shared-stack을 고정한 full SHA로 checkout
- checkout의 `git rev-parse HEAD` · `plugin.json` version이 `harness-source.json`과 같은지 확인
- 그 checkout의 CLI로 `check`만 실행. CI에서 sync하지 않음

## shared-stack (maintainer)

source가 저장소 안에 있으므로 `harness-source.json`이 없다. root scripts가 작업 트리의 CLI를 부른다.

- `.claude/standards.json` — core, `libs/ui-core/src/**`(cross-runtime-pure), 소비 앱 넷의 `src/**`(berry-consumer), `docs/records/**/*.md`(docs-ko). `ko-ui`는 채택 근거가 없어 고르지 않음([standards-sources.md](./standards-sources.md))
- `.claude/harness.profile.md` — 검증 · UI 사실
- `.claude/rules/_generated/` — 커밋 대상. `.gitignore`의 `**/_generated/` 예외와 `.prettierignore` 제외가 있음
- hook — `.claude/settings.json`의 local `guard-bash.mjs`가 활성. secret 판정은 `plugins/berry-dev/scripts/secret-policy.mjs`를 import함. plugin은 marketplace에 등록만 했고 `enabledPlugins`에는 없음
