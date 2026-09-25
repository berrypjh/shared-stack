# @berrypjh/demo-web

`@berrypjh/react-ui`를 실제 앱으로 통합했을 때 무엇이 살아 있는지 확인하는 웹 데모.

개별 컴포넌트의 상태 탐색과 시각 회귀는 Storybook이 맡고, 여기서는 테마 전환 · CSS 캐스케이드 · Tailwind preset · 패키지 경계를 본다.

## 실행

```bash
pnpm nx serve @berrypjh/demo-web       # 개발 서버 http://localhost:4200
pnpm nx build @berrypjh/demo-web       # 프로덕션 빌드
pnpm nx test @berrypjh/demo-web        # vitest
pnpm nx typecheck @berrypjh/demo-web   # tsc (의존 패키지를 먼저 빌드한다)
```

## 구조

| 위치                                 | 내용                                                            |
| ------------------------------------ | --------------------------------------------------------------- |
| `apps/demo-web/src/app/shell`        | 사이드바 · topbar · 페이지 primitive                            |
| `apps/demo-web/src/app/pages`        | 화면 하나씩                                                     |
| `apps/demo-web/src/app/shell/nav.ts` | 정보 구조의 정답. 여기 등록하면 라우트 스모크가 자동으로 덮는다 |

작업 규칙과 함정은 [.claude/rules/demo-web.md](../../.claude/rules/demo-web.md).
