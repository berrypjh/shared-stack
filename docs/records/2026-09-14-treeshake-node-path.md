# treeshake 측정 entry 가 design-tokens 를 찾지 못하던 문제

저장소 밖 임시 폴더에 둔 측정 entry 를 번들할 때 `@berrypjh/design-tokens` 가 해석되지 않음. 번들 실행 환경에 `NODE_PATH=<cwd>/node_modules` 를 넘겨 해결.

## 증상

- `pnpm treeshake` 가 design-tokens 를 끌어오는 심볼에서 모듈 해석 실패로 멈춤

## 원인

- 측정 entry 는 일부러 저장소 밖(`os.tmpdir()`)에 씀. 저장소 안에 두면 root tsconfig 의 `paths` 가 `@berrypjh/*` 를 `dist` 대신 `src` 로 돌려 소비자와 다른 것을 재게 됨
- 저장소 밖 파일은 pnpm shim 의 `.pnpm/node_modules` 로만 패키지를 찾는데, 거기에는 design-tokens(워크스페이스 패키지)가 없음

## 반영

- `tools/scripts/treeshake/measure.ts` — 번들 실행 `env` 에 `NODE_PATH` 추가
- 같은 파일의 `writeEntry` docstring 에 entry 를 저장소 밖에 두는 이유

## 검증

- `pnpm build:libs` 뒤 `pnpm treeshake` 가 모든 시나리오를 측정
- 이 경로를 검사하는 자동 테스트는 없음. treeshake 는 진단 전용이라 CI 에서 돌지 않음
