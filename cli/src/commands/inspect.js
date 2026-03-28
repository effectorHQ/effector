/**
 * effector inspect [dir]
 *
 * Show the parsed EffectorDef: identity, interface, permissions, quality.
 * A diagnostic view of what effector.toml declares.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { c } from '../fmt.js';

export async function runInspect(dir, opts = {}) {
  const absDir = resolve(dir);
  const tomlPath = join(absDir, 'effector.toml');

  if (!existsSync(tomlPath)) {
    console.error(c.red(`  effector.toml not found in ${absDir}`));
    console.error(c.dim('  → Run: effector init'));
    return 1;
  }

  const { parseEffectorToml } = await import('@effectorhq/core/toml');
  const content = readFileSync(tomlPath, 'utf-8');
  const def = parseEffectorToml(content);

  if (opts.json) {
    console.log(JSON.stringify(def, null, 2));
    return 0;
  }

  const name = def.name || 'unknown';
  const version = def.version || '0.0.0';
  const type = def.type || 'skill';
  const desc = def.description || '';

  console.log();
  console.log(`  ${c.bold(name)} ${c.dim(`v${version}`)} ${c.dim(`(${type})`)}`);
  if (desc) console.log(`  ${c.dim(desc)}`);
  console.log();

  // Interface
  const iface = def.interface || {};
  const input = iface.input || c.dim('(none)');
  const output = iface.output || c.dim('(none)');
  const ctx = Array.isArray(iface.context) ? iface.context : (iface.context ? [iface.context] : []);

  console.log(`  ${c.cyan('Interface')}`);
  console.log(`    input    ${input}`);
  console.log(`    output   ${output}`);
  if (ctx.length > 0) {
    console.log(`    context  ${ctx.join(', ')}`);
  }
  console.log();

  // Permissions
  const perms = def.permissions || {};
  console.log(`  ${c.cyan('Permissions')}`);
  console.log(`    network      ${formatBool(perms.network)}`);
  console.log(`    subprocess   ${formatBool(perms.subprocess)}`);
  console.log(`    filesystem   ${formatList(perms.filesystem)}`);
  if (perms['env-read']?.length > 0) {
    console.log(`    env-read     ${perms['env-read'].join(', ')}`);
  }
  if (perms['env-write']?.length > 0) {
    console.log(`    env-write    ${perms['env-write'].join(', ')}`);
  }
  console.log();

  // Quality (if present)
  const quality = def.quality;
  if (quality) {
    console.log(`  ${c.cyan('Quality')}`);
    if (quality.nondeterminism != null) console.log(`    nondeterminism  ${quality.nondeterminism}`);
    if (quality.idempotent != null) console.log(`    idempotent      ${quality.idempotent}`);
    if (quality.tokenBudget != null) console.log(`    token-budget    ${quality.tokenBudget}`);
    if (quality.latencyP50 != null) console.log(`    latency-p50     ${quality.latencyP50}`);
    console.log();
  }

  return 0;
}

function formatBool(val) {
  if (val === true) return c.yellow('yes');
  if (val === false) return c.green('no');
  return c.dim('(unset)');
}

function formatList(val) {
  if (!val || (Array.isArray(val) && val.length === 0)) return c.green('none');
  if (Array.isArray(val)) return val.join(', ');
  return String(val);
}
