---
paths:
  - 'libs/react-ui/**'
---

# react-ui (`libs/react-ui`)

`@berrypjh/react-ui` 웹 컴포넌트 라이브러리(React + SCSS + Tailwind). 이 문서는 패키지를 **고치는** 사람의 규칙이다. 소비자 규칙은 `AGENTS.consumer.md`(`dist/AGENTS.md`), 공개 export는 `src/index.ts`가 원본이다.

## 규칙

- **ui-core는 react-ui 안에 감춘다.** 필요한 ui-core export는 `src/index.ts`가 다시 내보내고, 소비자에게 ui-core import를 안내하지 않는다
- **web에만 있는 계약과 키는 `src/types/`가 소유한다.** 예: `menu-item`, `FieldProps`의 `required` · `hiddenLabel`, `IconButtonProps`의 `edge`. RN 구현이 생기기 전에 ui-core로 올리지 않는다
- **색 · 간격 · radius는 SCSS에서 `var(--ds-*)`로 쓴다.** 값을 적으면 테마를 따라가지 않는다
- **한 컴포넌트만 쓰는 헬퍼는 그 컴포넌트 폴더에 둔다.** `src/utils`는 여러 컴포넌트가 함께 쓰는 것만 둔다
- **새 컴포넌트는 `components/index.ts`와 `src/styles.scss` 두 곳에 등록한다.** `styles.scss`에는 `@layer components` 안에 `meta.load-css`로 넣는다. 빠지면 CSS가 `dist/index.css`에 없다
- **컴포넌트 CSS는 `@layer components` 안에 둔다.** 레이어 밖 선언은 레이어 안을 이겨서 소비자 Tailwind `className`이 조용히 무시된다
- **prop 패턴을 바꾸면 `test-utils/describeConformance`도 갱신한다**

## 검증

```bash
pnpm nx test @berrypjh/react-ui
pnpm nx typecheck @berrypjh/react-ui   # lib → storybook → spec
pnpm nx build @berrypjh/react-ui
```

컴포넌트 prop을 바꾸면 `apps/demo-web`도 함께 검증한다.

## Gotcha

- **hook · `createContext`를 쓰는 모듈은 첫 줄에 `'use client';`를 둔다.** `rollup.config.cjs`가 그 청크에 다시 붙인다. 빠뜨리면 RSC에서 `createContext only works in Client Components`로 깨진다
- **다운스트림이 쓰는 타입은 `src/index.ts`에서 명시적으로 re-export한다.** dts-bundle-generator는 re-export하지 않은 타입을 dist에 넣지 않는다
- **build 성공은 타입 검사가 아니다.** `build-types`는 `--no-check`이고 Storybook · vitest는 타입을 지운다. 스토리와 `@ts-expect-error` 계약은 `typecheck`에서만 검사된다
- **포커스를 `box-shadow`로 그리면 `@media (forced-colors: active)` outline 대응을 함께 둔다.** 고대비 모드는 `box-shadow`를 지운다. `src/components/forcedColors.test.ts`가 검사한다
- **`ThemeProvider`는 Context가 아니라 `data-theme` 스코프다.** 중첩하면 안쪽이 자기 스코프를 연다
