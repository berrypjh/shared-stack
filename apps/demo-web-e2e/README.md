# @berrypjh/demo-web-e2e

`@berrypjh/demo-web` 의 [Playwright](https://playwright.dev/) E2E 테스트입니다. 실제 브라우저에서
페이지 이동과 컴포넌트 동작을 확인합니다 — 픽셀은 보지 않습니다.

## 실행

```bash
pnpm nx e2e @berrypjh/demo-web-e2e         # 헤드리스
pnpm nx e2e-ui @berrypjh/demo-web-e2e      # UI 모드 (시각적 디버깅)
pnpm nx typecheck @berrypjh/demo-web-e2e
```

`playwright.config.ts` 의 `webServer` 가 `demo-web` 개발 서버(4200)를 자동으로 띄우고, 이미 떠
있으면 그것을 재사용합니다. `BASE_URL` 로 대상 주소를 바꿀 수 있습니다.

## 구조

`src/*.spec.ts` 가 동작 단위로 나뉩니다. 이동 테스트는 목적지 목록을 적어 두지 않고 **렌더된
사이드바**에서 읽습니다 — Nx 프로젝트 경계 때문에 `demo-web` 소스를 import 할 수 없고, 어차피
확인해야 할 것은 브라우저에 그려진 목록입니다.

작업 규칙·함정은 `AGENTS.md` 에 있습니다.
