# treeshake

특정 라이브러리의 트리셰이킹(dead-code-elimination) 효과를 byte 단위로 측정. 사용자가 "단일 export만 import"한 가짜 entry를 esbuild로 번들 → minify → 결과 byte를 "전체 export" 베이스라인과 비교.

## 사용

```bash
# 단일 심볼
pnpm treeshake <target> <symbol>

# 여러 심볼
pnpm treeshake <target> <symbol1> <symbol2> ...

# 전체 export 베이스라인만
pnpm treeshake <target>
```

`<target>`은 다음 4개 중 하나: `design-tokens`, `ui-core`, `react-ui`, `react-native-ui`.

## 예시

### 잘 동작하는 케이스 (ui-core)

```bash
$ pnpm treeshake ui-core createTheme
```

```
target:  ui-core (@berrypjh/ui-core)
external: (none)

scenario                       raw      gzip    vs all
------------------------------------------------------
single: createTheme            685       242    −99.5%
all-exports (baseline)     148,910     8,423         —

tree-shaking 효과: 단일 심볼(createTheme)은 전체 대비 raw 99.5% 작음
```

ui-core는 side-effect 없는 타입·토큰 계층이라 단일 심볼이 거의 빈 번들 수준이다.
baseline이 큰 것은 전체 export가 테마별 토큰 트리를 전부 끌고 오기 때문.

### 한계가 보이는 케이스 (react-ui)

```bash
$ pnpm treeshake react-ui Box Button TextField
```

```
target:  react-ui (@berrypjh/react-ui)
external: react, react-dom, react/jsx-runtime

scenario                            raw      gzip    vs all
-----------------------------------------------------------
single: Box                      34,181    10,593    −60.7%
single: Button                   34,181    10,592    −60.7%
single: TextField                34,181    10,592    −60.7%
multi: Box+Button+TextField      34,187    10,602    −60.7%
all-exports (baseline)           86,916    14,508         —
```

**관찰**:

- 어떤 컴포넌트 하나만 import해도 **34KB 동일** — Box/Button/TextField 다 같은 사이즈
- 세 개 동시 import해도 거의 안 늘어남 (34,187 bytes)

**원인**: `libs/react-ui/package.json`의 `sideEffects: ["**/*.css", "**/*.scss"]`로 SCSS import는 side-effect로 보존됨. `src/index.ts`가 맨 위에서 `import './styles'`로 17개 SCSS 파일을 한 번에 import. 한 컴포넌트만 써도 styles 모듈이 evaluate되며 그 안의 transitive JS가 따라옴.

**해석**: react-ui는 CSS 묶음 전제로 설계된 패키지. Tailwind 사용자라면 CSS는 별도 import (`@berrypjh/react-ui/styles.css`)이므로 JS 번들의 34KB 오버헤드는 컴포넌트 wrapper 코드 + 공유 utils. 그래도 전체(86KB) 대비 −60% 절감은 됨 — "트리셰이킹이 부분적으로 동작"하는 정상 패턴.

## 어떻게 동작하는지

1. 가짜 entry 파일 생성:

   ```js
   // 단일 심볼
   import { Button } from '@berrypjh/react-ui';
   console.log(Button);
   ```

   `console.log`는 esbuild가 export를 dead-code로 보지 않게 막는 anchor.

2. `pnpm exec esbuild`로 번들:

   ```
   --bundle --minify --format=esm --tree-shaking=true
   --external:react --external:react-dom --external:react/jsx-runtime
   ```

3. stdout으로 받은 코드를 `Buffer.byteLength` (raw) + `zlib.gzipSync` (gzip)로 측정.

4. "전체 export" 베이스라인은 `export * from 'pkg'`로 만들어 트리셰이킹을 최대한 무력화.

5. 비율 계산: `(1 - single / all) * 100`.

## 출력 컬럼

| 컬럼       | 의미                                               |
| ---------- | -------------------------------------------------- |
| `scenario` | 측정 시나리오 (single, multi, all-exports)         |
| `raw`      | 번들 raw byte (minify 후)                          |
| `gzip`     | gzip 압축 후 byte                                  |
| `vs all`   | all-exports baseline 대비 raw 비율 (음수 = 작아짐) |

## 새 패키지 추가

`tools/scripts/treeshake/check.ts`의 `TARGETS`에 항목 한 개 추가:

```ts
'my-pkg': {
  pkg: '@berrypjh/my-pkg',
  external: ['react', 'react-dom'],  // bundle에서 제외할 의존
},
```

## 한계

- esbuild의 트리셰이킹은 webpack/rollup과 결과가 다를 수 있음 — 실제 사용자가 어떤 번들러 쓰는지에 따라 효과 차이 가능
- minify 후 raw byte 측정이라 source map은 빠짐
- side-effect 없는 export일수록 정확한 측정 — 상태/CSS/effect 있으면 결과가 보수적

## 관련 문서

- [tokens 측정 인프라](../measure-tokens/README.md) — AI 에이전트가 소비하는 input 토큰 측정 (다른 메트릭)
- [verification-guide.md](../../../docs/verification-guide.md) — 전체 라이브러리 검증 절차
