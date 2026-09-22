# devhub 의 vite build 가 같은 Nx 호출 안에서 dev 번들로 나오던 문제

같은 Nx 호출에서 ui-core 를 먼저 빌드하면 devhub 번들에 개발용 JSX(jsxDEV)와 이 컴퓨터의 파일 경로가 실림. build target 의 env 에 `NODE_ENV=production` 을 두어 해결. vite 설정 파일에서 `process.env` 를 바꾸는 첫 수정은 Nx 안의 테스트를 깨뜨려 되돌림.

## 증상

- `nx run-many -t build -p @berrypjh/ui-core @berrypjh/devhub --skip-nx-cache` 뒤 `apps/devhub/dist/assets/index-*.js` 에 `/Users/…/apps/devhub/src/…` 경로가 45곳, `jsxDEV` 가 있음
- `nx run @berrypjh/devhub:build` 단독, `apps/devhub` 에서 `vite build` 직접 실행, devhub-ui 와 함께 빌드한 경우는 모두 0곳
- 앞에 도는 task 가 ui-core 일 때만 재현됨. ui-core 의 `build-js` 는 Nx 프로세스 안에서 도는 `@nx/vite:build` executor 이고, devhub build 는 그 뒤에 `nx:run-commands` 로 `vite build` 를 부름

## 원인

- 번들이 dev 로 나온 것은 `vite build` 가 production 이 아닌 `NODE_ENV` 를 받았기 때문. `@vitejs/plugin-react` 는 그 값으로 JSX 런타임을 고름
- 그 값이 어디서 오는지까지는 확인하지 못함. 관찰로는 같은 Nx 프로세스 안에서 앞서 돈 작업의 환경이 devhub build 로 이어짐
- 첫 수정은 `vite.config.mts` 에서 build 일 때 `process.env.NODE_ENV` 를 production 으로 바꾸는 것이었음. 그러자 `nx test @berrypjh/devhub` 에서 96개가 `React.act is not a function` 으로 실패함. 직접 실행한 vitest 는 통과했음. Nx 는 프로젝트 그래프를 만들 때 이 설정 파일을 build 로 불러 읽음. 그래서 바꾼 값이 Nx 프로세스에 남았고, 같은 프로세스의 vitest 가 production React 를 받은 것으로 봄

## 반영

- `apps/devhub/project.json` build target — `options.env.NODE_ENV = "production"`. 설정 파일은 환경을 바꾸지 않음
- `apps/devhub/AGENTS.md` Gotcha — 재현 명령과, 설정 파일에서 `process.env` 를 바꾸지 말 것

## 검증

- 위 재현 명령 뒤 `/Users/` 경로 0곳, `jsxDEV` 0곳
- `nx run-many -t typecheck lint test build -p @berrypjh/devhub-ui @berrypjh/devhub --skip-nx-cache` 통과. 테스트와 build 를 한 호출에서 돌려도 번들은 production
- 빌드 산출물을 검사하는 자동 테스트는 없음
