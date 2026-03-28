/**
 * Reporter for formatting validation results with colored output
 */

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

const SEVERITY_COLORS = {
  error: COLORS.red,
  warning: COLORS.yellow,
  info: COLORS.cyan
};

const SEVERITY_ICONS = {
  error: '✖',
  warning: '⚠',
  info: 'ℹ'
};

/**
 * Format and print validation results
 * @param {string} filePath - Path to the SKILL.md file
 * @param {Array} results - Array of validation results
 * @param {Object} options - Reporting options
 * @returns {number} - Exit code (0 if no errors, 1 if errors found)
 */
export function reportResults(filePath, results, options = {}) {
  const { quiet = false, json = false } = options;

  if (json) {
    return reportJson(filePath, results);
  }

  const errors = results.filter(r => r.severity === 'error');
  const warnings = results.filter(r => r.severity === 'warning');
  const infos = results.filter(r => r.severity === 'info');

  // JSON output for programmatic use
  if (!quiet) {
    console.log(`\n${COLORS.bright}${COLORS.cyan}Validating: ${filePath}${COLORS.reset}\n`);
  }

  // Print grouped results
  if (errors.length > 0) {
    console.log(`${SEVERITY_COLORS.error}${COLORS.bright}${SEVERITY_ICONS.error} Errors (${errors.length}):${COLORS.reset}`);
    errors.forEach(result => {
      console.log(`  ${SEVERITY_COLORS.error}${result.rule}:${COLORS.reset} ${result.message}`);
    });
    console.log();
  }

  if (warnings.length > 0) {
    console.log(`${SEVERITY_COLORS.warning}${COLORS.bright}${SEVERITY_ICONS.warning} Warnings (${warnings.length}):${COLORS.reset}`);
    warnings.forEach(result => {
      console.log(`  ${SEVERITY_COLORS.warning}${result.rule}:${COLORS.reset} ${result.message}`);
    });
    console.log();
  }

  if (!quiet && infos.length > 0) {
    console.log(`${SEVERITY_COLORS.info}${COLORS.bright}${SEVERITY_ICONS.info} Info (${infos.length}):${COLORS.reset}`);
    infos.forEach(result => {
      console.log(`  ${SEVERITY_COLORS.info}${result.rule}:${COLORS.reset} ${result.message}`);
    });
    console.log();
  }

  // Summary
  const total = errors.length + warnings.length + infos.length;
  if (total === 0) {
    console.log(`${COLORS.green}${COLORS.bright}✓ No issues found!${COLORS.reset}\n`);
    return 0;
  }

  const summary = [];
  if (errors.length > 0) summary.push(`${errors.length} error${errors.length !== 1 ? 's' : ''}`);
  if (warnings.length > 0) summary.push(`${warnings.length} warning${warnings.length !== 1 ? 's' : ''}`);
  if (infos.length > 0 && !quiet) summary.push(`${infos.length} info`);

  const finalStatus = errors.length > 0
    ? `${SEVERITY_COLORS.error}${COLORS.bright}✖ ${summary.join(', ')}${COLORS.reset}`
    : `${SEVERITY_COLORS.warning}${COLORS.bright}⚠ ${summary.join(', ')}${COLORS.reset}`;

  console.log(finalStatus);
  console.log();

  return errors.length > 0 ? 1 : 0;
}

/**
 * Output results in JSON format
 */
function reportJson(filePath, results) {
  const output = {
    file: filePath,
    valid: results.filter(r => r.severity === 'error').length === 0,
    summary: {
      errors: results.filter(r => r.severity === 'error').length,
      warnings: results.filter(r => r.severity === 'warning').length,
      infos: results.filter(r => r.severity === 'info').length
    },
    results
  };

  console.log(JSON.stringify(output, null, 2));

  return output.valid ? 0 : 1;
}

/**
 * Print usage help
 */
export function printHelp() {
  console.log(`
${COLORS.bright}skill-lint${COLORS.reset} - Validate OpenClaw SKILL.md files

${COLORS.bright}Usage:${COLORS.reset}
  skill-lint [OPTIONS] [file]

${COLORS.bright}Arguments:${COLORS.reset}
  file                 Path to SKILL.md file (default: ./SKILL.md)

${COLORS.bright}Options:${COLORS.reset}
  -h, --help          Show this help message
  -v, --version       Show version number
  -q, --quiet         Suppress info messages
  --json              Output results as JSON
  --fix               Attempt to auto-fix common issues (not yet implemented)

${COLORS.bright}Examples:${COLORS.reset}
  skill-lint SKILL.md
  skill-lint --json path/to/SKILL.md
  skill-lint -q                           # Quiet mode, show only errors/warnings
`);
}

/**
 * Print version
 */
export function printVersion() {
  console.log('skill-lint v0.1.0');
}
