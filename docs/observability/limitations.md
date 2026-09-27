# 품질 관측 알려진 제약

측정 의미를 바꾸지 않고 남긴 제약이다. 해결하면 이 목록에서 지운다.

## 수집

- **core는 lib를 build하지 않는다.** size-limit · package 시나리오 token은 그 시점의 `dist`를 읽는다. dist가 source보다 오래되었어도 run에는 현재 source SHA가 기록된다. core 전에 `pnpm build:libs`가 필요하다
- **import report에는 생성 commit이 없다.** `--only-imports` run의 bundle 값은 report를 만든 시점의 결과이고, run source SHA는 수집 시점 HEAD다. report sha256은 남는다
- treeshake는 `pnpm exec esbuild`를 쓴다. pnpm을 쓸 수 없는 환경에서는 not-run이다
- `workingTreeHash`는 untracked 파일 내용을 포함하지 않는다
- `agent-input` context scope는 executor trace가 있을 때만 의미가 있어 수집하지 않는다
- `measure-tokens`의 `design-tokens` · `ui-core` 일부 시나리오는 `dist/AGENTS.md`를 읽는데 그 파일을 만들지 않으므로 `missing-input`이다 (값을 0으로 두지 않음)

## eval

- `local-*` eval run은 `smoke-scripted`(harness 확인용 고정 입력) 결과다. 모델 성능이 아니다
- eval series ID에 `sourceId`(출력 디렉터리 이름)가 들어가서 다른 디렉터리에서 만든 eval 끼리는 짝이 되지 않는다 (비교하면 added/removed만 있고 `metrics.shared`로 incompatible)
- task 부분집합은 `taskCount < datasetTaskCount`로만 안다. 같은 개수의 다른 task 조합은 구분하지 못한다
- `originalComparison` 필드 이전에 수집한 eval run은 `null`(가져오지 않음)이다. 다시 수집해야 채워진다
- eval 비교 · 추세는 primary 5개 metric만 다룬다. secondary · diagnostic은 화면 표에만 있다

## 비교·기록

- 비교는 보고 전용이다. threshold · 통계 검정 · 신뢰구간이 없고 median 차이는 검정이 아니다
- toolchain · lockfile · dirty 차이는 실행 단위에서 `informs`로만 알린다 (비교를 막지 않음)
- `series` 필드 이전 요약은 `null`이라 추세에서 gap이다. `pnpm quality:export`로 다시 export하면 채워진다
- 추세는 표로만 보여준다 (chart dependency 없음)
- 공개 run 충돌 검사는 metadata만 비교한다. baseline 포인터 삭제 명령은 없다
- 지금 계약을 통과하는 실측 core run이 없다. 이전 core run(`local-quality-01` · `local-core-12`)은 제거한 test 결과를 담고 있어 다시 수집해야 한다. 서로 다른 측정 사이의 실제 bundle 회귀 비교는 아직 없다

## 접근성·브라우저

- 접근성 실측 run이 없다. DevHub 평가 화면을 audit한 run(`a11y:devhub`)을 아직 수집하지 않았다
- axe 결과는 자동 검사 범위일 뿐 WCAG 적합성 판정이 아니다. 점수를 만들지 않는다
- Chrome 외 브라우저, forced colors, reduced motion은 자동 검증이 없다

## DevHub·빌드

- DevHub build의 크기와 rendering 시간은 측정하지 않았다
- DevHub `vite build`는 `apps/devhub/public/observability`를 그대로 복사한다. 그 디렉터리에 있는 모든 파일(로컬 run과 편집 도구가 만든 숨김 디렉터리 포함)이 `dist`에 들어간다
- 저장소 root가 아닌 디렉터리에서 `nx`를 실행하면 project graph 처리가 실패한다 (`tools/evals/consumer/fixtures/*`의 이름 없는 package)

## E2E

- `apps/devhub-e2e`에는 `package.json`이 없다 (lockfile을 바꾸지 않기 위해). Playwright · 계약 lib은 root `node_modules`에서 해석된다. `eslint-plugin-playwright`는 설치돼 있지 않다
- 로컬에서는 4400에 떠 있는 서버를 재사용한다. 다른 앱이 떠 있으면 그 앱을 대상으로 실행된다
- keyboard 비교 시나리오는 native select에 Playwright `selectOption`을 쓴다 (화살표 키 조작이 아님)
