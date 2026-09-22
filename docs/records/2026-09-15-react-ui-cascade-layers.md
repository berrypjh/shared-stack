# react-ui 컴포넌트 스타일을 @layer components 에 두어 소비자 className 이 이기게 함

컴포넌트 SCSS 를 `@layer components` 안에 두고, Tailwind v4 와 같은 레이어 순서를 `styles.scss` 가 먼저 선언. 소비자가 넘기는 Tailwind 유틸리티 `className` 이 특정도와 무관하게 컴포넌트 규칙을 이김.

## 상황

- `<List className="pl-3">` 처럼 소비자가 Tailwind 유틸을 넘겨도 컴포넌트 SCSS 가 그대로 남음
- Tailwind v4 는 유틸리티를 `@layer utilities` 에 둠. CSS cascade 에서 **레이어 밖 선언은 특정도와 무관하게 레이어 안 선언을 이김** — 레이어 없이 배포한 컴포넌트 규칙이 늘 이겨서 소비자 `className` 이 조용히 무시됨
- 컴포넌트 SCSS 는 `styles.ts` 가 파일마다 `import` 로 나열해 로드 순서만 관리하던 상태. 레이어에 넣으려면 SCSS 안에서 묶어야 함

## 판단

- **컴포넌트 규칙은 `components` 레이어** — 소비자 유틸(`utilities`)이 이기고, preflight(`base`)는 컴포넌트를 덮지 않음
- **레이어 순서는 라이브러리가 먼저 선언** — `@layer theme, base, components, utilities;` 를 `styles.scss` 맨 앞에 둠. 소비자가 `styles.css` 를 Tailwind 보다 먼저 불러도 순서가 같음
- **토큰은 `theme` 레이어** — `build-js` 가 ui-core 토큰 CSS 를 `@layer theme { … }` 으로 감싸 앞에 붙이고, 그 뒤로 밀려 무효가 된 `@charset` 을 지움
- **SCSS 로드는 `styles.scss` 가 소유** — `meta.load-css` 로 `@layer components` 블록 안에 나열. 공유 base(`button-base` · `input-base`)가 먼저, 나머지는 알파벳 순. `styles.ts` 는 side-effect 진입점만 남김
- **`VisuallyHidden` 의 `'use client'` 제거** — hook 없는 컴포넌트라 서버에서 그대로 실행 가능

## 반영

- `libs/react-ui/src/styles.scss` — 레이어 순서 선언과 `@layer components` 안의 `meta.load-css` 목록
- `libs/react-ui/src/styles.ts` — `import './styles.scss'` 하나
- `libs/react-ui/project.json` `build-js` — 토큰을 `@layer theme` 으로 감싸고 `@charset` 제거
- `libs/react-ui/AGENTS.consumer.md` "스타일 덮어쓰기 (cascade layer)" — 소비자 규칙과 Chip 색 CSS 변수 확장점
- `libs/react-ui/AGENTS.md` Gotcha 와 변경 체크리스트 — 새 컴포넌트 규칙이 레이어 안에 드는지

## 검증

- `dist/index.css` 첫 줄이 `@layer theme, base, components, utilities;` 인지 확인. 레이어 순서를 검사하는 자동 테스트는 없음
- 소비자 `className` 이 실제로 이기는지는 `demo-web` 에서 눈으로 확인 — 그 앱이 Tailwind preset 과 CSS cascade 를 확인하는 자리
- 이 결정 다음 날 rollup 업그레이드로 CSS 가 아예 나오지 않는 문제가 생겨 [별도 스크립트로 분리](2026-09-16-react-ui-css-build-script.md)
