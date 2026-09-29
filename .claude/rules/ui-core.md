---
paths:
  - 'libs/ui-core/**'
---

# ui-core (`libs/ui-core`)

`react-ui`(web)와 `react-native-ui`(RN)가 함께 구현하는 prop 계약과, design-tokens 산출물을 통과시키는 토큰 facade를 두는 private 패키지. 계약 목록은 `src/contracts/index.ts`, 공개 심볼은 `src/index.ts`가 원본이다. 플랫폼 중립 기준은 `_generated/cross-runtime-pure.md`이고 `src/boundary.test.ts`가 강제한다.

## 규칙

- **토큰은 통과만 시킨다.** 생성 · 가공은 design-tokens의 일이다
- **design-tokens 심볼은 ui-core를 거쳐 다운스트림에 간다.** 렌더러 · 앱에 `from '@berrypjh/design-tokens'`가 필요하면 `src/tokens/index.ts`에 패스스루를 추가한다
- **web 전용 유틸(`cx` · 폼 헬퍼)은 react-ui에 둔다.** className은 web 개념이라 순수 함수여도 여기 두지 않는다
- **계약에는 양쪽이 같은 의미로 쓰는 어휘만 올린다.** 슬롯 · 접근성 이름 · 스타일은 렌더러가 소유한다
- **export를 바꾸면 양 렌더러의 `src/index.ts`와 `src/deprecated.ts`를 함께 고친다.** 반대 플랫폼 심볼은 `deprecated.ts`가 `@deprecated`로 내보낸다
- **`/css` · `/tailwind` · `dist/tokens.json`은 design-tokens 산출물의 복사본이다.** 다시 만들지 않는다. 공개 범위는 exports map이고 `src/packageSurface.test.ts`가 exports ↔ dist를 대조한다

### 계약의 비직관적 결정

고치기 전에 이유를 확인한다.

- **Stack `direction`은 계약이 기본값을 두지 않는다.** CSS와 RN의 기본이 달라 두 렌더러가 각각 `'column'`으로 맞춘다
- **Divider `orientation`은 Stack의 `column` · `row`와 일부러 다른 어휘다.** 선이 가르는 축이기 때문이다
- **Badge intent에 `warning` · `success`가 없다.** 대비 실측 결과다. Chip에 intent가 없는 것은 selected 강조와 겹치기 때문이다

## 검증

```bash
pnpm nx run @berrypjh/ui-core:typecheck   # lib 선언 emit → spec 검사
pnpm nx run @berrypjh/ui-core:test        # build 후 vitest
pnpm nx run @berrypjh/react-native-ui:typecheck
pnpm build:libs
```

토큰 JSON을 바꿨으면 `pnpm tokens:build`를 먼저 돌린다. ui-core는 design-tokens를 `dist`로 본다.

## Gotcha

- **typecheck는 lib → spec 순서다.** spec이 `out-tsc`의 빌드된 선언을 읽어서, lib을 먼저 돌리지 않으면 `@ts-expect-error`가 조용히 통과한다
- **선언이 옛 심볼을 들고 있으면 `rm -rf libs/ui-core/out-tsc`.** tsc는 지워진 소스의 산출물을 정리하지 않는다
- **`getToken`은 없는 경로에 throw한다.** 조용히 넘기면 `undefined`가 원인에서 먼 곳에서 터진다
- **`parity.test.ts`가 깨지면 별칭을 고치기 전에 Web · RN 어휘가 왜 갈라졌는지부터 본다.** `ColorToken` 등은 Web 트리에서 유도하고 RN 트리 조회에 같이 쓴다
- **테마를 더했는데 RN typecheck가 안 깨지면 design-tokens를 다시 빌드하지 않은 것이다**
- **`tsconfig.base.json`의 `paths`에 `@berrypjh/design-tokens`를 넣지 않는다.** composite 제약과 충돌해 빌드가 깨진다
