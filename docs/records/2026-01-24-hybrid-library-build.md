# ui-core 는 Vite, react-ui 는 Rollup + tsc — 패키지 성격에 맞춘 build 도구

publishable 라이브러리의 build 도구를 하나로 통일하지 않음. 단순한 ui-core 는 Vite library mode, React · 에셋 · 외부화 · 타입이 복잡한 react-ui 는 Rollup(JS)과 tsc(`.d.ts`)로 나눔. 이후 두 패키지의 build 는 각자 단계가 붙으며 자람.

## 상황

- Nx 모노레포에서 `@berrypjh/ui-core` · `@berrypjh/react-ui` 를 publishable 라이브러리로 운영함
- ui-core 는 react-ui · react-native-ui 가 함께 쓰는 계약 · 토큰 facade. react-ui 는 npm 에 배포되는 웹 UI 라이브러리라 JS · 타입 · CSS · 소비자 문서를 모두 `dist` 에 실어야 함
- 기준은 개발 편의가 아니라 배포 계약(`package.json` 의 `exports` · `types` · `main` 과 `dist` 산출물)의 정합성, 그리고 CI · 캐시 · 의존성 경계의 장기 안정성

## 판단

네 가지를 견주어 C 를 채택.

| 방식                                       | 얻는 것                                          | 잃는 것                                                                                                                  |
| ------------------------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| A. 전부 Vite library mode                  | 설정이 단순하고 빠름. Nx Vite 플러그인과 잘 붙음 | React UI 패키지의 external · 에셋(SVG · url) · 타입 생성을 배포 수준으로 맞추려면 설계가 더 필요. 플러그인 타입은 흔들림 |
| B. 전부 Rollup + tsc                       | external · 에셋 · 출력 파일명 제어가 분명함      | core 같은 단순 패키지에는 설정 · 운영 비용이 과함                                                                        |
| **C. core 는 Vite, react 는 Rollup + tsc** | 패키지 성격에 맞춘 비용 최적화                   | 툴체인 두 벌을 운영해 문서 · 규칙이 필요함                                                                               |
| D. tsc 만, 번들은 소비자에게               | 가장 단순함                                      | 소비자 번들러 · 설정 의존이 커지고 ESM · 조건부 exports · 에셋 호환 문제가 늘어남                                        |

JS 와 타입은 성격이 다름. JS 번들은 트리셰이킹 · external · 코드 분할 · 에셋 · CSS 로 번들러의 영역이고, `.d.ts` 는 프로젝트 레퍼런스 · `paths` · 제네릭 · `export type` 재노출로 타입 검사기의 영역. 번들러 플러그인이 만든 타입은 일부 빠지거나 재노출 타입이 깨지거나 모노레포 references 에서 흔들리기 쉬움.

- **react-ui 를 Rollup + tsc 로**
  - **외부화 · 중복 방지** — `react` · `react-dom` · `react/jsx-runtime` 을 반드시 external · peer 로. 삐끗하면 React 가 두 번 깔리거나 번들에 들어감. Rollup 은 이 제어가 분명함
  - **에셋 플러그인** — `rollup.config.cjs` 의 `@svgr/rollup`(SVG → React 컴포넌트)과 `@rollup/plugin-url`. Vite 에서도 되지만 배포 산출물 기준으로는 Rollup 조합이 제어하기 쉬움
  - **타입은 tsc** — props 재노출 · 제네릭 · 오버로드 · `forwardRef` · `ComponentPropsWithoutRef` 가 엮여 플러그인 기반 `.d.ts` 는 깨지기 쉬움. tsc 는 결과가 예측 가능하고 `noEmitOnError` 로 실패를 바로 드러냄
- **ui-core 를 Vite 로** — 타입 · 레시피 · 토큰 중심이라 런타임 의존 · 에셋 · CSS · JSX 변환이 없고, 단일 ESM 진입점과 `.d.ts` 면 충분함. `vite-plugin-dts` 로 타입까지 한 설정 파일에서 끝남. 타입은 장기적으로 tsc 가 더 안정적일 때가 많지만 구조가 단순한 동안은 플러그인으로 운영 가능

**통일하지 않음.** core 까지 Rollup + tsc 면 단순 패키지에 과투자, react-ui 까지 Vite 면 external · 에셋 · 타입을 더 면밀히 다뤄야 하고 SVGR · url 설정을 옮기는 비용이 생김.

## 반영

- 2026-01-24 `8f7e235` — react-ui `build` 를 `build-js`(`@nx/rollup:rollup`, `external: [react, react-dom, react/jsx-runtime, @berrypjh/ui-core]`)와 `build-types`(`tsc -b tsconfig.lib.json`)로. `typecheck` 도 `project.json` 에 명시
- 같은 날 `be8161e` — ui-core `build` 를 `@nx/vite:build` 로
- 함께 정한 공통 정책과 지금 상태

| 정책                                                                                    | 지금 상태                                                                                                                         |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 배포 패키지는 `dist` 만 가리킴                                                          | 유지                                                                                                                              |
| `react` · `react-dom` 은 peer + external                                                | 유지 — react-ui `peerDependencies` 와 rollup `external`                                                                           |
| react-ui 는 ui-core 를 다시 번들하지 않고 `dependencies` 로 둠                          | 뒤집힘 — 2026-05-08 `dd59843` 에서 ui-core 를 번들 안에 넣고 devDependency 로([기록](2026-04-22-design-tokens-behind-ui-core.md)) |
| dev 도구는 라이브러리 runtime 의존에 두지 않음, 설정 파일은 dependency-checks 에서 제외 | ui-core `eslint.config.mjs` 의 `ignoredFiles` 에 vite · vitest · eslint 설정(첫 커밋부터)                                         |
| `namedInputs.default` 에서 `dist` · `out-tsc` · `test-output` · `coverage` 제외         | git 이력에서 찾지 못함. 지금 `default` 는 `{projectRoot}/**/*` · `sharedGlobals`                                                  |
| 중요 패키지는 build · typecheck 를 `project.json` 에 명시                               | 유지 — react-ui 는 build 단계를 모두 명시([기록](2026-01-24-nx-inferred-target-conflict.md))                                      |

### 이후 ui-core build

- 2026-04-25 `f20a50b` — build 를 `nx:run-commands` 로 감싸 Vite 빌드를 `build-js` 로 떼고, design-tokens `variables.css` 를 `dist/css/index.css` 로 복사. `./css` export 추가. 값의 출처가 design-tokens 하나라 CSS 는 만들지 않고 복사
- 2026-05-07 `e7ca0e3` — `vite-plugin-dts` 에 `rollupTypes` · `bundledPackages: ['@berrypjh/design-tokens']` 로 타입을 한 파일로 묶고 design-tokens 타입을 안에 넣음. `dist/tokens.json` 복사는 커밋이 "소비자 캡슐화 유지"로 설명함. 타입을 묶은 이유는 따로 적혀 있지 않음
- 2026-05-17 `3b608af` — private 이라 외부 소비자가 없어 `dist/AGENTS.md` 복사 단계 제거
- 2026-09-16 `2d6a336` — Vite 8 에 맞춰 `rollupOptions` 를 `rolldownOptions` 로

### 이후 react-ui build

- 2026-04-25 `d37b727` — design-tokens 직접 의존을 없애고 토큰 CSS 를 ui-core `dist/css/index.css` 에서 가져옴
- 2026-05-08 `dd59843` — 컴파일러를 babel 에서 swc 로. ui-core 를 rollup external 에서 빼 번들 안에 넣어 소비자에게 감춤. 타입은 `tsc -b` 대신 dts-bundle-generator(`--no-check`)로 한 파일 — 바꾼 이유는 커밋에 적혀 있지 않음. `AGENTS.md` · `tokens.json` · `tailwind` 복사
- 2026-09-04 `ef6c698` — `generate-catalog` · `build-cli`(esbuild) 단계 추가. 소비자가 경로를 하드코딩하지 않고 `./catalog` · `./tokens` · `./agents` 와 bin 으로 조회하게 함
- 2026-09-15 `441ff28` — `preserveModules` 와 `'use client'` banner. rollup 이 지우는 디렉티브를 그 모듈이 든 청크에만 되돌리기 위해 모듈당 한 파일([기록](2026-09-15-use-client-directive-in-dist.md))
- 2026-09-16 `07b90c1` — CSS 를 `tools/scripts/build-react-ui-css.mjs` 로. `@nx/rollup` 23 의 postcss 플러그인이 side-effect import 인 `styles.scss` 를 번들에서 뺌([기록](2026-09-16-react-ui-css-build-script.md)). 토큰 CSS 를 `@layer theme` 으로 앞에 붙이는 것은 [cascade layer 결정](2026-09-15-react-ui-cascade-layers.md)

## 참고자료

- [Library Mode](https://vite.dev/guide/build#library-mode) — Vite. `build.lib` 로 라이브러리를 배포용으로 번들하고, `react` 같은 의존성은 external 로 뺌
- [Migration from v7](https://vite.dev/guide/migration) — Vite. `build.rollupOptions` 가 `build.rolldownOptions` 로 이름이 바뀌고 이전 이름은 deprecated
- [Rollup.js](https://react-svgr.com/docs/rollup/) — SVGR. `@svgr/rollup` 은 SVG 를 React 컴포넌트로 import 하게 하는 공식 rollup 플러그인
- [@rollup/plugin-url](https://github.com/rollup/plugins/tree/master/packages/url) — rollup/plugins. `limit` 보다 작은 파일은 base64 data URI 로 인라인, 큰 파일은 해시 이름으로 복사
- [DTS Bundle Generator](https://github.com/timocov/dts-bundle-generator) — timocov. TS 코드에서 `.d.ts` 한 파일을 만듦. `--no-check` 는 생성한 `.d.ts` 검사를 건너뜀
