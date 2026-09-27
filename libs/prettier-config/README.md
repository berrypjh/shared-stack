# @berrypjh/prettier-config

워크스페이스 공통 Prettier 설정.

## 사용

```bash
pnpm add -D @berrypjh/prettier-config prettier
```

```jsonc
// package.json
{
  "prettier": "@berrypjh/prettier-config",
}
```

## 규칙

- `printWidth`: 100, `tabWidth`: 2, `useTabs`: false
- `singleQuote`: true, `jsxSingleQuote`: false, `semi`: true
- `trailingComma`: all, `arrowParens`: always
- `bracketSpacing`: true, `bracketSameLine`: false, `singleAttributePerLine`: false
- `endOfLine`: lf
- `htmlWhitespaceSensitivity`: css, `embeddedLanguageFormatting`: auto

### Override

- `*.md`, `*.mdx`: `proseWrap: preserve`
- `*.yml`, `*.yaml`: `singleQuote: false`(YAML 표준)
