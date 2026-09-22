# RSC 서버에서 client 모듈이 평가되지 않도록 dist 에 'use client' 를 보존

rollup 이 지우는 모듈 디렉티브를 `preserveModules` 와 `banner` 로 청크 1행에 되돌림. 서버 컴포넌트에서 그대로 쓰는 모듈(`cx` · `themes` · `Web` · `ThemeProvider` · `VisuallyHidden`)은 디렉티브 없이 둠.

## 증상

- Next.js App Router 의 서버 컴포넌트에서 `@berrypjh/react-ui` 를 import 하면 `createContext only works in Client Components` 로 깨짐
- 소스에는 `'use client'` 가 있지만 dist 에는 없음. rollup 은 모듈 최상단 디렉티브를 지우고 `Module level directives cause errors when bundled` 경고만 냄
- 단일 번들(`index.esm.js`)이라 디렉티브를 붙이면 서버용 모듈까지 전부 client 가 됨

## 판단

- **모듈당 한 파일** — `preserveModules` 로 dist 를 소스 구조 그대로 냄. 디렉티브를 청크 단위로 붙일 수 있고, 서버에서 쓰는 모듈은 디렉티브 없는 파일로 남음
- **디렉티브는 banner 로** — 소스가 `'use client'` 로 시작하는 모듈을 `transform` 에서 기록하고, 그 모듈이 든 청크에만 `banner` 로 1행에 붙임. banner 는 output option 이라 항상 첫 줄
- **Context 파일과 커스텀 hook 도 client** — `FormControlContext` · `useFormControl` · `PopoverContext` · `RadioGroupContext` 에 디렉티브 추가. `createContext` 가 서버에서 평가되는 자리가 이 파일들
- **번들 크기 기준은 모듈 단위로** — 단일 심볼 기준값을 모듈별 실제 값으로 낮추고, full 은 react import 가 모듈마다 남아 커진 만큼 올림

## 반영

- `libs/react-ui/rollup.config.cjs` — `clientDirective()` 의 `plugin` 과 `banner`, output 의 `preserveModules` · `preserveModulesRoot`
- `libs/react-ui/src/components/form-control/FormControlContext.ts` · `useFormControl.ts` · `popover/PopoverContext.ts` · `radio/RadioGroupContext.ts` — `'use client'`
- `.size-limit.cjs` — preserveModules 기준 설명과 기준값
- `libs/react-ui/AGENTS.consumer.md` TL;DR — 서버에서 import 할 수 있는 범위. `libs/react-ui/AGENTS.md` Gotcha — 디렉티브 규칙

## 검증

- `head -1 libs/react-ui/dist/components/button/Button.esm.js` 가 `'use client';`, `dist/utils/cx.esm.js` 는 주석으로 시작
- 저장소 안에 RSC 소비자가 없어 서버 렌더 자체를 확인하는 자동 테스트는 없음. 실제 확인은 Next.js 소비 저장소에서
- `pnpm size` 가 새 기준값으로 통과
