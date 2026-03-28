#!/usr/bin/env node

/**
 * skill-lint CLI
 * Validates SKILL.md files before publishing to ClawHub
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseSkillFile, extractMetadata } from '../src/parser.js';
import { validateSkill } from '../src/rules.js';
import { reportResults, printHelp, printVersion } from '../src/reporter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Main CLI function
 */
async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  let filePath = './SKILL.md';
  let quiet = false;
  let json = false;
  let showHelp = false;
  let showVersion = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '-h' || arg === '--help') {
      showHelp = true;
    } else if (arg === '-v' || arg === '--version') {
      showVersion = true;
    } else if (arg === '-q' || arg === '--quiet') {
      quiet = true;
    } else if (arg === '--json') {
      json = true;
    } else if (!arg.startsWith('-')) {
      filePath = arg;
    }
  }

  // Handle help and version
  if (showHelp) {
    printHelp();
    process.exit(0);
  }

  if (showVersion) {
    printVersion();
    process.exit(0);
  }

  // Resolve file path
  const resolvedPath = path.resolve(filePath);

  // Check if file exists
  if (!fs.existsSync(resolvedPath)) {
    if (!json) {
      console.error(`\x1b[31m✖ File not found: ${resolvedPath}\x1b[0m\n`);
    } else {
      console.log(JSON.stringify({
        file: resolvedPath,
        error: 'File not found',
        valid: false
      }, null, 2));
    }
    process.exit(1);
  }

  // Read file
  let content;
  try {
    content = fs.readFileSync(resolvedPath, 'utf-8');
  } catch (err) {
    if (!json) {
      console.error(`\x1b[31m✖ Error reading file: ${err.message}\x1b[0m\n`);
    } else {
      console.log(JSON.stringify({
        file: resolvedPath,
        error: err.message,
        valid: false
      }, null, 2));
    }
    process.exit(1);
  }

  // Parse file
  const parsed = parseSkillFile(content);

  if (!parsed.valid) {
    if (!json) {
      console.error(`\x1b[31m✖ Parse error: ${parsed.error}\x1b[0m\n`);
    } else {
      console.log(JSON.stringify({
        file: resolvedPath,
        error: parsed.error,
        valid: false
      }, null, 2));
    }
    process.exit(1);
  }

  // Extract metadata
  const metadata = extractMetadata(parsed.parsed);

  // Validate
  const results = validateSkill(metadata, parsed.body);

  // Report
  const exitCode = reportResults(resolvedPath, results, { quiet, json });

  process.exit(exitCode);
}

// Run CLI
main().catch(err => {
  console.error(`\x1b[31m✖ Unexpected error: ${err.message}\x1b[0m\n`);
  process.exit(1);
});
