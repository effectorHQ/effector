/**
 * Example: a raw MCP server without typed capabilities.
 *
 * This is what an untyped MCP tool looks like.
 * Run `effector init --from-mcp .` to reverse-compile it into a typed manifest.
 *
 * Compare:
 *   - Before: no types, no permissions, no audit
 *   - After:  effector.toml with types, permissions, and quality metadata
 */

const tools = [
  {
    name: 'search_web',
    description: 'Search the web and return results',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        limit: { type: 'number', description: 'Max results' },
      },
      required: ['query'],
    },
  },
];

// Minimal JSON-RPC handler
process.stdin.setEncoding('utf-8');
let buffer = '';
process.stdin.on('data', chunk => {
  buffer += chunk;
  const lines = buffer.split('\n');
  buffer = lines.pop();
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const req = JSON.parse(line);
      if (req.method === 'tools/list') {
        respond(req.id, { tools });
      } else if (req.method === 'tools/call') {
        respond(req.id, { content: [{ type: 'text', text: `Searched for: ${req.params?.arguments?.query}` }] });
      }
    } catch {}
  }
});

function respond(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
}
