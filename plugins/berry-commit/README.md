# berry-commit

staged 변경을 scope별로 나눠 한국어 Conventional Commits 메시지를 제안하고, 승인받은 scope만 커밋한다.

| 구성  | 이름                         | 역할                               |
| ----- | ---------------------------- | ---------------------------------- |
| skill | `/berry-commit:commit-scope` | 메시지 제안과 승인 흐름            |
| MCP   | `commit-mcp`                 | staged scope 조회, scope 단위 커밋 |

## 설치

소비하는 저장소의 `.claude/settings.json`에 두 키를 넣는다. 팀원이 폴더를 trust하면 별도 프롬프트 없이 설치된다.

```json
{
  "extraKnownMarketplaces": {
    "berrypjh": {
      "source": { "source": "github", "repo": "berrypjh/shared-stack" }
    }
  },
  "enabledPlugins": {
    "berry-commit@berrypjh": true
  }
}
```

개인 환경에 직접 넣으려면:

```bash
claude plugin marketplace add berrypjh/shared-stack
claude plugin install berry-commit@berrypjh
```

## 사용

```
/berry-commit:commit-scope                    모든 staged scope
/berry-commit:commit-scope react-ui           해당 scope만
/berry-commit:commit-scope react-ui major     BREAKING CHANGE footer 흐름
```

`major`는 published library scope에만 적용된다. 판정 기준은 `nx.json`의 `release.projects`에 있고 `package.json`에 `private: true`가 없는 프로젝트다. 그런 scope가 없는 저장소에서는 무시된다.

메시지 규칙은 [skills/commit-scope/examples/commit-message-rules.md](skills/commit-scope/examples/commit-message-rules.md). type 목록과 길이 제한은 `@berrypjh/commitlint-config`가 강제한다.

## 개발

`dist/index.js`는 esbuild로 의존성까지 묶은 단일 파일이며 **저장소에 커밋된다.** 플러그인 설치에는 빌드 단계가 없어서, 산출물이 저장소에 없으면 서버가 뜨지 않는다.

```bash
pnpm build:mcp:commit                        # tsc 타입검사 -> esbuild 번들
claude --plugin-dir ./plugins/berry-commit   # 로컬 로드 확인
claude plugin validate ./plugins/berry-commit --strict
```

`src/`를 고치면 반드시 다시 빌드해서 `dist/`를 함께 커밋한다.

버전은 `.claude-plugin/plugin.json`의 `version`이 기준이다. 올린 뒤 `claude plugin tag ./plugins/berry-commit`으로 릴리스 태그를 만들 수 있다.
