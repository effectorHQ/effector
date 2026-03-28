/**
 * effector serve [dir]
 *
 * Start a typed MCP server with preflight validation and permission enforcement.
 * Reads effector.toml, validates the manifest, then serves over stdin/stdout.
 */

import { resolve } from 'node:path';
import { c } from '../fmt.js';

export async function runServe(dir, opts = {}) {
  const absDir = resolve(dir);

  const { startGuardedServer } = await import('@effectorhq/serve');

  console.error();
  console.error(`  ${c.bold('effector serve')} ${c.dim(absDir)}`);
  console.error(`  ${c.dim('Typed MCP server · stdin/stdout · Ctrl-C to stop')}`);
  console.error();

  await startGuardedServer(absDir, {
    strict: opts.strict,
  });
}
