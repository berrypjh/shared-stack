# devhub-e2e

## 왜 있나

`devhub` 를 **실제 브라우저에서** 확인한다. vitest(앱 안)는 jsdom 에 그린 DOM 을 보고, 여기서는 레이아웃 ·
가로 넘침 · CSS 전환 · 네이티브 `<dialog>` 포커스 복귀 · 브라우저 단축키 · 새로고침 뒤 저장처럼 jsdom 이 볼 수
없는 것을 본다. 실행 모델(Playwright 가 서버와 브라우저를 띄움)이 달라 `quality-lab-e2e` 와 같은 모양의 별도
Nx 프로젝트다.

## 절대 원칙

- **앱 소스를 import 하지 않는다.** 확인할 것은 렌더된 화면이다.
- **역할 · 이름으로 찾는다.** `getByRole` 이 기본이다. 역할이 없는 자리(그림의 노드 · `#id` 대상)만
  `href` · `id` 로 찾는다.
- **키보드 경로는 Tab 으로 닿는다.** `locator.focus()` 대신 `tabTo`. 본문 안의 대상은 "본문으로 건너뛰기"로
  들어간 뒤 닿는다(`enterMain`).
- **픽셀 · 정확한 시간을 단언하지 않는다.** 동작 · 주소 · 포커스 · 보이는 글 · 순서까지다. 가로 넘침은
  `scrollWidth - clientWidth ≤ 0` 만 본다.
- **접근성 동작을 테스트에 맞춰 빼지 않는다.** 실패하면 앱을 고친다.

## 파일

```
playwright.config.ts     port 4400 (앱 vite strictPort 와 같음) · webServer · CI 에서 서버 재사용 안 함 · Chromium 만
src/
  support/keyboard.ts    tabTo · enterMain · 가로 넘침 · 이동 뒤 포커스 자리
  shell.spec.ts          데스크톱 3칸 · 건너뛰기 링크 둘 · 보기 이동 뒤 포커스 · 상세 정보 딥링크 · 없는 주소
  responsive.spec.ts     320 · 390px 가로 넘침 없음 · 탐색기 서랍(열기 · Escape · 닫기 · 바깥 · 항목) · 움직임 줄이기
  search.spec.ts         ⌘K / Ctrl+K · 결과 수 · 화살표 · Enter · 해시 결과 · Escape · 결과 없음 · 좁은 화면 펼침
  theme.spec.ts          OS 다크 · 키보드 전환 · 새로고침 뒤 유지
  document.spec.ts       "이 페이지에서" — 넓으면 옆, 좁으면 접힘 · 키보드로 절 이동 · 앵커 주소로 열기
  canvas.spec.ts         아키텍처 그림 · 목록 선택 · 흐름 단계 선택 · 크게 보기 dialog 포커스 복귀
  records.spec.ts        기록 목록(최신순 · 날짜 · 종류) · 기록 하나(본문 · 목차 · 상세 정보) · 다음 기록은 상세 정보에 머묾
```

## 검증

```bash
pnpm nx typecheck @berrypjh/devhub-e2e
pnpm nx e2e @berrypjh/devhub-e2e     # devhub dev 서버를 띄운다 (CI 는 새 서버만)
```

브라우저는 저장소의 방식 그대로 설치한다: `pnpm exec playwright install --with-deps chromium`
(`.github/workflows/pr-check.yml` 의 a11y job 과 같다). CI workflow 에는 아직 넣지 않았다.

## Gotcha

- **package.json 이 없다.** Playwright 는 root `node_modules` 에서 해석된다(`quality-lab-e2e` 와 같다).
- 로컬에서는 4400 에 이미 떠 있는 서버를 재사용한다. 다른 앱이 떠 있으면 첫 단언부터 실패한다.
- "이 페이지에서"가 본문 옆에 오는 기준은 화면이 아니라 작업 영역 폭(`@4xl`)이다 — 넓은 쪽 테스트는 1920px 로 연다.
