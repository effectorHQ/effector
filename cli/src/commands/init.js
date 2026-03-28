/**
 * effector init [dir]
 *
 * Creates a zero-modification working skill manifest.
 * The generated files pass `effector check` and `effector compile` immediately.
 *
 * --from-mcp    Reverse-compile an existing MCP server
 * --template    Use a specific template (skill|workflow|extension|minimal)
 */

import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';

const NO_COLOR = process.env.NO_COLOR !== undefined;
const c = {
  green:  s => NO_COLOR ? s : `\x1b[32m${s}\x1b[0m`,
  cyan:   s => NO_COLOR ? s : `\x1b[36m${s}\x1b[0m`,
  dim:    s => NO_COLOR ? s : `\x1b[2m${s}\x1b[0m`,
  red:    s => NO_COLOR ? s : `\x1b[31m${s}\x1b[0m`,
};

const TEMPLATES = {
  skill: {
    toml: name => `[effector]
name = "${name}"
version = "0.1.0"
description = "Reviews code diffs and produces structured review reports"
type = "skill"

[effector.interface]
input = "CodeDiff"
output = "ReviewReport"
context = ["Repository", "GitHubCredentials"]

[effector.permissions]
network = true
subprocess = false
filesystem = ["read"]
env-read = ["GITHUB_TOKEN"]`,
    skill: name => `---
name: ${name}
version: 0.1.0
description: Reviews code diffs and produces structured review reports
tags: [code-review, analysis]
---

# ${name}

You are a code review assistant. When given a code diff, analyze it and produce a structured review report.

## Instructions

1. Read the provided code diff carefully
2. Identify potential issues: bugs, security vulnerabilities, style problems
3. Provide actionable suggestions with line references
4. Rate overall quality on a 1-5 scale

## Output Format

Return a JSON object with:
- \`findings\`: array of \`{ line, severity, message, suggestion }\`
- \`score\`: overall quality score (1-5)
- \`summary\`: one-paragraph summary
`,
  },

  workflow: {
    toml: name => `[effector]
name = "${name}"
version = "0.1.0"
description = "End-to-end deployment workflow: test, build, deploy"
type = "workflow"

[effector.interface]
input = "RepositoryRef"
output = "DeploymentStatus"
context = ["AWSCredentials", "GitHubCredentials"]

[effector.permissions]
network = true
subprocess = true
filesystem = ["read", "write"]
env-read = ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "GITHUB_TOKEN"]`,
    skill: name => `---
name: ${name}
version: 0.1.0
description: End-to-end deployment workflow
tags: [deploy, ci-cd, workflow]
---

# ${name}

You are a deployment orchestrator. Given a repository reference, run the full deploy pipeline.

## Steps

1. Clone or pull the repository
2. Run tests: \`npm test\`
3. Build: \`npm run build\`
4. Deploy to staging, then production

## Output Format

Return a JSON object with:
- \`success\`: boolean
- \`url\`: deployed URL
- \`duration\`: time in seconds
`,
  },

  extension: {
    toml: name => `[effector]
name = "${name}"
version = "0.1.0"
description = "Syncs data with external service"
type = "extension"

[effector.interface]
input = "JSON"
output = "OperationStatus"
context = ["GenericAPIKey"]

[effector.permissions]
network = true
subprocess = false
filesystem = []
env-read = ["API_TOKEN"]`,
    skill: name => `---
name: ${name}
version: 0.1.0
description: Syncs data with external service
tags: [sync, integration]
---

# ${name}

You are a data sync assistant. Given JSON input, sync it with the configured external service.

## Instructions

1. Parse the input JSON
2. Transform data to the target format
3. Send to the external API
4. Report success or failure

## Output Format

Return a JSON object with:
- \`success\`: boolean
- \`message\`: status message
`,
  },

  minimal: {
    toml: name => `[effector]
name = "${name}"
version = "0.1.0"
description = "A simple text processor"
type = "skill"

[effector.interface]
input = "String"
output = "String"`,
    skill: name => `---
name: ${name}
version: 0.1.0
description: A simple text processor
---

# ${name}

Process the input text and return the result.
`,
  },
};

export async function runInit(dir, opts = {}) {
  const absDir = resolve(dir);

  // --from-mcp: reverse compile
  if (opts.fromMcp) {
    return runFromMcp(absDir);
  }

  const name = basename(absDir) === '.' ? 'my-skill' : basename(absDir);
  const templateName = opts.template || 'skill';
  const template = TEMPLATES[templateName];

  if (!template) {
    console.error(c.red(`  Unknown template: "${templateName}"`));
    console.error(c.dim(`  Available: ${Object.keys(TEMPLATES).join(', ')}`));
    return 1;
  }

  if (!existsSync(absDir)) {
    mkdirSync(absDir, { recursive: true });
  }

  const tomlPath = join(absDir, 'effector.toml');
  const skillPath = join(absDir, 'SKILL.md');

  if (existsSync(tomlPath)) {
    console.error(c.red('  effector.toml already exists'));
    console.error(c.dim('  → Delete it first, or use a different directory'));
    return 1;
  }

  writeFileSync(tomlPath, template.toml(name) + '\n');
  writeFileSync(skillPath, template.skill(name));

  console.log();
  console.log(`  ${c.green('✓')} Created ${c.cyan('effector.toml')}`);
  console.log(`  ${c.green('✓')} Created ${c.cyan('SKILL.md')}`);
  console.log();
  console.log(`  ${c.dim('→ Next:')} ${c.cyan('effector check .')}`);
  console.log();

  return 0;
}

async function runFromMcp(dir) {
  try {
    const { reverseMCP } = await import('@effectorhq/core');
    if (!reverseMCP) throw new Error('reverseMCP not available');

    const result = await reverseMCP(dir);
    const tomlPath = join(dir, 'effector.toml');
    writeFileSync(tomlPath, result.toml);

    console.log();
    console.log(`  ${c.green('✓')} Reverse-compiled MCP server`);
    if (result.tools) console.log(`  ${c.dim(`  Found ${result.tools.length} tool(s)`)}`);
    console.log(`  ${c.green('✓')} Created ${c.cyan('effector.toml')}`);
    console.log();
    console.log(`  ${c.dim('→ Review the generated manifest, then run:')} ${c.cyan('effector check .')}`);
    console.log();
    return 0;
  } catch (e) {
    console.error(c.red(`  Failed to reverse-compile: ${e.message}`));
    return 1;
  }
}
