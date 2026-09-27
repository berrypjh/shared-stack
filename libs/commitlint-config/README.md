# @berrypjh/commitlint-config

Conventional Commits 기반의 워크스페이스 공통 commitlint 설정.

## 사용

```bash
pnpm add -D @berrypjh/commitlint-config @commitlint/cli
```

```js
// commitlint.config.js
module.exports = { extends: ['@berrypjh/commitlint-config'] };
```

## 규칙 요약

- **`type-enum`** — feat · fix · docs · design · style · refactor · test · chore · build · ci · revert
- **`no-header-bang`** — `feat!:` 형태 헤더를 막는다. major 변경은 footer에 `BREAKING CHANGE`를 쓴다
- **`subject-empty` · `type-empty`** — 빈 값을 막는다
