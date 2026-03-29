/**
 * Tests for src/converter.js
 *
 * Tests the SKILL.md to MCP tool conversion functionality.
 * Uses Node.js built-in test runner.
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { skillToMCPTool, validateSkillForMCP, normalizeToolName } from '../../src/mcp/converter.js';

test('skillToMCPTool: basic conversion', () => {
  const skill = {
    frontmatter: {
      name: 'EmailSender',
      description: 'Send emails via SMTP',
    },
    body: '# Email Sender\n\nThis skill sends emails.',
    path: './skills/email-sender.md',
  };

  const tool = skillToMCPTool(skill);

  assert.strictEqual(tool.name, 'email_sender');
  assert.strictEqual(tool.description, 'Send emails via SMTP');
  assert.strictEqual(tool.inputSchema.type, 'object');
  assert.deepStrictEqual(tool.inputSchema.properties, {});
});

test('skillToMCPTool: with environment variables', () => {
  const skill = {
    frontmatter: {
      name: 'EmailSender',
      description: 'Send emails via SMTP',
      requires: {
        env: ['SMTP_HOST', 'SMTP_PORT', 'EMAIL_USER'],
      },
    },
    body: '# Email Sender',
    path: './skills/email-sender.md',
  };

  const tool = skillToMCPTool(skill);

  assert.strictEqual(tool.name, 'email_sender');
  assert.ok(tool.inputSchema.properties.SMTP_HOST);
  assert.strictEqual(tool.inputSchema.properties.SMTP_HOST.type, 'string');
  assert.ok(tool.inputSchema.properties.SMTP_PORT);
  assert.ok(tool.inputSchema.properties.EMAIL_USER);
  assert.deepStrictEqual(tool.inputSchema.required, ['SMTP_HOST', 'SMTP_PORT', 'EMAIL_USER']);
});

test('skillToMCPTool: missing name throws error', () => {
  const skill = {
    frontmatter: {
      description: 'A skill without a name',
    },
    body: '',
    path: './skills/unnamed.md',
  };

  assert.throws(
    () => skillToMCPTool(skill),
    (error) => error.message.includes('must have a "name" field')
  );
});

test('skillToMCPTool: missing description uses default', () => {
  const skill = {
    frontmatter: {
      name: 'MySkill',
    },
    body: '',
    path: './skills/my-skill.md',
  };

  const tool = skillToMCPTool(skill);

  assert.strictEqual(tool.description, 'No description provided');
});

test('skillToMCPTool: includes metadata', () => {
  const skill = {
    frontmatter: {
      name: 'MySkill',
      description: 'Test skill',
      version: '1.0.0',
      author: 'Test Author',
    },
    body: '',
    path: './skills/my-skill.md',
  };

  const tool = skillToMCPTool(skill);

  assert.ok(tool._metadata);
  assert.strictEqual(tool._metadata.version, '1.0.0');
  assert.strictEqual(tool._metadata.author, 'Test Author');
  assert.strictEqual(tool._metadata.skillPath, './skills/my-skill.md');
});

test('normalizeToolName: converts to lowercase', () => {
  assert.strictEqual(normalizeToolName('MySkill'), 'my_skill');
  assert.strictEqual(normalizeToolName('EMAIL_SENDER'), 'email_sender');
});

test('normalizeToolName: replaces spaces with underscores', () => {
  assert.strictEqual(normalizeToolName('My Cool Skill'), 'my_cool_skill');
  assert.strictEqual(normalizeToolName('Send Email'), 'send_email');
});

test('normalizeToolName: removes special characters', () => {
  assert.strictEqual(normalizeToolName('Email@Sender!'), 'email_sender');
  assert.strictEqual(normalizeToolName('My-Skill.v2'), 'my_skill_v2');
});

test('normalizeToolName: handles leading numbers', () => {
  const result = normalizeToolName('3POMailer');
  assert.ok(result.startsWith('skill_'));
  assert.ok(result.includes('3po'));
});

test('normalizeToolName: collapses multiple underscores', () => {
  assert.strictEqual(normalizeToolName('My  Cool  Skill'), 'my_cool_skill');
  assert.strictEqual(normalizeToolName('Test___Skill'), 'test_skill');
});

test('validateSkillForMCP: valid skill has no warnings', () => {
  const skill = {
    frontmatter: {
      name: 'ValidSkill',
      description: 'A valid skill',
    },
    body: '',
    path: '',
  };

  const warnings = validateSkillForMCP(skill);
  assert.strictEqual(warnings.length, 0);
});

test('validateSkillForMCP: missing name produces warning', () => {
  const skill = {
    frontmatter: {
      description: 'No name here',
    },
    body: '',
    path: '',
  };

  const warnings = validateSkillForMCP(skill);
  assert.ok(warnings.some((w) => w.includes('name')));
});

test('validateSkillForMCP: missing description produces warning', () => {
  const skill = {
    frontmatter: {
      name: 'MySkill',
    },
    body: '',
    path: '',
  };

  const warnings = validateSkillForMCP(skill);
  assert.ok(warnings.some((w) => w.includes('description')));
});

test('validateSkillForMCP: unsupported requires fields', () => {
  const skill = {
    frontmatter: {
      name: 'MySkill',
      description: 'Test',
      requires: {
        env: ['VAR1'],
        files: ['file.txt'],
      },
    },
    body: '',
    path: '',
  };

  const warnings = validateSkillForMCP(skill);
  assert.ok(warnings.some((w) => w.includes('Unsupported')));
  assert.ok(warnings.some((w) => w.includes('files')));
});

test('skillToMCPTool: empty env array', () => {
  const skill = {
    frontmatter: {
      name: 'MySkill',
      description: 'Test skill',
      requires: {
        env: [],
      },
    },
    body: '',
    path: '',
  };

  const tool = skillToMCPTool(skill);

  assert.strictEqual(tool.inputSchema.type, 'object');
  assert.deepStrictEqual(tool.inputSchema.properties, {});
  assert.strictEqual(tool.inputSchema.required, undefined);
});

test('skillToMCPTool: filters null/undefined env vars', () => {
  const skill = {
    frontmatter: {
      name: 'MySkill',
      description: 'Test skill',
      requires: {
        env: ['VAR1', null, undefined, 'VAR2', ''],
      },
    },
    body: '',
    path: '',
  };

  const tool = skillToMCPTool(skill);

  assert.deepStrictEqual(tool.inputSchema.required, ['VAR1', 'VAR2']);
  assert.ok(tool.inputSchema.properties.VAR1);
  assert.ok(tool.inputSchema.properties.VAR2);
  assert.strictEqual(Object.keys(tool.inputSchema.properties).length, 2);
});
