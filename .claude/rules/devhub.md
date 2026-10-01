---
paths:
  - 'apps/devhub/**'
---

# devhub (`apps/devhub`)

Vite + React. shared-stack의 구조와 근거(패키지 · 앱 · 도구 · 문서 · 기록 · 플러그인)를 탐색하는 개인용 앱이다. 저장소 사실은 `src/data`의 카탈로그가 갖고, 화면 부품은 `@berrypjh/devhub-ui`가 갖는다. "평가"(`/evaluation`)는 품질 수집기가 `public/observability`에 export한 JSON을 `@berrypjh/observability-contracts`로 검증해 보인다 — 수집 체계는 `docs/observability/`.

같은 모양의 DevHub가 snapdone(Next)에도 있다. **폴더 · 파일 이름 · 화면 어휘를 그쪽과 같게 유지한다.** 두 앱을 오가며 같은 부품을 찾게 하기 위해서다.

## 규칙

### 사실

- **사실을 만들지 않는다.** mock · 예시 값을 두지 않고, 값이 없으면 0이 아니라 없다는 것과 이유를 쓴다
- **저장소 경로 · 이름 · 관계는 `src/data`에만 둔다.** 화면은 `catalog`를 읽기만 한다. 줄 번호 · 개수 · 크기는 싣지 않는다 — 금방 어긋난다
- **상태 어휘는 각자의 타입에 둔다.** `Visibility` · `ArtifactOrigin` · `EvidenceGap.kind` · `StepStatus`를 한 필드에 섞지 않고 기본값을 두지 않는다
- **흐름 단계는 저장소가 증명하는 만큼만 표시한다.** 소스가 없으면 `implemented`가 아니다
- **스냅샷(커밋 · 브랜치)은 build 때 읽는다.** 못 읽으면 `unavailable`과 `null`이고 추측하지 않는다

### 화면과 패키지

- **DevHub 작업마다 라이브러리화를 판단한다.** 카탈로그 · 경로 · 이 저장소 어휘를 몰라도 그려지는 부품은 devhub-ui에 만든다. 앱에는 조립(`components/shell/devhub-shell.tsx`)과 저장소 사실에 묶인 화면만 남긴다
- **devhub-ui 공개 API는 더하는 방향으로만 넓힌다.** npm에 배포되는 패키지라 선택 prop · 필드로 늘린다
- **URL이 선택의 정본이다.** 보기 · 탐색기 · 서랍은 `lib/catalog/entities.ts` 한 곳에서 읽는다
- **화면 사이 이동은 탐색기만 한다.** 상단 바는 제품명 · 요약 · 검색 · 테마뿐이다
- **문서 묶음은 독자(에이전트 · 소비자 · 개발)로 먼저 가르고 주제로 한 번 더 가른다.** 표는 `lib/catalog/labels.ts`의 `DOCUMENT_GROUP`이고, 맞는 접두사 중 가장 긴 것을 쓴다. 새 문서 폴더를 만들면 독자를 정해 여기에 더한다
- **앱 · 도구는 자기 화면이 없다.** 아키텍처 노드(`/architecture/<id>`)로 간다
- **skill 호출 조건은 원문 `whenToUse` 대신 번역 `whenToUseKo`를 보인다**
- **import는 층을 따른다.** `app` · `components`에서 `data` · `domain` · `lib`는 `@/`로, 같은 층 안과 `lib` · `data` · `domain`은 상대 경로로 쓴다
- **앱 · 패키지 · 도구 · 문서를 더하거나 매니페스트를 바꾸면 카탈로그를 먼저 고친다.** `catalog.spec.ts`가 디스크와 대조해 실패한다

### 링크와 문서

- **브라우저는 명령을 실행하지 않고 파일 시스템을 읽지 않는다.** 문서 원문은 build 때 `import.meta.glob(?raw)`로 묶는다
- **HTML을 주입하지 않는다.** markdown은 의존성 없이 해석하고 모든 글은 React 텍스트 노드다
- **깨진 문서 링크는 숨기지 않는다.** `DocumentRef.brokenLinks`에 이유와 함께 적는다
- **"에디터에서 열기"는 개발 서버에서만 생긴다.** 이 컴퓨터의 경로가 build에 새지 않게 하기 위해서다

### 검색 · 평가

- **명령 · CI 카탈로그를 두지 않는다.** 매니페스트와 `.github/workflows`가 정본이라 옮겨 적으면 어긋난다
- **검색 항목은 카탈로그에서 유도한다.** 항목은 `lib/search/entries.ts`, 순위는 devhub-ui `search/rank.ts`다
- **평가 항목 목록은 `data/evaluations.ts`가 정본이다.** 화면은 `components/evaluation/measures`의 `MEASURES`가 항목마다 하나씩 갖는다. 번들 · 컨텍스트 · 소비자 평가처럼 이 저장소만 재는 것만 싣는다. CI · 테스트가 이미 알려 주는 것(test · lint · build · 접근성 · 토큰 대비)은 싣지 않는다
- **비교는 사람이 고른 실행과의 report-only diff뿐이다.** 최신 실행을 자동 baseline으로 삼지 않고, 합산 점수 같은 새 파생값을 만들지 않는다
- **배포본에는 평가가 없다.** 평가 데이터(`public/observability`)는 커밋되지 않아서, Vercel build(`apps/devhub/vercel.json`)는 `DEVHUB_EVALUATION=off`로 섹션 · route · 단계의 평가 링크를 함께 뺀다. 평가로 가는 새 링크는 `SECTIONS`나 `__DEVHUB_EVALUATION__`을 거친다
- **명령 버튼은 복사만 한다.** 수집 · export는 Node가 한다. 화면은 평가 묶음의 한 줄 명령(`pnpm quality:core` · `quality:eval`)만 보인다

## 구조

- `src/data` — 카탈로그(저장소 사실). `catalog.spec.ts`가 디스크 · 매니페스트와 대조한다
- `src/domain` — 카탈로그 타입과 관계 유도
- `src/lib` — 순수 로직. Node 전용은 `lib/repository/snapshot.ts`뿐이다
- `src/app` — 앱 · route 조립(`app.tsx` · `router.tsx`)과 앱 전체를 보는 테스트. `src/app/pages` — 화면 하나에 파일 하나와 그 테스트. `components` — 저장소 사실에 묶인 화면 조각

## 검증

```bash
pnpm nx typecheck @berrypjh/devhub
pnpm nx lint @berrypjh/devhub
pnpm nx test @berrypjh/devhub
pnpm nx build @berrypjh/devhub
```

실제 브라우저 동작은 `apps/devhub-e2e`가 본다.

## Gotcha

- **`@/`는 이 앱의 `src/`뿐이다.** `tsconfig.*.json`의 `paths`와 `vite.config.mts`의 `alias`를 같이 고친다. root source alias(`nxViteTsPaths`)를 넣으면 `@berrypjh/react-ui`가 소스로 되돌아간다
- **`styles.css`의 `@import`는 맨 앞에 둔다.** 뒤에 두면 postcss-import가 조용히 버려 devhub-ui 유틸이 빠진다
- **build의 NODE_ENV는 `project.json` build `options.env`로만 고정한다.** `vite.config.mts`에서 `process.env`를 바꾸면 같은 Nx 프로세스의 vitest가 production React를 받아 깨진다
- **test · build 입력은 저장소 전체(`{workspaceRoot}/**/\*`)다.\*\* 카탈로그 테스트와 build가 프로젝트 밖 파일을 읽기 때문이다. 빼면 Nx가 낡은 통과 · 번들을 캐시에서 재생한다
- **jsdom은 CSS를 모른다.** 서랍 열림은 클래스가 아니라 `data-state`로 확인한다
- **`#id`로 오는 자리는 `tabIndex={-1}`이어야 한다.** 빠지면 스크롤만 되고 포커스가 옮지 않는다
- **그림 화면 안의 이동은 포커스를 옮기지 않는다.** 대상 화면은 `app/app.tsx`의 `CANVAS_VIEWS`이고 `router.spec.tsx`가 포커스 규칙을 고정한다
- **`lib/markdown/sources.ts`의 glob은 그 파일 기준 상대 경로다.** 파일을 옮기면 패턴과 `HERE`를 함께 고친다. 숨김 폴더(`.claude`)는 `exhaustive: true` glob으로만 build에 묶인다
- **문서 · 기록 화면 테스트는 `await act`로 렌더한다.** 본문이 `use()`로 원문을 기다린다
- **`DEVHUB_EDITOR`는 `import.meta.env`로 오지 않는다.** `VITE_` 접두가 없어 `vite.config.mts`가 읽어 `__DEVHUB_EDITOR__`로 넣는다
