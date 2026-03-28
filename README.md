# effector

[![npm version](https://img.shields.io/npm/v/@effectorhq/cli?color=E03E3E&logo=npm&logoColor=white)](https://www.npmjs.com/package/@effectorhq/cli)
[![CI](https://github.com/effectorHQ/effector/actions/workflows/ci.yml/badge.svg)](https://github.com/effectorHQ/effector/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)
[![Zero Dependencies](https://img.shields.io/badge/core_dependencies-0-brightgreen.svg)](#zero-dependencies)
[![Tests](https://img.shields.io/badge/tests-257%20passing-brightgreen.svg)](#)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

**A typed capability interface layer for agent skills.**

**One CLI. One manifest. Every runtime.**

Define types, permissions, and quality constraints for your agent tools — then validate, audit, and compile to MCP, OpenAI Agents, LangChain, or raw JSON IR. Zero runtime dependencies.

---

## Install

```bash
npm install -g @effectorhq/cli
```

Or run directly without installing:

```bash
npx @effectorhq/cli init my-skill
```

---

## Quick Start

```bash
npx @effectorhq/cli init my-skill    # scaffold a typed skill manifest
cd my-skill
effector check .                      # validate + type-check + lint + audit
effector compile . -t mcp             # compile to MCP tool schema
```

That's it. No configuration. No runtime dependency. Your skill is typed, audited, and compiled.

```
┌───────────────┐     ┌──────────────┐     ┌──────────────┐
│ effector.toml │────▶│    check     │────▶│   compile    │
│   SKILL.md    │     │  types/lint/ │     │  mcp/openai/ │
└───────────────┘     │  audit       │     │  langchain   │
                      └──────────────┘     └──────────────┘
```

---

## The Problem

Every AI framework defines capabilities differently. MCP tools accept untyped JSON. OpenAI function calls need a separate schema. LangChain tools only work in Python. There's no standard way to answer _"Is this tool safe? Can it compose with that one?"_ until something breaks at runtime.

Agent skills today have:
- **No types** — input/output is `any`
- **No permissions** — tools silently access network, filesystem, env
- **No portability** — locked to one framework
- **No audit** — no way to verify safety before execution

## The Solution

Drop an `effector.toml` next to your tool:

```toml
[effector]
name = "code-review"
version = "0.1.0"
type = "skill"
description = "Automated code review on pull request diffs"

[effector.interface]
input = "CodeDiff"
output = "ReviewReport"
context = ["Repository", "GitHubCredentials"]

[effector.permissions]
network = true
subprocess = false
filesystem = ["read"]
env-read = ["GITHUB_TOKEN"]
```

Now your tool has:
- **Type-safe interfaces** — input/output/context from 40 standard types with structural subtyping
- **Declared permissions** — network, subprocess, filesystem, env access — auditable and enforceable
- **Cross-runtime portability** — compile once to MCP, OpenAI Agents, LangChain, or JSON IR
- **Static audit** — security scanning for prompt injection, data exfiltration, permission creep

---

## Commands

| Command | What It Does |
|---------|-------------|
| `effector init [dir]` | Create a typed skill manifest |
| `effector check [dir]` | Validate + type-check + lint + audit |
| `effector compile [dir] -t <target>` | Compile to runtime target |
| `effector inspect [dir]` | Show parsed interface + permissions |
| `effector serve [dir]` | Start typed MCP server |

### `effector check` — the hero command

One command. Complete picture.

```
$ effector check .

  my-skill v0.1.0

  Manifest    ✓ valid
  Types       ✓ CodeDiff → ReviewReport (known, compatible)
  Lint        ✓ 0 warnings
  Audit       ✓ Score 5/5

  ✓ All checks passed (3.1ms)

  → Next: effector compile . -t mcp
```

On failure, it guides correction:

```
$ effector check .

  my-tool v0.1.0

  Manifest    ✓ valid
  Types       ✗ "FooBar" is not a known type
  Lint        ✓ 0 warnings
  Audit       ✓ Score 5/5

  ✗ 1 error (2.8ms)

  → Fix the errors, then run: effector check .
```

### `effector compile` — target any runtime

```bash
effector compile . -t mcp            # MCP tool schema (JSON-RPC 2.0)
effector compile . -t openai-agents  # OpenAI Agents FunctionTool
effector compile . -t langchain      # LangChain StructuredTool (Python)
effector compile . -t json           # Raw EffectorDef IR
```

stdout for machine output, stderr for status. Pipe-friendly by design:

```bash
effector compile . -t mcp | jq .name        # extract tool name
effector compile . -t mcp > tool.json       # save to file
effector compile . -t json | jq '.interface' # inspect interface
```

### `effector init` — zero-modification templates

Every template passes `effector check` with zero changes:

```bash
effector init my-skill                        # code review skill (default)
effector init my-workflow --template workflow  # CI/CD deployment
effector init my-ext --template extension      # external service sync
effector init my-tool --template minimal       # bare minimum
```

---

## Type System

40 standard types across three roles, grounded in analysis of 13,000+ real-world agent tools:

| Role | Count | Examples |
|------|-------|----------|
| **Input** | 15 | `String`, `CodeDiff`, `URL`, `JSON`, `ImageRef`, `SearchQuery` |
| **Output** | 14 | `Markdown`, `ReviewReport`, `TestResult`, `DeploymentStatus` |
| **Context** | 11 | `GitHubCredentials`, `Repository`, `Docker`, `AWSCredentials` |

### Compatibility Rules

```
1. Exact match           → precision 1.0
2. Alias resolution      → precision 0.95  (PlainText → String)
3. Subtype relation      → precision 0.9   (SecurityReport → ReviewReport)
4. Wildcard matching     → precision 0.8   (*Report matches ReviewReport)
5. Structural subtyping  → precision varies (fields/total)
6. Otherwise             → incompatible
```

---

## Compile Targets

| Target | Format | Output |
|--------|--------|--------|
| `mcp` | JSON | MCP tool schema (JSON-RPC 2.0) |
| `openai-agents` | JSON | OpenAI Agents FunctionTool definition |
| `langchain` | Python | LangChain StructuredTool class |
| `json` | JSON | Raw EffectorDef IR (passthrough) |

Custom targets can be registered programmatically:

```js
import { registerTarget, compile } from '@effectorhq/core/compile';

registerTarget('crewai', (def) => {
  return JSON.stringify({
    name: def.name,
    description: def.description,
    expected_output: `A ${def.interface?.output}`,
  }, null, 2);
}, { description: 'CrewAI agent tool', format: 'json' });

compile(myDef, 'crewai'); // works
```

---

## The Canonical IR

Every feature is an operation on **EffectorDef** — the canonical intermediate representation:

```
EffectorDef {
  identity:    { name, version, type, description }
  interface:   { input: Type, output: Type, context: Type[] }
  permissions: { network, subprocess, filesystem[], envRead[], envWrite[] }
  quality:     { nondeterminism, idempotent, tokenBudget, latencyP50 }
}
```

| Operation | Formal Concept | What It Does |
|-----------|---------------|-------------|
| `check` | Type checking + safety analysis | Verify IR well-formedness, types, permissions |
| `compile` | Interface projection | Transform IR to runtime-specific format |
| `init --from-mcp` | Interface reconstruction | Infer IR from existing MCP server |
| `serve` | Runtime contract enforcement | Validate data against IR at execution boundary |

---

## Shell / CI Integration

```bash
# CI: fail if check finds errors
effector check . --json | jq -e '.ok' > /dev/null

# Compile and pipe to another tool
effector compile . -t json | jq '.interface'

# Machine-readable inspect
effector inspect . --json | jq '.permissions'

# Combine with other CLI tools
effector compile . -t mcp | curl -X POST -d @- https://api.example.com/tools
```

All commands support `--json` for machine-readable output.

---

## Architecture

```
                      ┌──────────────────────────────────┐
                      │     @effectorhq/cli              │
                      │     The product.                 │
                      │     init, check, compile,        │
                      │     inspect, serve               │
                      └──────────────┬───────────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
   ┌──────────▼──────────┐  ┌───────▼────────┐  ┌──────────▼──────────┐
   │  @effectorhq/core   │  │    (internal)  │  │  @effectorhq/serve  │
   │  Zero-dep kernel.   │  │  types, audit, │  │  Typed MCP server.  │
   │  Parse, validate,   │  │  compose, lint │  │  Experimental.      │
   │  type-check,compile │  └────────────────┘  └─────────────────────┘
   └─────────────────────┘
```

### Published Packages

| Package | Purpose | Dependencies | Stability |
|---------|---------|-------------|-----------|
| `@effectorhq/cli` | One install, one tool. | core + internals | **stable** (v1.0) |
| `@effectorhq/core` | Embeddable kernel. Parse, validate, compile. | **zero** | **stable** (v1.0) |
| `@effectorhq/serve` | Typed MCP server with preflight validation. | core | experimental (v0.1) |

### Internal Packages

| Package | Purpose |
|---------|---------|
| `packages/types/` | Type catalog (40 standard types as JSON) |
| `packages/audit/` | Security scanner for SKILL.md files |
| `packages/compose/` | Type-checked composition engine |
| `packages/lint/` | SKILL.md linter |

See [ARCHITECTURE.md](ARCHITECTURE.md) for layer boundaries and data flow.
See [PACKAGE_STATUS.md](PACKAGE_STATUS.md) for stability guarantees.

---

## Zero Dependencies

`@effectorhq/core` uses only Node.js built-ins (`fs`, `path`, `url`, `util`). Every parser, validator, type checker, and compiler is implemented from scratch.

Why?
- **No supply chain risk** — nothing to audit beyond this repo
- **Fast installs** — no dependency tree to resolve
- **No version conflicts** — works everywhere Node 18+ runs
- **Embeddable** — import into any JS/TS project without bloat

---

## Examples

### `examples/hello-skill/`

A minimal working skill generated by `effector init --template minimal`:

```bash
cd examples/hello-skill
effector check .              # ✓ All checks passed
effector compile . -t mcp     # valid MCP JSON
effector inspect .            # shows interface + permissions
```

### `examples/mcp-reverse/`

A raw MCP server without typed capabilities. Demonstrates reverse-compilation:

```bash
cd examples/mcp-reverse
effector init --from-mcp .    # infer types from MCP server
effector check .              # validate the generated manifest
```

---

## Known Limitations

See [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md) for a full honest accounting.

Key items:
- `init --from-mcp` works but generated manifests may need manual type refinement
- Type suggestion ("did you mean X?") is not yet implemented
- `@effectorhq/serve` is experimental (v0.1.0)
- Composition engine exists internally but has no CLI surface yet
- Spec files reference legacy "OpenClaw" terminology in historical context

---

## What This Is Not

effector is **not** a runtime, not an orchestration engine, not a framework. It does not execute agent tools. It does not call APIs. It does not manage state.

effector is a **typed capability interface layer**. It sits before execution. It validates and compiles — then gets out of the way. Runtimes are compile targets, not dependencies.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

This project is licensed under the [Apache License, Version 2.0](LICENSE) 。

---

<sub>Part of the <a href="https://github.com/effectorHQ">effectorHQ</a> studio. We build typed capabilities for AI that acts in the world.</sub>
