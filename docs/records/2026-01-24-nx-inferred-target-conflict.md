# 여러 Nx 플러그인이 같은 build 를 추론하지 않게 target 을 명시

react-ui 한 폴더에 Vite · Rollup · TypeScript 설정이 함께 있어 세 플러그인이 모두 `build` 를 만들 수 있었음. `project.json` 에 `build` 를 적어 고정하고, 쓰지 않는 추론은 플러그인에서 뺌.

## 상황

- Nx 는 `project.json` 에 target 을 다 적지 않아도 플러그인이 특정 파일을 보면 target 을 만듦(inferred target)
  - `vite.config.*` → `@nx/vite/plugin` 이 build · serve · dev · preview
  - `rollup.config.*` → `@nx/rollup/plugin` 이 build
  - `tsconfig.lib.json` → `@nx/js/typescript` 가 build · typecheck
- 첫 커밋의 `nx.json` 에서 세 플러그인이 모두 `buildTargetName: "build"` 였고, react-ui 에는 `vite.config.mts` · `rollup.config.cjs` · `tsconfig.lib.json` 이 모두 있음
- 같은 이름을 여럿이 만들려 하면 어느 것이 최종 `build` 가 되는지가 플러그인 순서 · 파일 매칭 · 버전에 따라 달라지고, 설정이 합쳐지거나 한쪽이 덮어써 의도와 다른 executor 가 돌 수 있음
- 드러나는 증상
  - **산출물이 바뀜** — 어떤 날은 `dist/index.esm.js`, 어떤 날은 `dist/index.js` 만 나오거나 타입 파일이 사라짐
  - **로컬과 CI 가 다름** — 로컬은 Vite build, CI 는 Rollup build 로 보이는 상황
  - **캐시 · affected 가 흔들림** — build 입력 · 출력이 달라져 캐시 hit · miss 가 요동하고 영향 범위 계산이 이상해짐

## 판단

- **`project.json` 에 `build` 를 명시해 고정** — 가장 권장. react-ui 는 늘 Rollup, core 는 늘 Vite 처럼 `nx build` 가 항상 같은 executor 로 돎. 설정을 조금 더 쓰는 비용
- **target 이름을 나누는 방법도 있음** — Vite 는 `build`, TypeScript 는 `typecheck` · `tsc-build`, Rollup 은 `bundle` 처럼 `build` 를 하나만 남김
- build 도구 선택 자체는 [build 도구 결정](2026-01-24-hybrid-library-build.md)

## 참고자료

- [nx.json Reference](https://nx.dev/docs/reference/nx-json) — Nx. 플러그인의 `include` · `exclude` 는 그 플러그인이 해석할 설정 파일을 고르는 glob
