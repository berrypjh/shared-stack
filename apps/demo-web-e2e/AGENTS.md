# demo-web-e2e

## 왜 있나

`demo-web` 을 **실제 브라우저에서** 확인한다. vitest 스모크(`demo-web` 안)가 보는 것은 렌더
결과의 DOM 이고, 여기서 보는 것은 그쪽이 볼 수 없는 것 — 실제 라우팅 이동, 클릭, dev 서버로
빌드된 CSS 가 붙은 화면이다.

별도 Nx 프로젝트인 이유는 실행 모델이 다르기 때문이다. Playwright 가 브라우저를 띄우고 dev
서버를 기동한다. 그래서 **`demo-web` 소스를 import 하지 않는다** — 프로젝트 경계를 넘지 않고,
어차피 확인해야 할 것은 브라우저에 그려진 것이다.

---

## 절대 원칙

- **목적지 목록을 여기 적지 않는다.** 이동 테스트는 **렌더된 사이드바**에서 링크를 수집한다.
  경로를 손으로 적으면 `demo-web` 에 페이지가 늘 때 이 테스트만 조용히 낡는다.
- **역할과 이름으로 찾는다.** `getByRole` · `getByRole('heading')` 이 기본이다. `getByTestId`
  는 역할·이름으로 가리킬 수 없는 화면 단위 앵커에만 쓴다 (`overview-page` 등).
- **픽셀을 단언하지 않는다.** 색·간격·폰트는 보지 않는다. 동작과 가시성까지다. 시각 회귀는
  Storybook/Chromatic 이 담당한다.
- **수집한 목록이 비면 조용히 통과한다.** 수집으로 도는 반복문에는 길이 하한을 함께 단언한다.

---

## 파일

```
playwright.config.ts       Nx preset + baseURL · webServer · chromium
src/
  navigation.spec.ts       정보 구조 이동 — 첫 화면 · 사이드바 전체 이동 · 현재 위치 표시
```

---

## 작업 매트릭스

| 작업             | 수정 파일                                                     |
| ---------------- | ------------------------------------------------------------- |
| 이동 시나리오    | `src/navigation.spec.ts` (경로를 적지 말고 사이드바에서 읽기) |
| 새 상호작용 검증 | `src/{주제}.spec.ts` — 화면이 아니라 **동작** 단위로 나눈다   |
| 브라우저·포트    | `playwright.config.ts`                                        |

---

## 검증

```bash
pnpm nx e2e @berrypjh/demo-web-e2e        # 헤드리스 (dev 서버를 자동으로 띄운다)
pnpm nx e2e-ui @berrypjh/demo-web-e2e     # UI 모드 — 시각적 디버깅
pnpm nx typecheck @berrypjh/demo-web-e2e
```

| 변경                      | 최소 검증                     |
| ------------------------- | ----------------------------- |
| spec 추가·수정            | `e2e`                         |
| `demo-web` 정보 구조 변경 | `demo-web:test` + `e2e` 둘 다 |

---

## Gotcha

- **dev 서버는 자동으로 뜬다.** `webServer` 가 `demo-web:serve` 를 4200 에 띄우고,
  `reuseExistingServer` 라 이미 떠 있으면 그것을 쓴다. 직접 띄워 두고 돌려도 된다.
- **`BASE_URL` 로 대상을 바꿀 수 있다.** 배포된 미리보기를 겨냥할 때 쓴다 — 그때도 `webServer`
  는 로컬 서버를 띄우려 하므로 이미 떠 있는 서버가 없으면 함께 기동된다.
- **chromium 하나만 돈다.** 브라우저별 차이를 보는 자리가 아니다.
- **사이드바 라벨과 페이지 h1 은 같은 문장이다.** 이동 테스트가 이 규칙으로 도착지를 확인한다
  (`demo-web` 의 vitest 스모크도 같은 규칙을 쓴다). 다르게 두면 두 테스트가 같이 깨진다.
