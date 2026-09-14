# baseline

여기에는 **실제 run에서 만들어진** baseline 스냅샷만 들어간다 (`<split>.json`).

```bash
pnpm exec tsx tools/evals/consumer/runner/run.ts \
  --split=test --replay=<traces.jsonl> --write-baseline
```

## 규칙

- metric을 손으로 적어 넣지 않는다. `--write-baseline`이 실제 실행 결과로만 쓴다.
- 파일이 없으면 report는 `No baseline available — reporting current run only`를 낸다.
  없는 회귀를 지어내지 않는다.
- 스냅샷에는 `conditions`(dataset 해시, variant, trial 수, executor/model, capability 해시,
  catalog schema, harness 버전)가 함께 저장된다. 조건이 다르면 report가 "비교 불가"로
  경고하고 숫자를 나란히 놓지 않는다.

## 아직 baseline이 없는 이유

programmatic LLM executor가 없어서 stochastic metric의 실측값이 존재하지 않는다.
executor가 붙고 반복 시행 분산을 확인한 뒤에 첫 baseline을 만든다. 그 전까지 모든
stochastic metric은 **report-only**이고, CI gate는 결정적 불변식만 담당한다.
