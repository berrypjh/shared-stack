# DevHub 공용 화면을 @berrypjh/devhub-ui 패키지로 분리

저장소마다 두는 내부 도구 DevHub 의 셸 · 그림 · markdown · 검색 · 테마 · 아이콘을 공개 패키지 `libs/devhub-ui` 로 옮김. 카탈로그(무엇을 보여 줄지)는 각 앱에 남기고, 라우터는 `DevHubProvider` 로 주입.

## 상황

- 같은 모양의 DevHub 가 두 저장소에 있음 — shared-stack `apps/devhub`(Vite · react-router)와 snapdone `apps/devhub`(Next.js). 셸 · 캔버스 · markdown 파서 · 검색 순위가 파일 단위로 거의 같음
- snapdone 은 shared-stack 소스를 읽지 않고 GitHub Packages 의 `@berrypjh/*` 만 설치함. 공유하려면 게시되는 패키지여야 함
- `libs.md` 규칙: 새 라이브러리는 두 번째 사용처가 실제로 나타났을 때 만듦. 이제 나타남

## 판단

- **react-ui 에 넣지 않음** — 제품 화면용 공개 라이브러리에 도구 전용 조립품(캔버스 · markdown 렌더러 · 탐색기 셸)을 섞지 않음. 번들 한도 · 접근성 검사 정책도 다름. devhub-ui 는 react-ui 의 공개 exports 만 쓰는 첫 라이브러리 소비자
- **카탈로그는 앱에 남김** — 두 저장소의 카탈로그가 다름(snapdone 은 API · 계약 · 시나리오, shared-stack 은 패키지 · 도구 · 흐름). 라이브러리는 글자(라벨 · 빈 이유)와 데이터를 prop 으로 받음
- **라우터를 모름** — `DevHubProvider` 가 `Link` · 현재 위치 · `navigate` 를 받음. 앱마다 어댑터 하나(shared-stack 은 `router-adapter.tsx`)
- **빌드는 tsc** — 번들하지 않아 모듈당 파일 하나. `'use client'` 가 파일마다 남아 Next.js 서버 컴포넌트에서 import 가능하고, 소비자의 Tailwind 가 dist 를 `@source` 로 훑음
- **스타일은 Tailwind entry 로** — `@utility` 가 든 `styles.css` 를 앱이 `@import` 함. 일반 CSS import 가 아님
- **검색 순위의 종류 순서는 앱이 줌** — `buildIndex(entries, kinds)`. 라이브러리는 등급만 앎

## 반영

- `libs/devhub-ui` — `provider` · `ui/icon` · `theme` · `shell` · `canvas` · `markdown` · `doc` · `entity` · `search`, `styles.css`, tsc 빌드, `nx.json` 릴리스 대상
- `apps/devhub` — `components/shell/router-adapter.tsx` · `devhub-shell.tsx`(카탈로그 → 셸 조립) · `global-search.tsx`(색인 → 검색), `styles.css` 의 `@import` · `@source`, 옮겨 간 파일 삭제
- `apps/devhub/src/data` — devhub-ui 패키지 · 관계(peerDependencies 포함) · 테스트 묶음 · 명령 · 문서 등록. `ConsumerDependency.declaredBy` 에 `peerDependencies` 추가
- `tools/lib/package-boundary.test.ts` — 게시 표면 검사에 devhub-ui 추가

## 검증

- `pnpm nx run-many -t typecheck lint test build -p @berrypjh/devhub-ui @berrypjh/devhub` 통과. 앱 테스트가 셸 · 검색 · 문서 · 기록 화면의 계약을 실제 카탈로그로 확인
- 빌드된 CSS 에 `.typo-body-small` · `.devhub-code` 와 라이브러리 전용 클래스(`lg:grid-cols-[15rem…]`)가 있음
- `dist/shell/top-bar.js` 첫 줄이 `'use client';`
- snapdone 쪽 전환은 아직 하지 않음. Next.js 어댑터(`next/link` · `usePathname` · `useRouter().push`)는 README 에 적어 둠
