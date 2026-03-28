/**
 * effector compile [dir] -t <target>
 *
 * Compile effector.toml to a runtime-specific format.
 * Targets: mcp, openai-agents, langchain, json
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { c } from '../fmt.js';

export async function runCompile(dir, opts = {}) {
  const absDir = resolve(dir);
  const tomlPath = join(absDir, 'effector.toml');
  const target = opts.target;

  if (!target) {
    console.error(c.red('  Missing --target (-t). Choose: mcp, openai-agents, langchain, json'));
    console.error(c.dim('  → Example: effector compile . -t mcp'));
    return 1;
  }

  if (!existsSync(tomlPath)) {
    console.error(c.red(`  effector.toml not found in ${absDir}`));
    console.error(c.dim('  → Run: effector init'));
    return 1;
  }

  const { parseEffectorToml } = await import('@effectorhq/core/toml');
  const { compile, listTargets } = await import('@effectorhq/core/compile');

  const available = listTargets();
  const targetNames = available.map(t => t.name);
  if (!targetNames.includes(target)) {
    console.error(c.red(`  Unknown target: "${target}"`));
    console.error(c.dim(`  Available: ${targetNames.join(', ')}`));
    return 1;
  }

  const content = readFileSync(tomlPath, 'utf-8');
  const def = parseEffectorToml(content);
  const output = compile(def, target);

  console.log(output);

  if (!opts.json) {
    console.error();
    console.error(c.green(`  ✓ Compiled to ${target}`));
    console.error(c.dim(`  → Try: effector serve . to run as typed MCP server`));
    console.error();
  }

  return 0;
}
