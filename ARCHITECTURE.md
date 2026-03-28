# Architecture

effector has three layers. Each layer has a clear boundary and a clear consumer.

```
┌─────────────────────────────────────────────────┐
│  CLI (@effectorhq/cli)                          │
│  The product. init, check, compile, inspect.    │
│  Depends on everything below.                   │
├─────────────────────────────────────────────────┤
│  Serve (@effectorhq/serve)                      │
│  Runtime-adjacent. Typed MCP server.             │
│  Optional. Experimental.                        │
├─────────────────────────────────────────────────┤
│  Core (@effectorhq/core)                        │
│  The kernel. Zero dependencies. Stable API.     │
│  Parse, validate, type-check, compile.          │
└─────────────────────────────────────────────────┘
```

## Core (the kernel)

`packages/core/` — Published as `@effectorhq/core`.

Zero external dependencies. Pure JavaScript ESM. Independently importable.

Subpath exports:
- `@effectorhq/core/toml` — TOML parser for effector.toml
- `@effectorhq/core/skill` — SKILL.md frontmatter parser
- `@effectorhq/core/types` — Type checker (40-type catalog, structural subtyping)
- `@effectorhq/core/schema` — Manifest schema validator
- `@effectorhq/core/compile` — Cross-runtime compiler (MCP, OpenAI, LangChain, JSON)
- `@effectorhq/core/guard` — Runtime type guards
- `@effectorhq/core/errors` — Error types

Core's API is stable. Changes require careful consideration. The EffectorDef IR is the canonical formal object that all operations act upon.

## CLI (the product)

`cli/` — Published as `@effectorhq/cli`.

The user-facing product. Three primary commands:

| Command | What it does | Core operation |
|---|---|---|
| `init` | Create typed skill manifest | Template generation |
| `check` | Validate + type-check + lint + audit | IR well-formedness verification |
| `compile` | Emit runtime-specific format | Interface projection |

Two advanced commands: `serve` (start typed MCP server), `inspect` (show parsed interface).

The CLI is a thin layer over core. It adds: argument parsing, color output, guided prompts, and human-readable formatting. It does not add logic.

## Serve (runtime-adjacent)

`packages/serve/` — Published as `@effectorhq/serve`.

A typed MCP server that validates tool calls against the EffectorDef before execution. Includes:
- Preflight validation
- Permission enforcement
- Capability discovery and composition tools

Serve is experimental (v0.1.0). It is not the primary product surface.

## Internal Packages

These are used by CLI and serve but not published separately:

| Package | Purpose |
|---|---|
| `packages/types/` | Type catalog (40 standard types as JSON) |
| `packages/audit/` | Security scanner for SKILL.md files |
| `packages/compose/` | Type-checked composition engine |
| `packages/lint/` | SKILL.md linter |

## Data Flow

```
effector.toml + SKILL.md
        │
        ▼
   parseEffectorToml()  →  EffectorDef (canonical IR)
        │
        ├── validateManifest()     → errors/warnings
        ├── isKnownType()          → type checking
        ├── audit.scan()           → security findings
        ├── lint.validateSkill()   → lint warnings
        │
        ▼
   compile(def, target)  →  MCP JSON / OpenAI JSON / LangChain Python / raw IR
```

Every feature is an operation on the EffectorDef IR. If a feature cannot be explained as an operation on this object, it does not belong in the system.
