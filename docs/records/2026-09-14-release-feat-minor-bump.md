# 릴리스가 feat 커밋을 patch 로 올리던 문제

커밋 scope(`react-ui`)와 nx release 프로젝트 이름(`@berrypjh/react-ui`)이 달라 nx 가 feat 를 알아보지 못함. 릴리스 스크립트가 직접 feat 를 판정해 minor bump 를 적용하도록 수정.

## 증상

- `feat(react-ui): …` 커밋이 쌓였는데 릴리스가 patch 로 나감

## 원인

- 커밋 규칙(commitlint · berry-commit)은 scope 에 디렉터리 이름(`react-ui`)을 씀
- nx release 는 프로젝트 이름(`@berrypjh/react-ui`)과 scope 가 맞아야 그 커밋을 해당 프로젝트의 변경으로 셈. 맞지 않으니 feat 가 없는 것으로 보고 patch 를 계산

## 반영

- `tools/scripts/release/release-bump.ts` — `toReleaseScopes`(npm scope 제거) · `hasReleaseFeature`(릴리스 대상 scope 의 feat, 다중 scope 포함) 순수 함수
- `tools/scripts/release/release-npm.ts` — 마지막 tag 이후 log 조회를 `getLogSinceLastTag` 로 공통화해 BREAKING 판정과 함께 씀

## 검증

- `tools/scripts/release/release-bump.test.ts` — scope 변환 · 다중 scope · 대상 밖 scope · feat 아닌 커밋
- `pnpm tools:check`(CI consumer-eval job)에서 돔. 실제 게시는 main push 의 release workflow
