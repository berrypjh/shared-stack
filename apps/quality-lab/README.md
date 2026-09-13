# @berrypjh/quality-lab

shared-stack 의 test·check·bundle·context 수집 결과를 보여주는 private Vite 앱입니다. 수집과
export 는 Node CLI 가 하고, 앱은 export 된 JSON 을 계약으로 검증한 뒤에만 표시합니다.

## 실행

```bash
pnpm quality:collect --profile=static --run-id=local-static-01
pnpm quality:export --run-id=local-static-01
pnpm nx serve @berrypjh/quality-lab      # http://localhost:4300
```

`--profile=core` 는 registry 의 test·check·bundle 명령을 실행합니다. 구조와 의미 규칙은
`docs/quality-lab/architecture.md`, 작업 규칙은 `AGENTS.md` 에 있습니다.
