---
paths:
  - 'apps/devhub-e2e/**'
---

# devhub-e2e (`apps/devhub-e2e`)

Playwright. `devhub`를 **실제 브라우저에서** 확인한다.

vitest(앱 안)는 jsdom에 그린 DOM을 보고, 여기서는 jsdom이 볼 수 없는 것을 본다 — 레이아웃 · 가로 넘침 · CSS 전환 · 네이티브 `<dialog>` 포커스 복귀 · 브라우저 단축키 · 새로고침 뒤 저장. 실행 모델(Playwright가 서버와 브라우저를 띄움)이 달라 별도 Nx 프로젝트다(implicit dependency → devhub).

## 원칙

- **앱 소스를 import하지 않는다.** 확인할 것은 렌더된 화면이다
- **평가 데이터는 주입만 한다.** 공개 JSON은 계약 schema로 만든 fixture(`support/observability.ts`)를 `page.route`로 넣는다. `public/observability`에 쓰지 않는다
- **역할 · 이름으로 찾는다.** `getByRole`이 기본이다. 역할이 없는 자리(그림의 노드 · `#id` 대상)만 `href` · `id`로 찾는다
- **키보드 경로는 Tab으로 닿는다.** `locator.focus()` 대신 `tabTo`를 쓴다. 본문 안의 대상은 "본문으로 건너뛰기"로 들어간 뒤 닿는다(`enterMain`)
- **픽셀 · 정확한 시간을 단언하지 않는다.** 동작 · 주소 · 포커스 · 보이는 글 · 순서까지다. 가로 넘침은 `scrollWidth - clientWidth ≤ 0`만 본다
- **접근성 동작을 테스트에 맞춰 빼지 않는다.** 실패하면 앱을 고친다

## 파일

```
playwright.config.ts     port 4400 (앱 vite strictPort 와 같음) · webServer · CI 에서 서버 재사용 안 함 · Chromium 만
src/
  support/keyboard.ts    tabTo · enterMain · 가로 넘침 · 이동 뒤 포커스 자리
  support/observability.ts  평가 공개 JSON fixture(계약 schema) · page.route 주입
  shell.spec.ts          데스크톱 3칸 · 건너뛰기 링크 둘 · 보기 이동 뒤 포커스 · 상세 정보 딥링크 · 없는 주소
  responsive.spec.ts     320 · 390px 가로 넘침 없음(평가 개요 · 번들 포함) · 탐색기 서랍(열기 · Escape · 닫기 · 바깥 · 항목) · 움직임 줄이기
  search.spec.ts         ⌘K / Ctrl+K · 결과 수 · 화살표 · Enter · 해시 결과 · Escape · 결과 없음 · 좁은 화면 펼침
  theme.spec.ts          OS 다크 · 키보드 전환 · 새로고침 뒤 유지
  document.spec.ts       "이 페이지에서" — 넓으면 옆, 좁으면 접힘 · 키보드로 절 이동 · 앵커 주소로 열기
  canvas.spec.ts         아키텍처 그림 · 목록 선택 · 흐름 단계 선택 · 크게 보기 dialog 포커스 복귀
  records.spec.ts        기록 목록(최신순 · 날짜 · 종류) · 기록 하나(본문 · 목차 · 상세 정보) · 다음 기록은 상세 정보에 머묾
  evaluation.spec.ts     평가 하위 메뉴 이동 · 이동 뒤 포커스 · 고른 실행(?run=) 유지 · 좁은 폭의 넓은 표 스크롤 영역
  evaluation-runs.spec.ts     명시한 baseline 비교 · 포인터 · 비교 불가 · not-measured · 추세 구간
```

## 검증

```bash
pnpm nx typecheck @berrypjh/devhub-e2e
pnpm nx e2e @berrypjh/devhub-e2e     # devhub dev 서버를 띄운다 (CI 는 새 서버만)
```

브라우저는 저장소 방식 그대로 설치한다 — `pnpm exec playwright install --with-deps chromium`(`.github/workflows/pr-check.yml`의 a11y job과 같다). **CI workflow에는 아직 넣지 않았다.**

## Gotcha

- **package.json이 없다.** Playwright · 계약 lib은 root `node_modules`에서 해석된다
- **로컬에서는 4400에 이미 떠 있는 서버를 재사용한다.** 다른 앱이 떠 있으면 첫 단언부터 실패한다
- **"이 페이지에서"가 본문 옆에 오는 기준은 화면이 아니라 작업 영역 폭(`@4xl`)이다.** 넓은 쪽 테스트는 1920px로 연다
