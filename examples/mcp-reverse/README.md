# MCP Reverse-Compile Example

This directory contains a raw MCP server (`server.js`) with no typed capabilities.

## Usage

```bash
# Reverse-compile the MCP server into a typed manifest:
effector init --from-mcp .

# Then validate:
effector check .

# And compile to any target:
effector compile . -t openai-agents
```

## What This Shows

Before effector:
- Tool definitions are embedded in code
- No type safety, no permission declaration, no audit

After `effector init --from-mcp`:
- `effector.toml` with typed interface, permissions, quality metadata
- Portable across runtimes (MCP, OpenAI, LangChain)
- Auditable and composable
