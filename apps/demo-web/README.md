# @berrypjh/demo-web

`@berrypjh/react-ui` 를 실제 앱으로 통합했을 때 무엇이 살아 있는지 확인하는 웹 데모입니다.
개별 컴포넌트의 상태 탐색과 시각 회귀는 Storybook 이 담당하고, 여기서는 테마 전환 · CSS
캐스케이드 · Tailwind preset · 패키지 경계를 봅니다.

## 실행

```bash
pnpm nx serve @berrypjh/demo-web       # 개발 서버 (http://localhost:4200)
pnpm nx build @berrypjh/demo-web       # 프로덕션 빌드
pnpm nx test @berrypjh/demo-web        # vitest
pnpm nx typecheck @berrypjh/demo-web   # tsc (의존 패키지를 먼저 빌드합니다)
```

브라우저 E2E 는 별도 프로젝트입니다 — `apps/demo-web-e2e`.

## 구조

`src/app/shell` 이 사이드바·topbar·페이지 primitive 를, `src/app/pages` 가 화면 하나씩을
가집니다. 정보 구조의 정답은 `src/app/shell/nav.ts` 이고, 페이지를 거기 등록하면 라우트
스모크와 E2E 이동 테스트가 자동으로 덮습니다.

작업 규칙·함정은 `AGENTS.md` 에 있습니다.
