# react-native-ui build 를 rollup · dts-bundle-generator 단계로 명시

`project.json` 에 `build` · `bundle-js` · `build-types` 를 적어 rollup 번들과 타입 번들을 나눔. 그 전에는 `rollup.config.cjs` 만 있었음.

## 상황

처음 react-native-ui 의 build 는 `rollup.config.cjs`(`withNx`) 하나뿐이었고, `project.json` 에는 릴리스 설정만 있었음. ui-core 를 번들 안에 넣어 감추고 소비자용 `AGENTS.md` · `tokens.json` 을 함께 내려면 번들 · 타입 · 파일 복사를 단계로 나눠 적어야 했음.

컴파일러는 그 전에 이미 babel 에서 swc 로 바뀐 상태. `package.json` 에 `"type": "module"` 이 들어가며 rollup 의 babel 이 CJS 로 쓰인 `.babelrc.js` 를 읽다 `ReferenceError: module is not defined in ES module scope` 로 build 가 실패함. 설정 파일을 `.cjs` 로 바꾸면 babel 을 그대로 쓸 수 있었지만, babel 을 걷고 swc 로 옮김.

## 판단

| 판단                                                  | 이유                                                             |
| ----------------------------------------------------- | ---------------------------------------------------------------- |
| **컴파일러는 swc**                                    | babel 과 그 설정 파일 없이 rollup 하나로 번들                    |
| **ui-core · design-tokens 는 번들 안에**              | 소비자에게 ui-core 를 감춤(캡슐화)                               |
| **선언은 dts-bundle-generator 로 한 파일**            | 번들 뒤 남는 loose `d.ts` 대신 `index.d.ts` 하나                 |
| **묶은 선언을 tsc 로 다시 검사**                      | `--no-check` 로 만든 선언의 타입 오류를 게시 전에 잡음           |
| **소비자용 `AGENTS.md` · `tokens.json` 을 `dist` 에** | AI · 소비자가 설치된 패키지 안에서 사용 규칙과 토큰을 읽음       |
| **카탈로그 · 조회 CLI 도 `dist` 에**                  | 심볼 목록은 카탈로그를 정답으로 두고 `./catalog` · bin 으로 조회 |

**ui-core 는 번들 안으로, 선언은 한 파일로 — 소비자는 react-native-ui 하나만 봄.**

## 반영

`project.json` 의 `build` 아래 `bundle-js` · `build-types` 와 뒤이은 단계로 명시.

- **JS 번들**(`bundle-js`) — `rollup -c` 로 `rollup.config.cjs`(`compiler: 'swc'`)를 부름. external 에서 ui-core · design-tokens 를 빼고 `package.json` 의존을 devDependencies 로
- **타입** — `build` 가 loose `d.ts` 를 지운 뒤 `build-types` 가 dts-bundle-generator 로 `index.d.ts` 생성. RN 0.85 대응 때 그 뒤에 `tsconfig.dist.json`(`skipLibCheck: false`) 검사 단계 추가
- **소비자에게 내는 것** — `AGENTS.md` · `tokens.json` 복사. 이후 카탈로그(`llm-catalog.json`) 생성과 조회 CLI(`cli.mjs`, esbuild) 번들, `./catalog` · `./tokens` · `./agents` exports 와 `berry-react-native-ui` bin

## 참고자료

- [DTS Bundle Generator](https://github.com/timocov/dts-bundle-generator) — timocov. TS 코드에서 `.d.ts` 한 파일을 만듦. `--no-check` 는 생성한 `.d.ts` 검사를 건너뜀
