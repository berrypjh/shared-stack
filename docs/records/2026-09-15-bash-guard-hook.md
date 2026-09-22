# AI 세션의 Bash 를 PreToolUse hook 으로 가드

샌드박스에서 실행할 수 없는 포트 바인딩 명령과, secret 파일을 우회해서 읽는 명령만 `.claude/hooks/guard-bash.mjs` 가 막음. 애매한 경우는 막지 않음.

## 상황

- AI 세션의 샌드박스는 포트 바인딩이 막혀 있어 dev 서버 · Storybook · local registry · Playwright e2e 가 멈추거나 실패함. 그런데도 실행을 시도하고 "검증했다"고 보고하는 일이 생김
- `.env` · 인증서 파일은 `permissions.deny` 의 `Read(...)` 로 막았지만, `cat` · 리다이렉트 · `node -e` 같은 Bash 는 그 검사를 지나지 않음
- 플러그인 dist 를 직접 실행하던 `.mcp.json` 은 `enabledPlugins` 와 역할이 겹침

## 판단

- **막는 것은 두 가지뿐** — 포트 바인딩 명령(`PORT_BOUND`)과 "secret 경로 + 우회 수단(`BYPASS`)" 조합. 둘 다 아니면 통과
- **거부 사유가 다음 행동을 말함** — 포트 바인딩은 사용자에게 직접 실행을 요청하고 결과를 받기 전엔 검증했다고 보고하지 말 것, secret 은 `.env.example` 의 키 이름만 볼 것
- **오탐을 줄임** — 포트 바인딩 검사 전에 따옴표 안 문자열을 지워 검색어 · 출력 문자열 속 명령을 걸러 냄. secret 검사는 eval 코드 안까지 봐야 해서 원본 명령을 씀
- **hook 오류는 통과** — hook 자체가 죽어 모든 Bash 가 막히지 않도록 `catch` 에서 `exit 0`
- **파괴적 명령은 ask** — `pnpm release:npm` · `nx release` · `npm publish` · `pnpm i` 를 `permissions.ask` 에 추가

## 반영

- `.claude/hooks/guard-bash.mjs` — `PORT_BOUND` · `BYPASS` · `findReason`, deny 응답
- `.claude/settings.json` — `hooks.PreToolUse` 에 등록, ask 규칙 추가, 없는 `nx build mobile` 항목 삭제
- `.mcp.json` 삭제

## 검증

- hook 을 검사하는 자동 테스트는 없음. AI 세션에서 `pnpm nx serve @berrypjh/devhub` 를 치면 deny 사유가 돌아오는 것으로 확인
- `apps/devhub/AGENTS.md` 검증 절이 같은 사실을 반대편에서 말함 — 실제 브라우저 확인은 사용자 터미널에서
