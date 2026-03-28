# Known Limitations

This document is honest about what effector can and cannot do today.

## What Works

- `effector init` produces zero-modification working manifests (4 templates)
- `effector check` validates manifest, types, lint, and audit in one pass
- `effector compile` emits valid MCP, OpenAI Agents, LangChain, and JSON IR
- `effector inspect` shows parsed interface and permissions
- 40-type catalog with structural subtyping and alias resolution
- stdout/stderr separation for scriptability
- `--json` flag for CI integration

## What Does Not Work Yet

### `effector init --from-mcp`

The reverse compiler (`reverseMCP`) is exported and wired, but the quality of inferred types depends on the MCP server's schema richness. Generated manifests may contain `TODO` comments for type refinement. This is useful but not production-ready.

### Type Suggestions

When `effector check` finds an unknown type, it does not yet suggest the closest match from the catalog. The "did you mean X?" feature is stubbed but not implemented.

### Audit Boundary

The audit scanner (`@effectorhq/audit`) prints directly to console in some code paths. The CLI suppresses this, but the package API boundary is not clean. If you import `@effectorhq/audit` as a library, expect console side effects.

### Compose

The composition engine (`@effectorhq/compose`) exists as an internal package but has no CLI surface. Type-checked skill composition is planned but not exposed as a user-facing command.

### Serve

`@effectorhq/serve` is functional but experimental (v0.1.0). It provides:
- Typed MCP server with preflight validation
- Permission enforcement
- Capability discovery and composition tools

It is not the primary product surface. Use it for development and testing, not production deployments.

### Spec References

The formal specification in `spec/` references "OpenClaw" and "ClawHub" in historical context. These are legacy names from the project's origin. The current product name is **effector**.

## What We Intentionally Do Not Do

- **We do not execute agent tools.** Effector validates and compiles. Execution is the runtime's job.
- **We do not depend on external services.** Core is zero-dependency. No network calls, no telemetry, no package manager lock-in.
- **We do not ship more than 3 public packages.** Internal packages exist but are not published separately.
- **We do not expose composition, discovery, or graph as CLI commands yet.** These are research-phase features.
