#!/usr/bin/env node
/**
 * effector-compose — minimal CLI: type-check a pipeline YAML against a local registry.
 */
import { readFileSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import { parsePipeline, typeCheck } from '../src/index.js';
import { loadRegistry } from '../src/registry.js';

function printHelp() {
  console.log(`Usage: effector-compose check <pipeline.yml> [--registry <dir>]

  --registry <dir>   Directory containing effector.toml files (default: current directory)
  -h, --help         Show this help`);
}

const args = process.argv.slice(2);
if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
  printHelp();
  process.exit(args.length === 0 ? 1 : 0);
}

const checkIdx = args.indexOf('check');
if (checkIdx === -1) {
  printHelp();
  process.exit(1);
}

const pipelinePath = args[checkIdx + 1];
if (!pipelinePath) {
  console.error('error: missing pipeline file after "check"');
  process.exit(1);
}

let registryDir = resolvePath(process.cwd());
const rIdx = args.indexOf('--registry');
if (rIdx !== -1 && args[rIdx + 1]) {
  registryDir = resolvePath(args[rIdx + 1]);
}

const yaml = readFileSync(pipelinePath, 'utf-8');
const pipeline = parsePipeline(yaml);
const registry = loadRegistry(registryDir);
const result = typeCheck(pipeline, registry);

if (!result.valid) {
  for (const e of result.errors) {
    console.error(`${e.step ?? '?'}: ${e.message}`);
  }
  process.exit(1);
}

console.log('✓ Pipeline type-check passed');
