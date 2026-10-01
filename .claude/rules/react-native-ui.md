---
paths:
  - 'libs/react-native-ui/**'
---

# react-native-ui (`libs/react-native-ui`)

`@berrypjh/react-native-ui` 모바일 컴포넌트 라이브러리(React Native). 이 문서는 패키지를 **고치는** 사람의 규칙이다. 소비자 규칙은 `AGENTS.consumer.md`(`dist/AGENTS.md`), 공개 컴포넌트 목록은 `src/components/index.ts`가 원본이다.

## 규칙

- **`components/<name>/index.ts` 배럴은 "공개 컴포넌트" 표시다.** 만드는 순간 공개 API가 되고, 소비자 카탈로그 테스트(`tools/scripts/generate-consumer-catalog`)가 실렸는지 검사한다. 내부 원시(`button-base` · `input-base` · `selection-control`)에는 배럴을 두지 않는다
- **ui-core는 react-native-ui 안에 감춘다.** 필요한 ui-core export는 `src/index.ts`가 다시 내보낸다
- **색은 `useTheme()`의 theme에서 `getColor(theme, 'path')`로 읽는다.** RN에는 CSS 변수가 없어 테마는 context로만 전달된다
- **Button · Input 계열의 공통 동작은 내부 원시에서 고친다.** 누름 · 접근성 · 터치 타깃은 `ButtonBase.tsx`, 편집 · 포커스는 `InputBase.tsx`, input variant 시각은 `InputBase.styles.ts`다
- **`PlainInputProps` · `FilledInputProps` · `BoxedInputProps`는 일부러 중복이다.** 공유 타입으로 묶으면 소비자가 쓰지 않는 공개 심볼이 늘어난다

## 검증

```bash
pnpm nx test @berrypjh/react-native-ui        # jest + RN preset
pnpm nx typecheck @berrypjh/react-native-ui
pnpm nx build @berrypjh/react-native-ui
```

컴포넌트 prop을 바꾸면 `apps/demo-mobile`도 함께 검증한다.

## Gotcha

- **build 성공은 typecheck 성공이 아니다.** `build-types`가 `--no-check`로 돈다
- **테스트는 jsdom이 아니라 jest + RN preset에서 돈다.** `react-native`가 Flow 소스를 배포해 vite로는 파싱되지 않는다
- **build의 cleanup 순서를 유지한다.** bundle 뒤 생기는 loose `dist/src/**/*.d.ts`를 `build-types` 전에 지운다
- **`DEFAULT_TOKENS_BY_MODE`를 `Partial`이나 `Record<string, …>`로 넓히지 않는다.** 테마가 늘면 컴파일이 깨지는 것이 정상이다. 넓히면 빠진 테마에서 `tokens`가 `undefined`가 되어 렌더에서 터진다
