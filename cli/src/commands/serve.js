/**
 * effector serve [dir]
 *
 * Start a typed MCP server with preflight validation and permission enforcement.
 * Reads effector.toml, validates the manifest, then serves over stdin/stdout.
 */

import { resolve } from 'node:path';

const NO_COLOR = process.env.NO_COLOR !== undefined;
const c = {
  green:  s => NO_COLOR ? s : `\x1b[32m${s}\x1b[0m`,
  cyan:   s => NO_COLOR ? s : `\x1b[36m${s}\x1b[0m`,
  dim:    s => NO_COLOR ? s : `\x1b[2m${s}\x1b[0m`,
  red:    s => NO_COLOR ? s : `\x1b[31m${s}\x1b[0m`,
  bold:   s => NO_COLOR ? s : `\x1b[1m${s}\x1b[0m`,
};

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
