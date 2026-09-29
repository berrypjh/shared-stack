# treeshake

> **한 줄 요약** — 라이브러리에서 심볼 몇 개만 import한 가짜 entry를 esbuild로 번들 · minify해, 전체 export 번들보다 얼마나 작아지는지 byte로 보여 주는 진단 도구.

대상 코드: `tools/scripts/treeshake/`

- **진단 전용** — CI 게이트 아님. 비율 임계값으로 실패시키지 않음. 번들 회귀는 `.size-limit.cjs`(`pnpm size`)가 케이스별 절대 한도로 막음
- **빌드 결과 측정** — 패키지 `exports`가 가리키는 `dist`를 번들. 라이브러리 build가 먼저 필요
- **대상 4개** — `design-tokens` · `ui-core` · `react-ui` · `react-native-ui`(`measure.ts`의 `TARGETS`)

## 사용

```bash
pnpm treeshake <target>                      # 전체 export baseline만
pnpm treeshake react-ui Button               # single + baseline
pnpm treeshake react-ui Button TextField     # 심볼별 single + multi + baseline
pnpm treeshake react-ui Button --json        # scenario별 raw · gzip 또는 error를 JSON으로
```

- **human 출력** — 표와 첫 심볼의 절감 비율. single이 baseline의 95%를 넘으면 경고. esbuild 실패 시 종료 코드 1
- **`--json`** — scenario 하나가 실패해도 나머지를 계속 재고, 실패는 그 scenario의 `error`로 남김. 비율 · 임계값은 넣지 않음
- **품질 수집기** — `pnpm quality:collect --profile=core`가 registry의 `bundle.treeshake.react-ui`(`cx` · `Box` · `Stack` · `Button` · `TextField`, `--json`)를 실행해 DevHub "평가"로 보냄(`tools/scripts/observability/registry.ts`)

## 측정 방식

1. scenario마다 가짜 entry 생성 — `import { X } from '<pkg>'; console.log(X);`. `console.log`는 export가 dead code로 지워지지 않게 붙잡는 anchor
2. baseline entry는 `export * from '<pkg>'`
3. `pnpm exec esbuild --bundle --minify --format=esm --tree-shaking=true --platform=neutral`로 번들. React · React Native는 `--external`
4. stdout을 raw byte(`Buffer.byteLength`)와 gzip byte(`zlib.gzipSync`)로 측정

- **entry 위치** — OS 임시 폴더. 저장소 안이면 root tsconfig `paths`가 패키지를 `src`로 돌려 dist가 아닌 소스를 재게 됨
- **`NODE_PATH`** — 저장소 밖 entry도 루트 `node_modules`로 패키지를 해석하게 지정

## 결과 읽기

| 컬럼       | 의미                                               |
| ---------- | -------------------------------------------------- |
| `scenario` | `single: X` · `multi: X+Y` · `all-exports`         |
| `raw`      | minify 후 byte                                     |
| `gzip`     | gzip 압축 후 byte                                  |
| `vs all`   | baseline 대비 raw 증감(`−` = 작아짐). baseline은 — |

- **scenario 순서** — 심볼별 single, 심볼이 둘 이상이면 multi, 마지막은 항상 baseline

## 한계

- **react-ui는 심볼과 무관하게 거의 같은 값** — 컴포넌트 최상위 `Component.displayName = '...'` 할당 21개가 원인. 속성 할당이라 번들러가 순수하다고 증명하지 못함. 고치면 소비자가 보는 속성이 바뀌는 breaking 변경이라 별도 승인 필요
- **esbuild 기준** — webpack · rollup 등 실제 소비자 번들러와 결과가 다를 수 있음
- **JS만 측정** — CSS 산출물과 source map은 포함하지 않음

## 새 target 추가

`measure.ts`의 `TARGETS`에 항목 하나 추가.

```ts
'my-pkg': {
  pkg: '@berrypjh/my-pkg',
  external: ['react'], // 번들에서 제외할 의존성
},
```

## 구성

| 파일              | 역할                                                                  |
| ----------------- | --------------------------------------------------------------------- |
| `check.ts`        | CLI(`pnpm treeshake`). 인자 해석, human 표 · `--json` 출력            |
| `measure.ts`      | `TARGETS`, scenario 생성(`scenariosFor`), 임시 entry 번들 · byte 측정 |
| `measure.test.ts` | scenario 이름 · 순서 · entry, `TARGETS` 등록부 검사                   |

테스트는 `pnpm tools:check`가 실행.

## 관련 문서

- [tokens 측정](measure-tokens.md) — AI 에이전트가 읽는 input 토큰 측정(다른 metric)
- [verification-guide.md](../verification-guide.md) — 전체 라이브러리 검증 절차
