# devhub

## 왜 있나

shared-stack 저장소의 구조와 근거(패키지 · 앱 · 도구 · 문서 · 기록)를 한곳에서 탐색하는 private Vite 앱이다.
quality-lab 과 별도 앱이다 — 품질 수집 결과(test · bundle · eval metric)는 quality-lab 이 보여 주고,
DevHub 는 그 값을 다시 계산하거나 복제하지 않는다.

개요 · 소비 흐름 · 아키텍처 · 섹션(애플리케이션 · 패키지 · 문서 · 기록 · 엔지니어링) 화면이 카탈로그를 그린다.
탐색기는 소비 흐름 바로 다음에 기록을 두고(최근 결정이 먼저 보이게), 상단 바는 문서 옆에 기록을 둔다 — snapdone DevHub 와 같은 순서다.
항목 화면(앱 · 패키지 · 도구)의 상세 정보 칸은 근거 모델(`lib/catalog/inspection.ts`)을 그린다.
문서 · 기록 화면은 저장소 markdown 본문(build 시점에 묶은 원문)과 "이 페이지에서", 근거 · 역참조를 그린다.

같은 모양의 DevHub 가 다른 저장소(snapdone)에도 있다. 폴더 · 파일 이름 · 화면 어휘를 그쪽과 같게 유지한다.

## 절대 원칙

- **사실을 만들지 않는다.** mock metric · 예시 카드 없음. 값이 없으면 0 이 아니라 없다는 것과 이유를 쓴다.
  실행하지 않은 것 · 지원하지 않는 것을 성공으로 보이지 않는다.
- **소비자처럼 쓴다.** UI 는 `@berrypjh/react-ui` 와 `@berrypjh/devhub-ui` 의 공개 exports 만(`.` · `/styles.css` · `/tailwind`).
  `@berrypjh/ui-core` · `@berrypjh/design-tokens` · 다른 패키지의 source 경로를 import 하지 않는다.
- **화면의 공용 부분은 devhub-ui 에 있다.** 셸 · 탐색기 · 작업 영역 · 상세 정보 틀 · 그림 · markdown · 검색 combobox ·
  테마 · 아이콘은 `libs/devhub-ui` 다. 이 앱에는 카탈로그를 그 컴포넌트에 넘기는 조립(`components/shell/devhub-shell.tsx`)과
  저장소 사실에 묶인 화면만 둔다. 라우터는 `components/shell/router-adapter.tsx` 가 `DevHubProvider` 로 넘긴다.
- **브라우저는 명령을 실행하지 않는다.** 저장소 정보는 build 시점에 읽는다.
- **라이브러리에 있는 것을 다시 만들지 않는다.** react-ui 에 없는 것은 devhub-ui 에, 이 저장소에만 있는 것만 앱에 둔다.
- **카탈로그는 저장소 사실이다.** 경로 · 이름 · 관계는 `src/data` 에만 두고 화면은 `catalog` 를 읽기만 한다.
  화면 코드(`app` · `components`)에 저장소 경로를 적지 않는다. 줄 번호 · 측정값(개수 · 크기 · 통과율)을 싣지 않는다.
- **상태 어휘를 한 필드에 섞지 않는다.** 공개 여부(`Visibility`), 산출물 출처(`ArtifactOrigin`),
  근거 공백(`EvidenceGap.kind`), 실행 조건(`CommandConstraint`)은 각자의 타입이다. `planned` 같은 기본값이 없다.
- **URL 이 선택의 정본이다.** 보기 · 탐색기 · 서랍은 `lib/catalog/entities.ts` 한 곳에서 읽는다. 따로 목록을 두지 않는다.
  아이콘은 `components/ui/view-icons.ts` 가 보기 · 섹션 id 로 고른다 — 같은 곳은 어디서나 같은 모양이다.
- **근거 링크는 스냅샷 커밋에 고정한다.** 커밋에 없는 경로(추적 안 됨 · 새로 추가)는 링크 대신 이유를 쓴다 —
  404 링크를 만들지 않는다. 디렉터리 경로는 `SourceRef.directory` 로 표시하고 테스트가 디스크와 대조한다.
- **공개 여부는 매니페스트의 `private` 만 근거다.** `package.json` 이 없으면 "정의되지 않음"이지 추측하지 않는다.
  진입점은 `exports`(없으면 main · files)만이고, 빌드 산출물 경로는 위치를 알리는 글일 뿐 import 대상으로 보이지 않는다.
- **흐름은 저장소가 증명하는 것만 싣는다.** 단계는 `implemented` · `partial` · `documented-only` 중 하나다.
  소스가 없으면 `implemented` 가 아니고, 저장소 밖 단계(설치 등)는 문서만 인용하는 `documented-only` 다.
  `partial` 은 근거 공백을 함께 둔다. 소스가 말하지 않는 웹 · RN 동등성을 주장하지 않고 quality-lab 측정값을 싣지 않는다.
  흐름 화면은 요약, 근거(소스 · 명령 · 테스트 · 문서 · 공백)는 단계 상세 정보에 둔다.
- **문서는 build 시점에 묶고, HTML 을 주입하지 않는다.** 원문은 `import.meta.glob(?raw)` 로 문서마다 따로 묶여
  연 문서만 받는다 — 브라우저는 파일 시스템을 읽지 않는다. Markdown 은 저장소 문서가 실제로 쓰는 부분만
  (`lib/markdown`) 의존성 없이 해석하고, 모든 글은 React 텍스트 노드다. 외부 이미지는 불러오지 않고 대체 글만 둔다.
  링크는 `http(s)` · `mailto` 만 새 창으로 열고 다른 scheme 은 링크가 되지 않는다.
- **깨진 문서 링크는 숨기지 않는다.** 대상이 없는 링크는 `DocumentRef.brokenLinks` 에 적고 화면에 이유와 함께 보인다.
  테스트가 모든 문서 · 기록의 링크(경로 · 앵커 · 디렉터리 `/`)를 디스크와 대조하고, 기록과 실제가 정확히 같아야 한다.
- **명령은 보여 주기만 한다.** 엔지니어링 화면은 루트 script 전부와 project.json 의 명시 Nx target 을 묶음별로
  보인다(`nx-release-publish` 처럼 사람이 부르지 않는 target 은 `unlistedTargets` 에 이유와 함께). 실행 조건 ·
  비용(`ConstraintRef`)은 근거 파일과 함께 늘 보이고, 성공 색 · 결과 · 측정값은 없다. 정의(script 본문 · executor)는
  build 시점에 매니페스트에서 읽는다. CI 연결은 `data/workflows.ts` 로, `run` 은 workflow 에 적힌 그대로다.
  quality-lab 의 결과 화면 · metric 을 다시 그리지 않고 그리로 가는 링크만 둔다.
- **검색은 카탈로그에서 유도한다.** 따로 적은 검색 목록 · 퍼지 의존성이 없다. 순위는 정확 → 앞부분 → 이름 단어 →
  설명 단어 → 부분 글자 → 관련 순이고, 같으면 종류 · 길이 · 글자 순이다(`lib/search/rank.ts`, 테스트가 고정한다).
  결과 종류는 글자로 보인다. 모든 결과 주소는 실제 화면과 해시 대상으로 열린다(`app/search-links.spec.tsx`).
  단축키는 macOS ⌘K · 그 밖 Ctrl+K 만 — macOS Ctrl+K · 다른 수정 키 · IME 조합 중 입력은 건드리지 않는다.
- **스냅샷은 build 환경의 사실이다.** `vite.config.mts` 가 `lib/repository/snapshot.ts`(Node 전용, 셸 없는 git)로 읽어
  `define` 으로 넣는다. 못 읽으면 `unavailable` 과 `null` — 커밋 · 브랜치를 추측하지 않는다.
- **이 컴퓨터의 경로는 개발 서버에만 있다.** "에디터에서 열기"(`lib/repository/editor-link.ts`)는 `vite.config.mts` 가
  `serve` 일 때만 넣는 저장소 루트로 만든다. build · test 에서는 `null` 이라 링크가 아예 없다.

## 기록 (`docs/records/`)

- 저장소에서 있었던 **설계 결정 · 문제 해결 · 구현**을 한 건에 하나씩 남긴다. 기록은 "언제 · 무엇을 · 왜"이고,
  "지금 무엇이 맞는지"는 AGENTS · README 같은 설계 문서가 말한다.
- 파일은 `docs/records/<YYYY-MM-DD>-<id>.md`, 첫 줄은 `# 제목` 하나. `src/data/records.ts` 에 등록하지 않으면
  `docs/` 전수 확인이 실패한다. 본문은 네 절 — `상황`(문제 해결이면 `증상`) · `판단`(또는 `원인`) · `반영` · `검증`.
  `catalog.spec.ts` 가 파일 이름 · 날짜 · 절 제목 · 인용한 문서 · 테스트를 대조한다.
- 문체는 개조식 · 명사형이다. 커밋 · 파일에서 확인한 것만 적고, 이유를 모르는 변경은 기록하지 않는다.
- **나중에 고쳐 쓰지 않는다.** 판단이 뒤집히면 새 기록을 쓰고 이전 기록에서 링크한다. 기록끼리의 링크는 앱 안
  (`/records/<id>`)에서 열린다.

## 파일

```
index.html                 첫 paint 전 테마 스크립트 (키는 lib/browser/theme.ts 와 같다)
src/
  styles.css               Tailwind entry — devhub-ui 의 styles.css(typo-* · devhub-code · body · :focus-visible)를 @import 하고 dist 를 @source
  app/                     route 조립만. 화면 하나에 파일 하나
    app.tsx                이동 뒤 포커스 자리 · 건너뛰기 링크 둘(셸 밖) · route
    router.tsx             route 표. 셸은 레이아웃 route, page 가 <main> 과 <aside> 를 그린다
    overview-page · section-page · application-page · package-page · tool-page(EntityDetail 공통)
    document-page · record-page · journey-page · architecture-page · source-page · not-found-page
    *.spec.tsx             화면 계약: route · 셸 · 검색 · 상세 정보 · 문서 · 기록 · 흐름 · semantics(h1 하나 · #대상 포커스)
  components/
    shell/                 router-adapter(DevHubProvider ← react-router) · devhub-shell(카탈로그 → devhub-ui 셸 조립) · global-search(색인 → devhub-ui 검색)
    entity/                inspector-panel(섹션 10개) · inspector-parts(명령 · 테스트 · 소스 · 문서 줄) · entity-detail · entity-not-found
                           · section-summary · record-list · record-inspector
    source/                file-row(링크 정책) · editor-link(dev 전용)
    overview/              repository-overview · snapshot-block · snapshot-summary
    doc/                   doc-link(문서 · 기록 · 소스 · 외부 · 깨진 링크) · document-body(use() 로 원문 → devhub-ui DocContent) · document-inspector
    architecture/          architecture-map · architecture-outline · filter-bar · node-inspector · relation-lists · presentation
    flow/                  flow-canvas · journey-outline · step-inspector · presentation
    engineering/           command-card · command-group-section · workflow-section · engineering-overview
    ui/                    view-icons(보기 · 섹션마다 아이콘 하나) · entity-link
                           (셸 · 그림 · markdown · 검색 · 테마 · 아이콘 · pager · record-meta 는 @berrypjh/devhub-ui)
  domain/
    model.ts               카탈로그 타입 (React · URL · 줄 번호 없음)
    graph.ts               위 · 아래 관계와 테스트를 카탈로그에서 유도
    commands.ts            명령 한 줄 표기
  lib/
    catalog/               entities(보기 · 섹션 · 항목 — 탐색의 단일 출처) · labels(어휘 → 글자) · routes(화면 주소 · 앵커)
                           · inspection · reference-groups · architecture(그림 모델) · architecture-layout · -filters · -checks
                           · flow(흐름 그림 모델) · inspect-step · command-definition · command-related · document-citations
    markdown/              documents(불러오기 · ReadableDoc) · doc-links(링크 해석) · sources(원문 묶음) — 파서 · 목차는 devhub-ui
    repository/            snapshot(Node 전용 git) · current-snapshot(define 값) · source-links(커밋 고정) · source-usage
                           · editor-link
    search/                entries(카탈로그 → 항목 · 종류 순서) · view(종류 글자 · 제안 한 줄) — 순위 · 단축키는 devhub-ui
  data/
    index.ts               catalog = repository · applications · packages · tools · relations · documents · records ·
                           commands · commandGroups · workflows · tests · contexts · journeys
    catalog.spec.ts        무결성: ID · 참조 · 경로 · 매니페스트 일치(peerDependencies 포함) · 누락 · 문서 제목 · 기록 · 화면 경계
    records.ts             기록 — docs/records 파일마다 하나
    commands.ts            명령 · 조건 근거 · 넣지 않은 target   command-groups.ts  묶음   workflows.ts  CI
    journeys/              실행 위치(contexts) · 흐름 하나에 파일 하나 · journeys.spec.ts(참조 · 경로 · 상태 규칙 · 도달성 · 웹/RN 포함)
```

import 는 `app` · `components` 에서 `data` · `domain` · `lib`(그리고 app → components)를 `@/` 로, 같은 층 안에서는
상대 경로로 쓴다. `lib` · `data` · `domain` 은 상대 경로만 쓴다.

앱 · 패키지 · 도구를 더하거나 매니페스트의 의존 · exports 를 바꾸면 `catalog.spec.ts` 가 실패한다. 데이터를 먼저 고친다.

## 검증

저장소 root 에서 실행한다.

```bash
pnpm nx typecheck @berrypjh/devhub   # tsc app + spec (react-ui 를 먼저 build 한다)
pnpm nx lint @berrypjh/devhub
pnpm nx test @berrypjh/devhub
pnpm nx build @berrypjh/devhub
pnpm devhub                          # http://localhost:4400
```

실제 브라우저(셸 키보드 · 반응형 · 검색 · 딥링크 · dialog 포커스 · 기록)는 `apps/devhub-e2e` 가 본다.
jsdom 쪽의 구조 계약(h1 하나 · `aria-controls` · `#` 대상이 포커스를 받음)은 `app/semantics.spec.tsx` 다.

dev 서버 · e2e 는 AI 세션에서 포트 바인딩이 막혀 실행할 수 없다. 화면 확인은 사용자에게 요청한다.

## Gotcha

- **`@/` 는 이 앱의 `src/` 뿐이다.** `tsconfig.app.json` · `tsconfig.spec.json` 의 `paths` 와 `vite.config.mts` 의
  `resolve.alias` 가 같은 한 줄이다. root source alias(`nxViteTsPaths`)를 넣으면 `@berrypjh/react-ui` 가
  `libs/react-ui/src` 로 되돌아간다.
- **`^build` 가 먼저다.** 앱은 react-ui · devhub-ui 의 `dist` 를 읽는다. devhub-ui 를 고치면 다시 build 해야 앱에 보인다.
- **`styles.css` 의 `@import` 는 맨 앞이다.** `@config` 뒤에 둔 `@import '@berrypjh/devhub-ui/styles.css'` 를 postcss-import 가
  조용히 버려 typo-\* 유틸이 통째로 빠졌다. 라이브러리 클래스는 `@source` 로 dist 를 훑어야 생성된다 — 둘 다 빌드된 CSS 에서
  `.typo-body-small` · `.lg\:grid-cols-\[15rem` 로 확인한다.
- **build 는 NODE_ENV 를 production 으로 못 박는다 — target env 로만.** 같은 Nx 호출에서 ui-core 를 먼저 빌드하면
  이 `vite build` 가 dev 번들(jsxDEV · 이 컴퓨터의 파일 경로)을 냈다. `project.json` build 의 `options.env` 가 값을 고정한다.
  `vite.config.mts` 에서 `process.env` 를 바꾸지 않는다 — Nx 는 그래프를 만들 때 이 파일을 build 로 불러 읽어, 바꾼 값이
  Nx 프로세스에 남고 같은 프로세스의 vitest 가 production React(`React.act is not a function`)를 받았다.
  재현: `nx run-many -t build -p @berrypjh/ui-core @berrypjh/devhub --skip-nx-cache` 뒤 `dist/assets` 에서 `/Users/` 검색.
- **jsdom 은 CSS 를 모른다.** 서랍의 열림은 `data-state` 로 확인한다(`invisible` · `-translate-x-full` 는
  `max-lg:data-[state=closed]:` 에 걸린다). banner 는 `main` 밖 `<header>` 로 센다 — dom-testing-library 는
  `main` 안 `<header>` 도 banner 로 본다(aria-query 의 "scoped to" 제약을 쓰지 않음).
- **test · build 캐시는 저장소 전체를 입력으로 본다.** 카탈로그 테스트는 프로젝트 밖(매니페스트 · 문서 · tools)을
  읽고, build 는 문서 원문과 git 스냅샷을 싣는다. 그래서 둘 다 `{workspaceRoot}/**/*` 를 입력으로 두고, build 는
  runtime input(`git rev-parse HEAD` · `git status --porcelain`)도 둔다. 빼면 Nx 가 낡은 통과 · 낡은 번들을
  `[local cache]` 로 재생한다(재현: 프로젝트 밖에 깨진 파일을 두면 vitest 는 실패하는데 `nx test` 는 통과했다).
- **아키텍처 선은 관계 하나에 하나다.** 추측한 선을 더하지 않고, 같은 두 노드 사이의 다른 종류 관계를 합치지 않는다.
  자리(`lib/catalog/architecture-layout.ts`)를 바꾸면 `layoutProblems`(선이 잇지 않는 상자를 지남 · 라벨 겹침)가 비어야 한다.
- **`#id` 로 오는 자리는 포커스를 받을 수 있어야 한다.** 작업 영역 · 상세 정보 섹션 · 명령 카드 · 테스트 묶음 ·
  workflow · symbol 은 `tabIndex={-1}` 이다. 빠지면 스크롤만 되고 포커스가 남는다(검색 테스트가 잡는다).
- **그림 화면 안의 이동은 포커스를 옮기지 않는다.** `use-route-focus` 의 `CANVAS_VIEWS` — 노드 · 단계를 골라도 누른 링크에 남는다.
  흐름은 흐름 하나가 한 화면이다: 다른 흐름으로 가면 맨 위로 돌아간다.
- **glob 은 importer 기준 상대 경로다.** `lib/markdown/sources.ts` · `lib/catalog/command-definition.ts` 의 패턴과
  `HERE` 상수는 그 파일의 깊이에 묶여 있다. 파일을 옮기면 둘 다 고친다. 제외 패턴 `!**/CLAUDE.md` 도 저장소 루트부터
  쓴다 — 폴더 아래만 뜻하게 쓰면 build 가 CLAUDE.md 를 묶는다. vitest 는 같은 패턴에서 결과가 달라(묶지 않음)
  단위 테스트로 잡히지 않는다 — 패턴을 바꾸면 `dist/assets` 를 확인한다.
- **문서 · 기록 화면 테스트는 `await act` 로 렌더한다.** 본문이 `use()` 로 원문을 기다리는데, React 19 는 동기 `act` 안에서
  멈춘 컴포넌트를 다시 그리지 않는다("suspended inside an `act` scope" 경고).
- **포커스 규칙은 characterization test 가 고정한다**(`router.spec.tsx`). 이동 뒤 다음 Tab 은 "본문으로 건너뛰기"다.
- **`VITE_DEVHUB_EDITOR`** 는 `.env` 에 두는 에디터 이름(antigravity · cursor · vscode · windsurf · zed · idea · webstorm)
  또는 `{path}` 를 품은 주소 형식이다. 없으면 vscode. 개발 서버에서만 읽힌다.
- 의존성을 바꾸면 lockfile 이 바뀐다. `pnpm install` 은 확인을 받는 명령이다(`.claude/settings.json`).
