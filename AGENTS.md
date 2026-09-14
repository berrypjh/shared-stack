# AGENTS.md

> Note: `CLAUDE.md` is a symlink to AGENTS.md. They are the same file.

## Purpose

This repository is an Nx monorepo for a cross-platform UI system.
The intended flow is:

`design-tokens -> ui-core -> platform UI libraries -> demo apps`

Agents must optimize for:

- maintainability
- consistency across packages
- small, verifiable changes
- preserving public API stability unless the task explicitly allows breaking changes

---

## Workspace Overview

### Main directories

- `apps/demo-mobile`: Expo / React Native demo app
- `apps/demo-web`: React + Vite demo app
- `apps/quality-lab`: private Vite app that displays exported quality-collection results after validating them against `observability-contracts`
- `apps/quality-lab-e2e`: Playwright E2E tests for `quality-lab`
- `libs/design-tokens`: design token sources, transforms, and generated outputs
- `libs/ui-core`: platform-agnostic contracts, shared logic, and foundational utilities
- `libs/react-ui`: React web UI component library
- `libs/react-native-ui`: React Native UI component library
- `libs/observability-contracts`: private zod schemas shared by the quality-lab collectors and app; not released
- `libs/{eslint,prettier,tsconfig,commitlint}-config`: shared configuration packages consumed by downstream repositories
- `docs/quality-lab`: quality-lab architecture, metrics, collectors, verification, and limitations
- `plugins/berry-commit`: Claude Code plugin (`commit-scope` skill + `commit-mcp` MCP server), distributed through `.claude-plugin/marketplace.json`
- `tools/lib`: helpers shared across tools (for example token counting)
- `tools/scripts`: build and measurement scripts — token measurement, tree-shaking check, release, the generated consumer catalog, and the quality-lab observability collectors (`tools/scripts/observability`)
- `tools/consumer-retrieval`: deterministic resolvers that narrow retrieval from platform to package to symbol to token (`pnpm ui:lookup`)
- `tools/evals/consumer`: the consumer evaluation harness — dataset, variants, graders, verification, and reports

Quality observability is a separate flow: `observability-contracts -> tools/scripts/observability (collect, export) -> apps/quality-lab`.

Most apps and libs have their own `AGENTS.md` with local rules. Read the nearest one before editing inside that project.

`tools/` is not an Nx project, so `nx affected` does not reach it. Its typecheck and tests run through `pnpm tools:check`, which the `consumer-eval` job in `pr-check.yml` executes on every PR.

When editing the plugin, load it with `claude --plugin-dir ./plugins/berry-commit` — a local plugin directory takes precedence over the installed copy. `plugins/*/dist` is a committed build artifact: rebuild with `pnpm build:mcp:commit` and commit it alongside any `src/` change.

---

## How To Work In This Repository

### Default working style

- Work incrementally.
- Make the smallest valid change first.
- Validate each increment before expanding scope.
- Prefer modifying existing patterns rather than introducing new abstractions.
- Avoid broad refactors unless the task explicitly requires them.

### When requirements are unclear

- Check nearby code and docs before guessing.
- If still unclear, state the exact uncertainty.
- Do not silently make large architectural assumptions.

---

## Package Management and Task Execution

### Tooling

- Use `pnpm` for package management.
- Use `nx` targets when available.

### Dependency discipline

- Prefer existing dependencies already used in the workspace.
- Add new dependencies only when clearly justified.

---

## Coding Rules

### General

- Prefer short, focused modules and functions.
- Use clear names.
- Favor clarity over cleverness.
- Keep comments sparse and useful.
- Prefer docstrings or API-facing documentation over noisy inline comments.
- Prefer arrow functions for JavaScript and TypeScript functions unless a regular function is clearly better for the use case.

---

## Validation Rules

### Default rule

Every meaningful behavior change should be validated.

### Validation order

1. Run the smallest relevant check first.
2. Run package-level checks.
3. Run broader workspace checks only when needed.

### Examples of what to validate

- if logic changed: run tests
- if public types changed: run typecheck
- if export/build behavior changed: run build
- if UI behavior changed: inspect story/demo coverage when practical
- if token outputs changed: validate downstream consumers that rely on them

---

## Things To Avoid

- Do not manually edit build outputs.
- Do not bypass established Nx targets when they already exist.
- Do not duplicate design token values across packages.
- Do not introduce platform-specific assumptions into `ui-core`.
- Do not change CI, release, or workflow files unless the task is explicitly about automation or delivery.
- Do not introduce large refactors into a focused task unless requested.
