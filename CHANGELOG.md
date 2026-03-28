# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-29

### Added

- **Monorepo consolidation**: 7 packages unified under one repository
- **Unified CLI** (`@effectorhq/cli`): `init`, `check`, `compile`, `inspect`, `serve`
- **`effector check`** — hero command: validate + type-check + lint + audit in one pass
- **`effector init`** — 4 templates (skill, workflow, extension, minimal) that pass check with zero modifications
- **`effector compile`** — 4 targets: MCP, OpenAI Agents, LangChain, JSON IR
- **`effector inspect`** — show parsed EffectorDef interface and permissions
- **`effector serve`** — typed MCP server with preflight validation (experimental, v0.1)
- **Real lint integration** in `check` command (previously stubbed)
- **42 standard types** with structural subtyping, alias resolution, and precision scoring
- **Guided CLI**: every command suggests the next step, errors guide correction
- **stdout/stderr discipline**: machine output on stdout, status on stderr
- **`--json` flag** on all commands for CI integration
- **CI/CD**: GitHub Actions testing on Node 18, 20, 22 with golden path verification
- **257 tests** across all workspaces, all passing

### Changed

- Absorbed `openclaw-mcp` into `packages/serve/src/mcp/` (1 import path change)
- Renamed `@effectorhq/skill-lint` → `@effectorhq/lint` (internal)
- Updated error messages to reference unified CLI commands instead of legacy `effector-core` commands
- Updated type catalog descriptions to remove references to defunct packages

### Removed

- Legacy `effector-core` CLI bin entry (superseded by unified `@effectorhq/cli`)
- TODO-skeleton templates (replaced with zero-modification working templates)

### Migration

This release consolidates the following repositories into one monorepo:

| Old Repository | New Location |
|---|---|
| `effector-core` | `packages/core/` |
| `effector-types` | `packages/types/` |
| `effector-audit` | `packages/audit/` |
| `effector-compose` | `packages/compose/` |
| `effector-serve` + `openclaw-mcp` | `packages/serve/` |
| `skill-lint` | `packages/lint/` |
| `create-effector` | `cli/src/commands/init.js` |

Old repositories will be archived with redirect notices.
