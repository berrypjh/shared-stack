# quality-lab-e2e

## 왜 있나

`quality-lab` 을 **실제 브라우저에서** 확인한다. vitest(앱 안)는 jsdom 에 그린 DOM 을 보고, 여기서는
dev 서버·라우팅·키보드·좁은 폭처럼 jsdom 이 볼 수 없는 것을 본다. 실행 모델(Playwright 가 서버와
브라우저를 띄움)이 달라 별도 Nx 프로젝트다.

## 절대 원칙

- **앱 소스를 import 하지 않는다.** 확인할 것은 렌더된 화면이다. fixture 는 공개 계약
  `@berrypjh/observability-contracts` 로만 만든다.
- **fixture 는 `page.route` 로만 주입한다.** `apps/quality-lab/public/observability` 에 쓰지 않는다 —
  테스트 데이터가 실측 run 으로 배포되지 않는다.
- **목적지 목록을 적지 않는다.** 이동은 렌더된 `주요 메뉴` 에서 읽고, 목록이 비지 않았음을 단언한다.
- **역할·이름으로 찾는다.** `getByRole`·`getByLabel` 이 기본이다.
- **픽셀·정확한 시간을 단언하지 않는다.** 동작·주소·포커스·보이는 글까지다.

## 파일

```
playwright.config.ts     port 4300 (앱 vite strictPort 와 같음) · webServer · CI 에서 서버 재사용 안 함
src/
  fixtures.ts            계약으로 만든 공개 JSON 한 벌 + page.route 주입
  navigation.spec.ts     주요 메뉴 전체 이동 · h1 포커스 · aria-current · run 유지
  runs-compare.spec.ts   no-baseline · 명시 baseline · 주소 재현·뒤로 · 비교 불가·미측정 · 포인터 없음/깨짐 · 추세 구간·gap
  browser.spec.ts        지원 없는 API fallback · 지원 상태 필터(키보드·뒤로)
  layout.spec.ts         좁은 폭 메뉴 disclosure(Escape 포커스 복귀) · 표 스크롤 영역 이름 · 본문 건너뛰기
```

## 검증

```bash
pnpm nx typecheck @berrypjh/quality-lab-e2e
pnpm nx e2e @berrypjh/quality-lab-e2e     # quality-lab dev 서버를 띄운다 (CI 는 새 서버만)
```

## Gotcha

- **package.json 이 없다.** 새 workspace package 는 lockfile 갱신이 필요하다. Playwright·계약 lib 은
  root `node_modules` 에서 해석된다.
- 로컬에서는 4300 에 이미 떠 있는 서버를 재사용한다. 다른 앱이 떠 있으면 `navigation.spec` 의 title
  단언이 먼저 실패한다.
