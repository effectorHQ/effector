#!/usr/bin/env node
/**
 * effector-audit — CLI entry (security scan of a skill / repo tree).
 */
import { scan } from '../src/scanner/analyzer.js';

const args = process.argv.slice(2);
if (args.includes('-h') || args.includes('--help')) {
  console.log(`Usage: effector-audit [path] [--json]

  path     Directory to scan (default: current directory)
  --json   Print findings as JSON`);
  process.exit(0);
}

const json = args.includes('--json');
const positional = args.filter((a) => !a.startsWith('-'));
const targetPath = positional[0] ? positional[0] : '.';

await scan(targetPath, { format: json ? 'json' : undefined });
