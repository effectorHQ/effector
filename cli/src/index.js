/**
 * @effectorhq/cli — A typed capability interface layer for agent skills.
 *
 * P0 commands: init, check, compile
 * P1 commands: serve, inspect
 */

import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const NO_COLOR = process.env.NO_COLOR !== undefined;

const c = {
  red:    s => NO_COLOR ? s : `\x1b[31m${s}\x1b[0m`,
  green:  s => NO_COLOR ? s : `\x1b[32m${s}\x1b[0m`,
  yellow: s => NO_COLOR ? s : `\x1b[33m${s}\x1b[0m`,
  cyan:   s => NO_COLOR ? s : `\x1b[36m${s}\x1b[0m`,
  bold:   s => NO_COLOR ? s : `\x1b[1m${s}\x1b[0m`,
  dim:    s => NO_COLOR ? s : `\x1b[2m${s}\x1b[0m`,
};

function getVersion() {
  try {
    return JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8')).version;
  } catch { return '0.0.0'; }
}

function showHelp() {
  console.log(`
${c.bold('effector')} — typed capabilities for agent skills

${c.bold('Usage:')}  effector <command> [dir] [flags]

${c.bold('Commands:')}
  ${c.cyan('init')} [dir]                  Create a typed skill manifest
  ${c.cyan('check')} [dir]                 Validate + type-check + lint + audit
  ${c.cyan('compile')} [dir] -t <target>   Compile to runtime target (mcp|openai-agents|langchain|json)

${c.bold('Advanced:')}
  ${c.dim('serve')} [dir]                  Start typed MCP server
  ${c.dim('inspect')} [dir]                Show parsed interface + permissions

${c.bold('Flags:')}
  --help, -h       Show this help
  --version, -v    Show version
  --json           Machine-readable output
  --no-color       Disable color output
  --target, -t     Compile target

${c.dim(`v${getVersion()}`)}
`);
}

export async function run(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      help:    { type: 'boolean', short: 'h' },
      version: { type: 'boolean', short: 'v' },
      target:  { type: 'string',  short: 't' },
      json:    { type: 'boolean' },
      strict:  { type: 'boolean' },
      'from-mcp': { type: 'boolean' },
      template: { type: 'string' },
    },
  });

  if (values.version) { console.log(getVersion()); process.exit(0); }
  if (values.help || positionals.length === 0) { showHelp(); process.exit(0); }

  const command = positionals[0];
  const dir = positionals[1] || '.';

  try {
    switch (command) {
      case 'check': {
        const { runCheck } = await import('./commands/check.js');
        process.exit(await runCheck(dir, { json: values.json }));
        break;
      }
      case 'compile': {
        const { runCompile } = await import('./commands/compile.js');
        process.exit(await runCompile(dir, { target: values.target, json: values.json }));
        break;
      }
      case 'init': {
        const { runInit } = await import('./commands/init.js');
        process.exit(await runInit(dir, { fromMcp: values['from-mcp'], template: values.template }));
        break;
      }
      case 'serve': {
        const { runServe } = await import('./commands/serve.js');
        await runServe(dir, { strict: values.strict });
        break;
      }
      case 'inspect': {
        const { runInspect } = await import('./commands/inspect.js');
        process.exit(await runInspect(dir, { json: values.json }));
        break;
      }
      default:
        console.error(c.red(`Unknown command: ${command}`));
        console.error(`Run ${c.cyan('effector --help')} for usage.`);
        process.exit(1);
    }
  } catch (err) {
    console.error(c.red(`Error: ${err.message}`));
    if (process.env.DEBUG) console.error(err.stack);
    process.exit(2);
  }
}
